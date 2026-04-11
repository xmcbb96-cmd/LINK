// 4. 状态管理器
// ==========================================

const useMultiplayerStore = defineStore('multiplayer', () => {
    const isConnected = ref(false);
    const mode = ref('disconnected');
    const isHost = ref(false);

    const users = ref([]);
    const chatLogs = ref([]);

    const pendingInputs = shallowRef(new Map());
    const pendingInputsVersion = ref(0);

    const pendingPersonas = shallowRef(new Map());
    const acuSyncState = ref({ fullSynced: false, lastSyncTimestamp: 0, isolationKey: '' });

    // 仅用于“隐藏模式”重roll时补回隐藏输入上下文（不直接展示到用户层）
    const hiddenRerollContext = ref('');
    const setHiddenRerollContext = (content = '') => {
        hiddenRerollContext.value = (content || '').toString().trim();
    };
    const getHiddenRerollContext = () => {
        return (hiddenRerollContext.value || '').toString().trim();
    };

    const settings = reactive({
        onlineMode: true,
        onlineServer: 'https://room.yufugemini.cloud',
        defaultUserName: '',
        timedInputSeconds: 0
    });

    // 变量模式（需跨组件/跨模块访问，必须放在 store 中）
    const _VM_KEY = 'st_multiplayer_variable_mode';
    const variableMode = ref(localStorage.getItem(_VM_KEY) || 'none');
    watch(variableMode, (v) => {
        localStorage.setItem(_VM_KEY, v);
    });

    const spectatorMode = ref(false);

    let networkClient = null;
    let userJoinOrderSeed = 0;

    // 房主限时发送计时器
    let timeoutTimer = null;
    let lastPendingSize = 0;

    // 自动重连状态
    let reconnectTimer = null;
    let reconnectAttempt = 0;
    const reconnectDelays = [1000, 2000, 4000];
    let reconnectContext = null;
    let sessionEstablished = false;
    let manualDisconnect = false;

    const NO_ROOM_KEY = '__no_room__';
    const currentRoomId = ref('');
    const MAX_CHAT_LOGS = 50;

    // 仅会话内存日志，不做本地持久化
    const roomLogsMap = ref({});
    const errorLogDedupSet = new Set();

    // -------------------------
    // 工具函数
    // -------------------------
    const normalizeRoomKey = (roomId = '') => ((roomId || '').toString().trim().toLowerCase() || NO_ROOM_KEY);
    const normalizeUserName = (name = '') => name.trim().toLowerCase();
    const normalizeUid = (uid = '') => uid.toString().trim().toLowerCase();

    const makeBoundUserId = (roomId, uid) => {
        const roomKey = (roomId || 'global').toString().trim().toLowerCase();
        const uidKey = normalizeUid(uid || 'uid_anonymous') || 'uid_anonymous';
        return `u_${encodeURIComponent(roomKey)}_${encodeURIComponent(uidKey)}`;
    };

    const normalizeIncomingUser = (user = {}) => {
        const hasHostField =
            Object.prototype.hasOwnProperty.call(user, 'isHost') ||
            Object.prototype.hasOwnProperty.call(user, 'host');

        const hasSpectatorField =
            Object.prototype.hasOwnProperty.call(user, 'isSpectator') ||
            Object.prototype.hasOwnProperty.call(user, 'spectator') ||
            Object.prototype.hasOwnProperty.call(user, 'is_observer') ||
            Object.prototype.hasOwnProperty.call(user, 'observer');

        return {
            id: user.id,
            name: user.name || user.fromName || '匿名',
            isHost: !!(user.isHost ?? user.host ?? false),
            isSpectator: !!(user.isSpectator ?? user.spectator ?? user.is_observer ?? user.observer ?? false),
            hasHostField,
            hasSpectatorField
        };
    };

    const touchPendingInputs = () => {
        pendingInputsVersion.value++;
        triggerRef(pendingInputs);
    };

    const clearPendingInputs = () => {
        pendingInputs.value.clear();
        touchPendingInputs();
        if (timeoutTimer) {
            clearTimeout(timeoutTimer);
            timeoutTimer = null;
        }
    };

    const getJoinOrder = (u, idx = 0) => Number.isFinite(u?._joinOrder) ? u._joinOrder : (idx + 1);

    const buildUsersSnapshot = () => {
        return users.value.map((u, idx) => ({
            id: u.id,
            name: u.name || '匿名',
            isHost: !!u.isHost,
            isSpectator: !!u.isSpectator,
            _joinOrder: getJoinOrder(u, idx)
        }));
    };

    const buildPendingInputsSnapshot = () => {
        return Array.from(pendingInputs.value.entries())
            .map(([userId, data]) => ({
                userId,
                userName: data?.userName || '匿名',
                content: (data?.content ?? '').toString(),
                prefix: data?.prefix || '[{name}]:',
                suffix: (data?.suffix ?? '').toString(),
                submittedAt: Number(data?.submittedAt || 0),
                hideContent: !!data?.hideContent
            }))
            .filter(item => item.content.trim().length > 0)
            .sort((a, b) => {
                if (a.submittedAt !== b.submittedAt) return a.submittedAt - b.submittedAt;
                return String(a.userId).localeCompare(String(b.userId), 'zh-CN');
            });
    };

    const pickNextHostCandidate = () => {
        return users.value
            .filter(u => !u.isSpectator)
            .slice()
            .sort((a, b) => {
                const d = getJoinOrder(a) - getJoinOrder(b);
                if (d !== 0) return d;
                return String(a.id).localeCompare(String(b.id), 'zh-CN');
            })[0] || null;
    };

    // -------------------------
    // 日志相关
    // -------------------------
    const buildDisplayLogs = (roomId = '') => {
        const key = normalizeRoomKey(roomId);
        const logs = Array.isArray(roomLogsMap.value[key]) ? roomLogsMap.value[key] : [];

        return logs
            .filter(item => item?.type === 'chat' || item?.type === 'error')
            .sort((a, b) => {
                const ta = Number(a?.timestamp || 0);
                const tb = Number(b?.timestamp || 0);
                if (ta !== tb) return ta - tb;
                return String(a?.id || '').localeCompare(String(b?.id || ''), 'zh-CN');
            });
    };

    const refreshCurrentRoomLogs = () => {
        chatLogs.value = buildDisplayLogs(currentRoomId.value);
    };

    const switchRoomLogs = (roomId = '') => {
        currentRoomId.value = (roomId || '').toString().trim();
        const key = normalizeRoomKey(currentRoomId.value);
        roomLogsMap.value[key] = [];
        chatLogs.value = [];
    };

    const pruneRoomLogsByExistingRoomIds = (roomIds = []) => {
        const keepKeys = new Set(roomIds.map(id => normalizeRoomKey(id)));
        const next = {};

        Object.entries(roomLogsMap.value || {}).forEach(([k, logs]) => {
            if (k === NO_ROOM_KEY || keepKeys.has(k)) {
                next[k] = Array.isArray(logs) ? logs.slice(-MAX_CHAT_LOGS) : [];
            }
        });

        roomLogsMap.value = next;

        const currentKey = normalizeRoomKey(currentRoomId.value);
        if (currentKey !== NO_ROOM_KEY && !keepKeys.has(currentKey)) {
            currentRoomId.value = '';
            chatLogs.value = [];
        } else {
            refreshCurrentRoomLogs();
        }
    };

    const clearRoomLogCache = (roomId = '') => {
        const key = normalizeRoomKey(roomId || currentRoomId.value);
        if (key === NO_ROOM_KEY) return;

        if (Object.prototype.hasOwnProperty.call(roomLogsMap.value, key)) {
            delete roomLogsMap.value[key];
        }

        if (normalizeRoomKey(currentRoomId.value) === key) {
            chatLogs.value = [];
        }
    };

    const addLog = (type, from, content) => {
        if (type !== 'chat' && type !== 'error') return;

        const key = normalizeRoomKey(currentRoomId.value);
        const text = (content ?? '').toString();

        if (type === 'error') {
            const dedupKey = `${key}::${text.trim()}`;
            if (errorLogDedupSet.has(dedupKey)) return;
            errorLogDedupSet.add(dedupKey);
        }

        const item = {
            id: `log-${Date.now()}-${Math.random()}`,
            type,
            from,
            content: text,
            timestamp: Date.now()
        };

        const list = Array.isArray(roomLogsMap.value[key]) ? [...roomLogsMap.value[key]] : [];
        list.push(item);
        roomLogsMap.value[key] = list.slice(-MAX_CHAT_LOGS);

        if (key === normalizeRoomKey(currentRoomId.value)) {
            refreshCurrentRoomLogs();
        }
    };

    // -------------------------
    // 重连相关
    // -------------------------
    const clearReconnectTimer = () => {
        if (!reconnectTimer) return;
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    };

    const scheduleReconnect = () => {
        if (manualDisconnect || !reconnectContext || reconnectTimer || isConnected.value) return;

        const idx = Math.min(reconnectAttempt, reconnectDelays.length - 1);
        const delay = reconnectDelays[idx];
        reconnectAttempt++;

        reconnectTimer = setTimeout(async () => {
            reconnectTimer = null;
            if (manualDisconnect || isConnected.value || !reconnectContext) return;

            try {
                await connectOnline(
                    reconnectContext.roomId,
                    reconnectContext.pwd,
                    reconnectContext.name,
                    reconnectContext.uid,
                    { isReconnect: true }
                );
            } catch (e) {
                const status = Number(e?.status || 0);
                const msg = String(e?.message || '');

                // 404 / 房间不存在：判定为不可恢复错误，停止重连
                if (status === 404 || /404|房间不存在|已关闭/.test(msg)) {
                    addLog('error', '系统', '房间已不存在，已停止自动重连');
                    reconnectContext = null;
                    reconnectAttempt = 0;
                    clearReconnectTimer();
                    mode.value = 'disconnected';
                    return;
                }

                scheduleReconnect();
            }
        }, delay);
    };



    // -------------------------
    // 用户/连接处理
    // -------------------------
    const syncHostStateIfNeeded = () => {
        if (!isHost.value) return;
        networkClient?.broadcast({
            type: 'sync_user_state',
            data: { users: buildUsersSnapshot() }
        });
    };

    const ensureMeExists = () => {
        const myId = networkClient?.userId;
        if (!myId) return;

        const me = users.value.find(u => u.id === myId);
        if (me) return;

        users.value.push({
            id: myId,
            name: networkClient?.userName || '我',
            isHost: false,
            isSpectator: !!networkClient?.isSpectator,
            _joinOrder: ++userJoinOrderSeed
        });
    };

    const upsertUser = (user) => {
        const normalized = normalizeIncomingUser(user);
        const selfId = networkClient?.userId || '';

        const target = users.value.find(u => u.id === normalized.id);
        if (!target) {
            users.value.push({
                id: normalized.id,
                name: normalized.name,
                isHost: normalized.id === selfId
                    ? (!!normalized.isHost && !networkClient?.isSpectator)
                    : normalized.isHost,
                isSpectator: normalized.id === selfId
                    ? !!networkClient?.isSpectator
                    : normalized.isSpectator,
                _joinOrder: ++userJoinOrderSeed
            });
        } else {
            const oldId = target.id;
            const idChanged = !!(normalized.id && target.id !== normalized.id);

            if (idChanged) {
                target.id = normalized.id;
                if (pendingInputs.value.has(oldId)) {
                    const oldInput = pendingInputs.value.get(oldId);
                    pendingInputs.value.delete(oldId);
                    pendingInputs.value.set(normalized.id, oldInput);
                    touchPendingInputs();
                }
            }

            if (normalized.hasHostField) target.isHost = normalized.isHost;
            if (normalized.hasSpectatorField) target.isSpectator = normalized.isSpectator;
            if (normalized.name && normalized.name !== target.name) target.name = normalized.name;

            if (normalized.id === selfId) {
                target.isSpectator = !!networkClient?.isSpectator;
                if (target.isSpectator) target.isHost = false;
            }

            if (!target.isHost && idChanged) {
                target._joinOrder = ++userJoinOrderSeed;
            } else if (!Number.isFinite(target._joinOrder)) {
                target._joinOrder = ++userJoinOrderSeed;
            }
        }

        if (normalized.id === selfId) {
            const me = users.value.find(u => u.id === selfId);
            isHost.value = !!(me?.isHost && !me?.isSpectator);
            mode.value = me?.isSpectator ? 'spectator' : 'client';
        }

        syncHostStateIfNeeded();
    };

    const handleUserLeave = (userId) => {
        const idx = users.value.findIndex(u => u.id === userId);
        if (idx === -1) return;

        const leaving = users.value[idx];
        const wasHost = !!leaving.isHost;

        users.value.splice(idx, 1);
        pendingInputs.value.delete(userId);
        touchPendingInputs();

        if (!wasHost || !isConnected.value) return;

        const nextHost = pickNextHostCandidate();
        if (!nextHost) {
            clearRoomLogCache(currentRoomId.value);
            disconnect();
            return;
        }

        users.value.forEach(u => {
            u.isHost = (u.id === nextHost.id);
        });

        isHost.value = nextHost.id === (networkClient?.userId || '');
        if (isHost.value) {
            mode.value = 'client';
            networkClient?.broadcast({
                type: 'host_change',
                data: { hostId: nextHost.id, hostName: nextHost.name }
            });
            syncHostStateIfNeeded();
        }
    };

    const initNetwork = (forceOnline = settings.onlineMode) => {
        if (networkClient) {
            try { networkClient.disconnect(); } catch (e) {}
        }

        networkClient = forceOnline ? new WebSocketClient() : new LocalChannelClient();

        networkClient.init({
            onConnectionChange: (status) => {
                isConnected.value = status;

                if (status) {
                    sessionEstablished = true;
                    reconnectAttempt = 0;
                    clearReconnectTimer();
                    return;
                }

                users.value = [];
                clearPendingInputs();

                if (timeoutTimer) {
                    clearTimeout(timeoutTimer);
                    timeoutTimer = null;
                }

                const canAutoReconnect =
                    settings.onlineMode &&
                    !manualDisconnect &&
                    sessionEstablished &&
                    !!reconnectContext;

                if (canAutoReconnect) {
                    mode.value = 'reconnecting';
                    scheduleReconnect();
                    return;
                }

                mode.value = 'disconnected';
                currentRoomId.value = '';
                chatLogs.value = [];
            },

            onError: (msg) => addLog('error', '系统', msg),

            onUserJoin: (user) => upsertUser(user),

            onUserLeave: (userId) => handleUserLeave(userId),

            onMessage: (msg) => {
                const myId = (networkClient?.userId || '').toString();

                const emitMap = {
                    ai_stream: 'multiplayer_ai_stream',
                    delete_last_message: 'multiplayer_delete_last_message',
                    request_input: 'multiplayer_request_input',
                    sync_history_data: 'multiplayer_sync_history_data',
                    sync_regex_data: 'multiplayer_sync_regex_data',
                    acu_full_sync: 'multiplayer_acu_full_sync',
                    acu_delta_sync: 'multiplayer_acu_delta_sync'
                };

                switch (msg.type) {
                    case 'chat':
                        if (msg.from !== myId) addLog('chat', msg.fromName, msg.data.content);
                        break;

                    case 'rename': {
                        const newName = (msg.data?.name || msg.fromName || '').trim();
                        if (!newName) break;

                        const duplicated = users.value.find(
                            u => u.id !== msg.from && normalizeUserName(u.name) === normalizeUserName(newName)
                        );
                        if (duplicated) {
                            addLog('error', '系统', `用户名 "${newName}" 已存在，重命名被忽略`);
                            break;
                        }

                        const target = users.value.find(u => u.id === msg.from);
                        if (target) target.name = newName;
                        break;
                    }

                    case 'user_input':
                        pendingInputs.value.set(msg.from, {
                            userName: msg.fromName,
                            content: msg.data.content,
                            prefix: msg.data.messagePrefix,
                            suffix: msg.data.messageSuffix || '',
                            submittedAt: msg.timestamp || Date.now(),
                            hideContent: !!msg.data?.hideContent
                        });
                        touchPendingInputs();
                        break;

                    case 'revoke_input':
                        if (pendingInputs.value.has(msg.from)) {
                            pendingInputs.value.delete(msg.from);
                            touchPendingInputs();
                        }
                        break;

                    case 'spectator_mode': {
                        const enabled = !!msg.data?.enabled;
                        const targetId = msg.from || msg.data?.userId || '';
                        const target = users.value.find(u => u.id === targetId);

                        if (target) {
                            target.isSpectator = enabled;
                            if (enabled && pendingInputs.value.has(target.id)) {
                                pendingInputs.value.delete(target.id);
                                touchPendingInputs();
                            }
                        }

                        syncHostStateIfNeeded();
                        break;
                    }

                    case 'ai_response':
                        if (msg.data?.variableMode) variableMode.value = msg.data.variableMode;
                        eventEmit('multiplayer_ai_response', msg.data || {});
                        break;

                    case 'user_message':
                        clearPendingInputs();
                        eventEmit('multiplayer_user_message', msg.data || {});
                        break;

                    case 'request_pending_inputs':
                        if (isHost.value && msg.from !== myId) {
                            networkClient.send({
                                type: 'sync_pending_inputs',
                                data: {
                                    targetUserId: msg.from,
                                    items: buildPendingInputsSnapshot()
                                }
                            });
                            networkClient.send({
                                type: 'sync_user_state',
                                data: {
                                    targetUserId: msg.from,
                                    users: buildUsersSnapshot()
                                }
                            });
                        }
                        break;

                    case 'sync_pending_inputs':
                        if (!isHost.value && msg.data?.targetUserId === myId) {
                            pendingInputs.value.clear();
                            (msg.data.items || []).forEach(item => {
                                pendingInputs.value.set(item.userId, {
                                    userName: item.userName,
                                    content: item.content,
                                    prefix: item.prefix,
                                    suffix: item.suffix || '',
                                    hideContent: !!item.hideContent
                                });
                            });
                            touchPendingInputs();
                        }
                        break;

                    case 'sync_user_state':
                        if (!isHost.value) {
                            const targetUserId = (msg.data?.targetUserId || '').toString();
                            if (targetUserId && targetUserId !== myId) break;

                            const incoming = Array.isArray(msg.data?.users) ? msg.data.users : [];
                            const nextUsers = incoming
                                .map((u, idx) => {
                                    const nu = normalizeIncomingUser(u);
                                    return {
                                        id: nu.id,
                                        name: nu.name,
                                        isHost: nu.isHost,
                                        isSpectator: nu.isSpectator,
                                        _joinOrder: Number.isFinite(u?._joinOrder) ? u._joinOrder : (idx + 1)
                                    };
                                })
                                .filter(u => !!u.id);

                            if (myId && !nextUsers.some(u => u.id === myId)) {
                                nextUsers.push({
                                    id: myId,
                                    name: networkClient?.userName || '我',
                                    isHost: false,
                                    isSpectator: !!networkClient?.isSpectator,
                                    _joinOrder: nextUsers.length + 1
                                });
                            }

                            users.value = nextUsers;

                            const me = users.value.find(u => u.id === myId);
                            if (me) {
                                me.isSpectator = !!networkClient?.isSpectator;
                                if (me.isSpectator) me.isHost = false;
                            }

                            isHost.value = !!users.value.find(u => u.id === myId)?.isHost;
                            mode.value = me?.isSpectator ? 'spectator' : 'client';
                        }
                        break;

                    case 'reset_input':
                        clearPendingInputs();
                        break;

                    case 'sync_history_request':
                        if (isHost.value) {
                            eventEmit('multiplayer_sync_history_request', {
                                userId: msg.from,
                                depth: msg.data?.depth || 0
                            });
                        }
                        break;

                    case 'sync_regex_request':
                        if (isHost.value) eventEmit('multiplayer_sync_regex_request', msg.from);
                        break;

                    case 'sync_variables_request':
                        if (isHost.value) {
                            eventEmit('multiplayer_sync_variables_request', {
                                userId: msg.from,
                                variableMode: msg.data?.variableMode
                            });
                        }
                        break;

                    case 'sync_variables':
                        if (!isHost.value) {
                            const targetUserId = (msg.data?.targetUserId || '').toString();
                            if (targetUserId && targetUserId !== myId) break;
                            eventEmit('multiplayer_sync_variables', {
                                variableType: msg.data?.variableType,
                                content: msg.data?.content,
                                targetUserId
                            });
                        }
                        break;

                    case 'user_persona':
                        pendingPersonas.value.set(msg.from, {
                            userName: msg.fromName,
                            content: msg.data.content,
                            prefix: msg.data.prefix
                        });
                        triggerRef(pendingPersonas);
                        break;

                    case 'transfer_host': {
                        const targetUserId = msg.data?.targetUserId;
                        if (!targetUserId) break;

                        const sender = users.value.find(u => u.id === msg.from);
                        if (!sender?.isHost) {
                            addLog('error', '系统', '收到非法房主转让请求（发送者不是房主）');
                            break;
                        }

                        const target = users.value.find(u => u.id === targetUserId);
                        if (!target || target.isSpectator) {
                            addLog('error', '系统', '房主转让失败：目标不存在或为观众');
                            break;
                        }

                        users.value.forEach(u => {
                            u.isHost = (u.id === target.id);
                        });

                        isHost.value = target.id === myId && !target.isSpectator;

                        if (isHost.value) {
                            networkClient?.broadcast({
                                type: 'host_change',
                                data: { hostId: target.id, hostName: target.name }
                            });
                            syncHostStateIfNeeded();
                        }
                        break;
                    }

                    case 'host_change':
                        if (msg.data?.hostId) {
                            let targetHost = users.value.find(u => u.id === msg.data.hostId);

                            if (!targetHost || targetHost.isSpectator) {
                                const fallbackHost = pickNextHostCandidate();
                                if (!fallbackHost) {
                                    clearRoomLogCache(currentRoomId.value);
                                    disconnect();
                                    break;
                                }
                                targetHost = fallbackHost;
                            }

                            users.value.forEach(u => {
                                u.isHost = (u.id === targetHost.id);
                            });

                            isHost.value = targetHost.id === myId && !targetHost.isSpectator;
                        }
                        break;

                    default:
                        if (emitMap[msg.type]) {
                            if (msg.type === 'acu_full_sync' && !isHost.value) {
                                acuSyncState.value.fullSynced = true;
                                acuSyncState.value.lastSyncTimestamp = Date.now();
                                acuSyncState.value.isolationKey = msg.data?.isolationKey || '';
                            }
                            if (msg.type === 'acu_delta_sync' && !isHost.value) {
                                acuSyncState.value.lastSyncTimestamp = Date.now();
                            }
                            eventEmit(emitMap[msg.type], msg.data || {});
                        }
                        break;
                }
            }
        });
    };

    // -------------------------
    // 输入池限时自动发送
    // -------------------------
    watch(pendingInputsVersion, () => {
        const newSize = pendingInputs.value.size;
        const oldSize = lastPendingSize;
        lastPendingSize = newSize;

        if (isHost.value && settings.timedInputSeconds > 0 && newSize > 0 && newSize > oldSize) {
            if (timeoutTimer) clearTimeout(timeoutTimer);
            timeoutTimer = setTimeout(() => {
                if (isHost.value && pendingInputs.value.size > 0) {
                    submitToAI();
                }
            }, settings.timedInputSeconds * 1000);
        }
    });

    // -------------------------
    // 对外动作
    // -------------------------
    const submitToAI = async () => {
        if (!isHost.value) return;

        if (timeoutTimer) {
            clearTimeout(timeoutTimer);
            timeoutTimer = null;
        }

        const snapshot = buildPendingInputsSnapshot();
        if (snapshot.length === 0) {
            addLog('error', '系统', '没有可发送的输入');
            return;
        }

        const toLine = (item) => {
            const p = (item.prefix || '[{name}]:').replace('{name}', item.userName);
            return `${p} ${item.content}${item.suffix || ''}`;
        };

        const fullCombined = snapshot.map(toLine).join('\n\n');
        const visibleInputs = snapshot.filter(item => !item.hideContent);
        const hiddenInputs = snapshot.filter(item => item.hideContent);
        const visibleCombined = visibleInputs.map(toLine).join('\n\n');
        const hiddenCombined = hiddenInputs.map(toLine).join('\n\n');

        const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        try {
            await createChatMessages([{ role: 'user', message: fullCombined }]);
            const hostMsgId = getLastMessageId();

            networkClient?.broadcast({
                type: 'user_message',
                data: {
                    batchId,
                    content: visibleCombined,
                    inputs: visibleInputs,
                    userLayerHidden: visibleInputs.length !== snapshot.length
                }
            });

            await triggerSlash('/trigger');

            setHiddenRerollContext(hiddenCombined.trim() ? hiddenCombined : '');

            try {
                if (hostMsgId >= 0) {
                    if (visibleCombined.trim()) {
                        await setChatMessages([{ message_id: hostMsgId, message: visibleCombined }]);
                    } else {
                        await deleteChatMessages([hostMsgId]);
                    }
                }
            } catch (e) {
                console.warn('[联机Mod] 用户层脱敏回写失败:', e);
            }

            clearPendingInputs();
        } catch (e) {
            addLog('error', '系统', `发送给AI失败: ${e.message}`);
            console.error('[联机Mod] submitToAI 失败:', e);
        }
    };

    const renameSelf = (newNameRaw) => {
        if (!networkClient) return { ok: false, reason: 'no_client' };

        const newName = (newNameRaw || '').trim();
        if (!newName) return { ok: false, reason: 'empty' };

        const myId = networkClient.userId;
        const duplicated = users.value.find(
            u => u.id !== myId && normalizeUserName(u.name) === normalizeUserName(newName)
        );

        if (duplicated) {
            addLog('error', '系统', `用户名 "${newName}" 已被占用`);
            return { ok: false, reason: 'duplicate' };
        }

        networkClient.userName = newName;
        const me = users.value.find(u => u.id === myId);
        if (me) me.name = newName;

        if (isConnected.value) {
            networkClient.broadcast({ type: 'rename', data: { name: newName } });
        }

        return { ok: true };
    };

    const setClientIdentity = ({ roomKey, name, uid, spectator }) => {
        const safeName = (name || '').trim() || '匿名';
        const safeUid = (uid || '').trim() || `uid_${Math.random().toString(36).slice(2, 10)}`;

        networkClient.userName = safeName;
        networkClient.userId = makeBoundUserId(roomKey, safeUid);
        networkClient.isSpectator = !!spectator;

        spectatorMode.value = !!spectator;
        return { safeName, safeUid };
    };

    const postJoinSync = (spectatorFlag) => {
        mode.value = spectatorFlag ? 'spectator' : 'client';
        isHost.value = false;

        ensureMeExists();

        const me = users.value.find(u => u.id === networkClient.userId);
        if (me) me.isSpectator = spectatorFlag;

        networkClient.send({
            type: 'spectator_mode',
            data: {
                enabled: spectatorFlag,
                userId: networkClient.userId,
                userName: networkClient.userName
            }
        });

        networkClient.send({ type: 'request_pending_inputs', data: {} });
    };

    const connectOnline = async (roomId, pwd, name, uid, options = {}) => {
        const { isReconnect = false, spectator = false } = options;
        const spectatorFlag = isReconnect ? !!reconnectContext?.spectator : !!spectator;

        if (!isReconnect) {
            sessionEstablished = false;
            reconnectAttempt = 0;
        }

        manualDisconnect = false;
        reconnectContext = { roomId, pwd, name, uid, spectator: spectatorFlag };

        initNetwork(true);
        if (!isReconnect) switchRoomLogs(roomId);

        setClientIdentity({
            roomKey: roomId,
            name,
            uid,
            spectator: spectatorFlag
        });

        try {
            const wsUrl = await RoomApiService.verifyAndJoin(settings.onlineServer, roomId, pwd);
            await networkClient.connect(wsUrl, pwd);
            postJoinSync(spectatorFlag);
        } catch (e) {
            addLog('error', '系统', `${isReconnect ? '自动重连失败' : '连接失败'}: ${e.message}`);
            throw e;
        }
    };

    const startOfflineServer = async (port, pwd, name, uid) => {
        manualDisconnect = false;
        sessionEstablished = false;
        reconnectContext = null;
        reconnectAttempt = 0;

        const channelPort = String((port || '').toString().trim() || '2157');
        const roomKey = `local_${channelPort}`;

        initNetwork(false);
        switchRoomLogs(roomKey);

        const safeName = (name || '').trim() || '房主';
        setClientIdentity({
            roomKey,
            name: safeName,
            uid,
            spectator: false
        });

        try {
            await networkClient.startServer({
                port: channelPort,
                password: pwd || '',
                userName: safeName
            });

            mode.value = 'client';
            isHost.value = true;
        } catch (e) {
            addLog('error', '系统', `创建本地房间失败: ${e.message}`);
            throw e;
        }
    };

    const connectOffline = async (port, pwd, name, uid, options = {}) => {
        const spectatorFlag = !!options.spectator;

        manualDisconnect = false;
        sessionEstablished = false;
        reconnectContext = null;
        reconnectAttempt = 0;

        const channelPort = String((port || '').toString().trim() || '2157');
        const roomKey = `local_${channelPort}`;

        initNetwork(false);
        switchRoomLogs(roomKey);

        const { safeName } = setClientIdentity({
            roomKey,
            name,
            uid,
            spectator: spectatorFlag
        });

        try {
            await networkClient.connect(channelPort, pwd || '', safeName, spectatorFlag);
            postJoinSync(spectatorFlag);
        } catch (e) {
            addLog('error', '系统', `本地连接失败: ${e.message}`);
            throw e;
        }
    };

    const disconnect = () => {
        manualDisconnect = true;
        sessionEstablished = false;
        reconnectContext = null;
        reconnectAttempt = 0;
        clearReconnectTimer();

        setHiddenRerollContext('');

        if (timeoutTimer) {
            clearTimeout(timeoutTimer);
            timeoutTimer = null;
        }

        isConnected.value = false;
        mode.value = 'disconnected';
        isHost.value = false;
        users.value = [];
        clearPendingInputs();
        currentRoomId.value = '';
        chatLogs.value = [];
        errorLogDedupSet.clear();

        networkClient?.disconnect();
    };

    const revokeMyInput = () => {
        if (!networkClient || !isConnected.value) return;

        const myId = networkClient.userId;
        if (!pendingInputs.value.has(myId)) return;

        pendingInputs.value.delete(myId);
        touchPendingInputs();

        networkClient.broadcast({
            type: 'revoke_input',
            data: {}
        });
    };

    const setSpectatorMode = (enabled) => {
        const next = !!enabled;

        // 房主禁止切到观众
        if (isHost.value && next) {
            spectatorMode.value = false;
            addLog('error', '系统', '房主不可切换为观众模式');
            return { ok: false, reason: 'host_forbidden' };
        }

        spectatorMode.value = next;

        if (!networkClient) {
            return { ok: true };
        }

        networkClient.isSpectator = next;

        const me = users.value.find(u => u.id === networkClient.userId);
        if (me) me.isSpectator = next;

        if (!isConnected.value) {
            return { ok: true };
        }

        if (next && pendingInputs.value.has(networkClient.userId)) {
            pendingInputs.value.delete(networkClient.userId);
            touchPendingInputs();
            networkClient.broadcast({ type: 'revoke_input', data: {} });
        }

        networkClient.broadcast({
            type: 'spectator_mode',
            data: {
                enabled: next,
                userId: networkClient.userId,
                userName: networkClient.userName
            }
        });

        mode.value = next ? 'spectator' : 'client';
        return { ok: true };
    };

    return {
        isConnected,
        mode,
        isHost,
        users,
        chatLogs,
        pendingInputs,
        pendingInputsVersion,
        pendingPersonas,
        settings,
        acuSyncState,
        variableMode,
        spectatorMode,
        addLog,
        initNetwork,
        connectOnline,
        connectOffline,
        startOfflineServer,
        submitToAI,
        clearPendingInputs,
        revokeMyInput,
        setSpectatorMode,
        renameSelf,
        disconnect,
        pruneRoomLogsByExistingRoomIds,
        currentRoomId,
        getHiddenRerollContext,
        getClient: () => networkClient
    };
});


// ==========================================
