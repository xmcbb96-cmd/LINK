// 8. Vue 界面组件 (UI) 
// ==========================================
const MultiplayerPanel = defineComponent({
    setup() {
        const store = useMultiplayerStore();

        const UI_TOKENS = Object.freeze({
            panelStartOffset: 20,
            panelFallbackWidth: 320,
            panelFallbackHeight: 44
        });

        const UI_STYLE_TOKENS = Object.freeze({
            gap2: 'var(--mp-s1)',
            gap4: 'var(--mp-s2)',
            gap8: 'var(--mp-s3)',
            narrowInputWidth: 'var(--mp-s7)'
        });

        const px = (n) => `${n}px`;
        const isMinimized = ref(true);
        const showSettings = ref(false);
        const isDragging = ref(false);
        const panelRef = ref(null);
        const panelStyle = reactive({
            left: px(UI_TOKENS.panelStartOffset),
            top: px(UI_TOKENS.panelStartOffset)
        });
        let dragOffset = { x: 0, y: 0 };
        
        const userName = ref(store.settings.defaultUserName || '');
        const offlinePort = ref('2157');
        const offlinePassword = ref('');
        const myInput = ref('');
        const chatMsg = ref('');
        const logsRef = ref(null);

        // 在线房间相关
        const onlineRooms = ref([]);
        const isLoadingRooms = ref(false);
        const isJoining = ref(false);
        const isCreating = ref(false);

        const selectedRoom = ref(null);
        const joinPassword = ref('');
        const newRoomName = ref('');
        const newRoomPassword = ref('');
        const newRoomMaxUsers = ref(8);

        const normalizeRoomName = (name = '') => name.trim().toLowerCase();

        const displayRooms = computed(() => {
            const map = new Map();
            for (const room of onlineRooms.value) {
                const key = normalizeRoomName(room?.name || '');
                if (!key) continue;
                if (!map.has(key)) map.set(key, room);
            }
            return Array.from(map.values());
        });

        const toSafeInt = (v) => {
            const n = Number(v);
            return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
        };

        // 在线房间显示人数：优先使用后端提供的总人数，否则玩家数 + 观众数
        const getRoomDisplayCurrentUsers = (room = {}) => {
            const explicitTotal = toSafeInt(
                room.totalUsers ??
                room.totalCount ??
                room.onlineCount
            );

            if (explicitTotal > 0) {
                return explicitTotal;
            }

            const players = toSafeInt(
                room.currentUsers ??
                room.currentUserCount ??
                room.playerCount ??
                room.players
            );

            const spectators = toSafeInt(
                room.spectatorCount ??
                room.spectators ??
                room.observerCount ??
                room.watchers ??
                room.audienceCount
            );

            return players + spectators;
        };

        // 拉取在线房间列表
        const fetchRooms = async () => {
            if (!store.settings.onlineMode) return;
            isLoadingRooms.value = true;
            try {
                onlineRooms.value = await RoomApiService.fetchRooms(store.settings.onlineServer);
                store.pruneRoomLogsByExistingRoomIds(
                    (onlineRooms.value || []).map(r => r.id)
                );
            } catch (e) {
                store.addLog('error', '系统', '获取房间列表失败: ' + e.message);
            } finally {
                isLoadingRooms.value = false;
            }
        };

        // 选中房间
        const selectRoom = (room) => {
            selectedRoom.value = room.id;
            joinPassword.value = '';
        };

        // 加入选中的在线房间
        const joinSelectedRoom = async (asSpectator = false) => {
            if (!selectedRoom.value || isJoining.value) return;

            const safeName = (userName.value || '').trim();
            if (!safeName) {
                const _toastr = parentWindow.toastr || window.toastr;
                _toastr?.error('请输入用户名');
                return;
            }

            isJoining.value = true;
            try {
                store.settings.defaultUserName = safeName;
                await store.connectOnline(
                    selectedRoom.value,
                    joinPassword.value || '',
                    safeName,
                    localSettings.clientUid,
                    { spectator: asSpectator }
                );
            } catch (e) {
                console.error(e);
            } finally {
                isJoining.value = false;
            }
        };

        // 创建在线房间并加入
        const createAndJoinRoom = async () => {
            if (isCreating.value) return;

            const roomName = newRoomName.value.trim();
            const creatorName = (userName.value || '').trim() || '匿名';
            if (!roomName) return;

            const duplicated = displayRooms.value.some(
                r => normalizeRoomName(r.name) === normalizeRoomName(roomName)
            );
            if (duplicated) {
                const _toastr = parentWindow.toastr || window.toastr;
                _toastr?.error('房间名已存在，请换一个');
                return;
            }

            isCreating.value = true;
            try {
                store.settings.defaultUserName = creatorName;
                const room = await RoomApiService.createRoom(store.settings.onlineServer, {
                    name: roomName,
                    password: newRoomPassword.value || undefined,
                    maxUsers: newRoomMaxUsers.value || 8,
                    creatorName
                });

                if (room?.id) {
                    await store.connectOnline(
                        room.id,
                        newRoomPassword.value || '',
                        creatorName,
                        localSettings.clientUid
                    );
                }
            } catch (e) {
                console.error(e);
            } finally {
                isCreating.value = false;
            }
        };

        // 初始加载房间列表
        if (store.settings.onlineMode) fetchRooms();

        const syncCurrentRoomCreatorName = () => {
            const roomId = (store.currentRoomId || '').toString().trim();
            if (!roomId || !Array.isArray(onlineRooms.value) || onlineRooms.value.length === 0) return;

            const hostUser = store.users.find(u => !!u.isHost);
            const hostName = (hostUser?.name || '').trim();
            if (!hostName) return;

            onlineRooms.value = onlineRooms.value.map(room => {
                if (room.id !== roomId) return room;
                if ((room.creatorName || '') === hostName) return room;
                return { ...room, creatorName: hostName };
            });
        };

        watch(
            () => store.users.map(u => `${u.id}|${u.name}|${u.isHost}`).join(';'),
            () => syncCurrentRoomCreatorName()
        );

        watch(
            () => store.currentRoomId,
            () => syncCurrentRoomCreatorName()
        );

        // 安全获取 pendingInputs Map（兼容 Pinia 自动解包 shallowRef）
        const getPendingMap = () => {
            const pi = store.pendingInputs;
            return (pi && typeof pi.has === 'function') ? pi : (pi?.value ?? new Map());
        };

        // 判断用户是否已提交输入
        const hasSubmitted = (userId) => {
            return getPendingMap().has(userId);
        };

        // 当前用户是否已提交
        const mySubmitted = computed(() => {
            const _v = store.pendingInputsVersion;
            const client = store.getClient();
            if (!client) return false;
            return getPendingMap().has(client.userId);
        });

        const myClientId = computed(() => store.getClient()?.userId || '');

        const getJoinOrder = (u, idx = 0) => {
            return Number.isFinite(u?._joinOrder) ? u._joinOrder : (idx + 1);
        };

        const onlineUsers = computed(() => {
            return store.users
                .filter(u => !u.isSpectator)
                .slice()
                .sort((a, b) => {
                    if (!!a.isHost !== !!b.isHost) return a.isHost ? -1 : 1; // 房主强制第一
                    return getJoinOrder(a) - getJoinOrder(b);
                });
        });

        const spectators = computed(() => {
            return store.users
                .filter(u => !!u.isSpectator)
                .slice()
                .sort((a, b) => getJoinOrder(a) - getJoinOrder(b));
        });

        const spectatorsCollapsed = ref(true);
        const toggleSpectatorsCollapsed = () => {
            spectatorsCollapsed.value = !spectatorsCollapsed.value;
        };

        // 在线玩家数（不含观众）
        const userCount = computed(() => onlineUsers.value.length);

        const submittedCount = computed(() => {
            const _v = store.pendingInputsVersion;
            let count = 0;
            for (const [uid] of getPendingMap().entries()) {
                const u = store.users.find(x => x.id === uid);
                if (u && !u.isSpectator) count++;
            }
            return count;
        });

        // 全部已提交（按在线玩家算）
        const allSubmitted = computed(() => {
            const _v = store.pendingInputsVersion;
            return userCount.value > 0 && submittedCount.value >= userCount.value;
        });

        // 发送聊天消息
        const sendChat = () => {
            if (!chatMsg.value.trim() || !store.getClient()) return;
            store.getClient().send({ type: 'chat', data: { content: chatMsg.value.trim() } });
            store.addLog('chat', userName.value || '我', chatMsg.value.trim());
            chatMsg.value = '';
        };

        // 提交用户输入
        const sendInput = () => {
            if (store.spectatorMode) {
                return;
            }
            if (!myInput.value.trim() || !store.getClient()) return;

            const prefix = applyNameToken(localSettings.messagePrefix || '[{name}]:');

            if (localSettings.sendUserPersona) {
                const personaRaw = getPersonaContentRaw();
                if (personaRaw) {
                    store.getClient().send({
                        type: 'user_persona',
                        data: {
                            content: personaRaw,
                            prefix: applyNameToken(localSettings.personaPrefix || '[{name}]的设定:')
                        }
                    });
                }
            }

            store.getClient().send({
                type: 'user_input',
                data: {
                    content: myInput.value,
                    messagePrefix: prefix,
                    messageSuffix: localSettings.messageSuffix || '',
                    hideContent: !!localSettings.hideUserInputContent
                }
            });

            myInput.value = '';
        };

        // 撤回自己已提交输入
        const revokeInput = () => {
            store.revokeMyInput();
        };

        // 房主合并发送
        const submitToAI = async () => {
            await store.submitToAI();
            myInput.value = '';
        };

        // 房主重置输入
        const resetInputs = () => {
            store.clearPendingInputs();
            store.getClient()?.broadcast({ type: 'reset_input', data: {} });
            myInput.value = '';
        };

        // 客户端同步按钮
        const requestSyncHistory = () => {
            const depthRaw = Number(localSettings.syncHistoryDepth);
            const depth = Number.isFinite(depthRaw) && depthRaw >= 0 ? Math.floor(depthRaw) : 10;
            store.getClient()?.send({ type: 'sync_history_request', data: { depth } });
        };
        const requestSyncRegex = () => {
            store.getClient()?.send({ type: 'sync_regex_request', data: {} });
        };
        const requestSyncVariables = () => {
            store.getClient()?.send({ type: 'sync_variables_request', data: { variableMode: store.variableMode || 'none' } });
        };

        const autoSyncInFlight = ref(false);
        const triggerAutoSync = () => {
            if (!store.isConnected) return;
            if (store.isHost) return;
            if (!localSettings.autoSyncOnConnect) return;
            if (autoSyncInFlight.value) return;

            autoSyncInFlight.value = true;
            setTimeout(() => {
                try {
                    requestSyncHistory();
                    requestSyncRegex();
                    requestSyncVariables();
                } finally {
                    setTimeout(() => {
                        autoSyncInFlight.value = false;
                    }, 400);
                }
            }, 200);
        };

        watch(() => store.isConnected, (connected) => {
            if (!connected) {
                autoSyncInFlight.value = false;
                return;
            }
            triggerAutoSync();
        });

        const autoSubmitInFlight = ref(false);
        watch(allSubmitted, async (ready) => {
            if (!ready) return;
            if (!store.isHost) return;
            if (store.spectatorMode) return;
            if (!localSettings.autoSendWhenAllSubmitted) return;
            if (getPendingMap().size <= 0) return;
            if (autoSubmitInFlight.value) return;

            autoSubmitInFlight.value = true;
            try {
                await submitToAI();
            } finally {
                setTimeout(() => {
                    autoSubmitInFlight.value = false;
                }, 0);
            }
        });

        // 转让房主
        const transferHost = (userId) => {
            if (confirm('确定要将房主权限转让给该用户吗？')) {
                store.getClient()?.send({ type: 'transfer_host', data: { targetUserId: userId } });
            }
        };

        // 格式化时间
        const formatTime = (ts) => new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

        // 设置项（从 localStorage 读取，带默认值）
        const SETTINGS_KEY = 'st_multiplayer_settings';
        const makeRandomUid = () => `uid_${Math.random().toString(36).slice(2, 10)}`;

        const defaultSettings = {
            defaultUserName: '',
            clientUid: makeRandomUid(),
            messagePrefix: '[{name}]:',
            messageSuffix: '',
            autoSendWhenAllSubmitted: false,
            autoSyncOnConnect: true,
            hideUserInputContent: false,
            sendUserPersona: true,
            personaPrefix: '[{name}]的设定:',
            timedInputSeconds: 0,
            syncHistoryDepth: 10,
            uiThemeTokens: {},
            onlineMode: true,
            onlineServer: 'https://room.yufugemini.cloud'
        };
        const loadSettings = () => {
            try {
                const raw = localStorage.getItem(SETTINGS_KEY);
                return raw ? { ...defaultSettings, ...JSON.parse(raw) } : { ...defaultSettings };
            } catch (e) { return { ...defaultSettings }; }
        };
        const localSettings = reactive(loadSettings());
        const saveSettings = () => {
            try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(localSettings)); } catch (e) {}
        };

        const normalizeThemeTokenKey = (rawKey = '') => {
            const key = String(rawKey || '').trim();
            if (key.startsWith('--mp-')) return key;
            if (key.startsWith('mp-')) return `--${key}`;
            return '';
        };

        const extractThemeTokensFromPayload = (payload) => {
            const sources = [
                payload?.mpThemeTokens,
                payload?.tokens,
                payload?.variables,
                payload
            ];

            const out = {};
            for (const src of sources) {
                if (!src || typeof src !== 'object' || Array.isArray(src)) continue;
                for (const [k, v] of Object.entries(src)) {
                    const nk = normalizeThemeTokenKey(k);
                    if (!nk) continue;
                    if (v === null || v === undefined) continue;
                    out[nk] = String(v).trim();
                }
                if (Object.keys(out).length > 0) break;
            }
            return out;
        };

        const applyThemeTokens = (tokens = {}) => {
            const doc = parentWindow.document || document;
            const root = doc?.documentElement;
            if (!root) return 0;

            let applied = 0;
            Object.entries(tokens || {}).forEach(([k, v]) => {
                const nk = normalizeThemeTokenKey(k);
                const nv = String(v || '').trim();
                if (!nk || !nv) return;
                root.style.setProperty(nk, nv);
                applied++;
            });
            return applied;
        };

        const themeFileInputRef = ref(null);

        const onThemeFileChange = async (e) => {
            const file = e?.target?.files?.[0];
            if (!file) return;

            const _toastr = parentWindow.toastr || window.toastr;

            try {
                const raw = await file.text();
                const json = JSON.parse(raw);
                const tokens = extractThemeTokensFromPayload(json);
                const count = applyThemeTokens(tokens);

                if (count <= 0) {
                    throw new Error('未找到可用的 --mp- 主题变量');
                }

                localSettings.uiThemeTokens = tokens;
                saveSettings();
                _toastr?.success(`UI主题导入成功（${count} 项）`);
            } catch (err) {
                _toastr?.error(`UI主题导入失败：${err?.message || err}`);
            } finally {
                if (e?.target) e.target.value = '';
            }
        };

        // 启动时应用已保存的 UI 主题变量
        applyThemeTokens(localSettings.uiThemeTokens || {});

        // 将关键运行配置归一到 store.settings
        store.settings.defaultUserName = (localSettings.defaultUserName || '').trim();
        store.settings.timedInputSeconds = Number(localSettings.timedInputSeconds) || 0;
        store.settings.onlineMode = !!localSettings.onlineMode;
        store.settings.onlineServer = (localSettings.onlineServer || 'https://room.yufugemini.cloud').trim();

        // localSettings -> store.settings
        watch(() => localSettings.timedInputSeconds, (v) => {
            const next = Number(v) || 0;
            if (store.settings.timedInputSeconds !== next) {
                store.settings.timedInputSeconds = next;
            }
            saveSettings();
        });

        // store.settings -> localSettings（防止外部改 store 时 UI 不更新）
        watch(() => store.settings.timedInputSeconds, (v) => {
            const next = Number(v) || 0;
            if ((Number(localSettings.timedInputSeconds) || 0) !== next) {
                localSettings.timedInputSeconds = next;
                saveSettings();
            }
        });

        watch(() => store.settings.onlineMode, (v) => {
            const next = !!v;
            if (localSettings.onlineMode !== next) {
                localSettings.onlineMode = next;
                saveSettings();
            }
        });

        watch(() => store.settings.onlineServer, (v) => {
            const next = (v || '').toString().trim();
            if ((localSettings.onlineServer || '') !== next) {
                localSettings.onlineServer = next;
                saveSettings();
            }
        });

        const personaRefreshTick = ref(0);
        let personaPreviewTimer = null;

        const getPersonaRoleName = () => {
            // 强制建立对刷新 tick 的依赖，让 computed 可重算
            const _tick = personaRefreshTick.value;

            const ctx = parentWindow.SillyTavern?.getContext?.();
            const pu = parentWindow.power_user || ctx?.power_user || {};

            const roleName = (
                (typeof ctx?.userPersona === 'object' ? ctx?.userPersona?.name : '') ||
                ctx?.persona?.name ||
                pu?.persona_name ||
                ctx?.personaName ||
                ctx?.name1 ||
                ctx?.user_name ||
                localSettings.defaultUserName ||
                '用户名'
            ).toString().trim();

            return roleName || '用户名';
        };

        const applyNameToken = (template) => {
            return (template || '').replace(/\{\s*name\s*\}|\[\s*name\s*\]/gi, getPersonaRoleName());
        };

        // 初始化用户名
        if (localSettings.defaultUserName && !userName.value) {
            userName.value = localSettings.defaultUserName;
        }

        let renameDebounceTimer = null;
        let lastBroadcastName = '';

        const doRenameBroadcast = (nextName) => {
            const ret = store.renameSelf(nextName);
            if (ret?.ok) {
                lastBroadcastName = nextName;
            } else if (ret?.reason === 'duplicate') {
                const _toastr = parentWindow.toastr || window.toastr;
                _toastr?.error('该用户名已在房间中使用');
            }
        };

        const flushRenameNow = () => {
            const nextName = (localSettings.defaultUserName || '').trim();
            if (!store.isConnected || !nextName) return;

            if (renameDebounceTimer) {
                clearTimeout(renameDebounceTimer);
                renameDebounceTimer = null;
            }

            if (nextName === lastBroadcastName) return;
            doRenameBroadcast(nextName);
        };

        watch(() => localSettings.defaultUserName, (val) => {
            const nextName = (val || '').trim();
            userName.value = nextName;
            store.settings.defaultUserName = nextName;
            saveSettings();

            if (!store.isConnected || !nextName) return;

            if (renameDebounceTimer) {
                clearTimeout(renameDebounceTimer);
            }

            renameDebounceTimer = setTimeout(() => {
                if (nextName === lastBroadcastName) return;
                doRenameBroadcast(nextName);
            }, 700);
        });

        // 预览文本
        const previewText = computed(() => {
            const prefix = applyNameToken(localSettings.messagePrefix || '[{name}]:');
            return `${prefix} 消息内容${localSettings.messageSuffix}`;
        });

        const getPersonaContentRaw = () => {
            // 强制建立对刷新 tick 的依赖，让 computed 可重算
            const _tick = personaRefreshTick.value;

            const ctx = parentWindow.SillyTavern?.getContext?.();
            const pu = parentWindow.power_user || ctx?.power_user || {};

            const userPersona = ctx?.userPersona;
            const userPersonaText = typeof userPersona === 'string'
                ? userPersona
                : (userPersona?.description || userPersona?.content || '');

            const domPersona = (
                parentWindow.document?.querySelector('#persona_description')?.value ||
                parentWindow.document?.querySelector('textarea[name="persona_description"]')?.value ||
                ''
            );

            const raw = (
                userPersonaText ||
                ctx?.persona?.description ||
                ctx?.persona_description ||
                pu?.persona_description ||
                domPersona ||
                ''
            ).toString().trim();

            return raw.replace(/<[^>]+>/g, '').trim();
        };

        const personaPreviewText = computed(() => {
            const prefix = applyNameToken(localSettings.personaPrefix || '[{name}]的设定:');
            const raw = getPersonaContentRaw() || '（未读取到用户设定内容）';
            const merged = `${prefix} ${raw}`.replace(/\s+/g, ' ').trim();
            return merged.length > 80 ? `${merged.slice(0, 80)}...` : merged;
        });

        // 设置弹窗打开时，每秒刷新一次 persona 预览
        watch(showSettings, (opened) => {
            if (personaPreviewTimer) {
                clearInterval(personaPreviewTimer);
                personaPreviewTimer = null;
            }

            if (opened) {
                personaRefreshTick.value++;
                personaPreviewTimer = setInterval(() => {
                    personaRefreshTick.value++;
                }, 1000);
            }
        });

        const scrollLogsToBottom = () => {
            nextTick(() => {
                if (!logsRef.value) return;
                logsRef.value.scrollTop = logsRef.value.scrollHeight;
            });
        };

        // 自动滚动日志（新增消息时）
        watch(() => store.chatLogs.length, () => {
            scrollLogsToBottom();
        });

        // 修复：展开悬浮窗时，日志默认滚动到底部
        watch(isMinimized, (minimized) => {
            if (!minimized) {
                scrollLogsToBottom();
            }
        });

        // 修复：关闭设置弹窗后，若面板处于展开状态，也滚动到底部
        watch(showSettings, (opened) => {
            if (!opened && !isMinimized.value) {
                scrollLogsToBottom();
            }
        });

        // 拖拽逻辑（Pointer Events：桌面 + 移动端统一）
        let activePointerId = null;
        let dragPointerTarget = null;

        const startPointerDrag = (e) => {
            // 仅允许鼠标左键；触摸/笔不受 button 限制
            if (e.pointerType === 'mouse' && e.button !== 0) return;

            // 避免在按钮/输入框等交互控件上触发拖拽
            if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('select')) return;

            isDragging.value = true;
            activePointerId = e.pointerId;
            dragPointerTarget = e.currentTarget || null;

            dragOffset.x = e.clientX - parseInt(panelStyle.left, 10);
            dragOffset.y = e.clientY - parseInt(panelStyle.top, 10);

            // 捕获指针，避免拖拽中丢失事件
            try { dragPointerTarget?.setPointerCapture?.(activePointerId); } catch (_) {}

            const targetDoc = parentWindow.document || document;
            targetDoc.addEventListener('pointermove', onPointerDrag, { passive: false });
            targetDoc.addEventListener('pointerup', stopPointerDrag);
            targetDoc.addEventListener('pointercancel', stopPointerDrag);
        };

        const getViewportSize = () => {
            const vv = parentWindow.visualViewport;
            const viewportWidth = vv?.width || parentWindow.innerWidth || window.innerWidth || 0;
            const viewportHeight = vv?.height || parentWindow.innerHeight || window.innerHeight || 0;
            return {
                width: Math.max(0, Math.floor(viewportWidth)),
                height: Math.max(0, Math.floor(viewportHeight))
            };
        };

        const clampPanelIntoViewport = () => {
            const panelEl = panelRef.value;
            if (!panelEl) return;

            const { width: viewportWidth, height: viewportHeight } = getViewportSize();
            const panelWidth = panelEl.offsetWidth || UI_TOKENS.panelFallbackWidth;
            const panelHeight = panelEl.offsetHeight || UI_TOKENS.panelFallbackHeight;

            const maxLeft = Math.max(0, viewportWidth - panelWidth);
            const maxTop = Math.max(0, viewportHeight - panelHeight);

            const currentLeft = parseInt(panelStyle.left, 10) || 0;
            const currentTop = parseInt(panelStyle.top, 10) || 0;

            const nextLeft = Math.min(maxLeft, Math.max(0, currentLeft));
            const nextTop = Math.min(maxTop, Math.max(0, currentTop));

            panelStyle.left = px(nextLeft);
            panelStyle.top = px(nextTop);
        };

        let resizeRafId = null;
        const onViewportResize = () => {
            if (resizeRafId !== null) {
                parentWindow.cancelAnimationFrame?.(resizeRafId);
                resizeRafId = null;
            }
            resizeRafId = (parentWindow.requestAnimationFrame || window.requestAnimationFrame)(() => {
                resizeRafId = null;
                clampPanelIntoViewport();
            });
        };

        const onPointerDrag = (e) => {
            if (!isDragging.value) return;
            if (activePointerId !== null && e.pointerId !== activePointerId) return;

            // 移动端防止页面滚动干扰
            e.preventDefault();

            const { width: viewportWidth, height: viewportHeight } = getViewportSize();

            const panelEl = panelRef.value;
            const panelWidth = panelEl?.offsetWidth || UI_TOKENS.panelFallbackWidth;
            const panelHeight = panelEl?.offsetHeight || UI_TOKENS.panelFallbackHeight;

            const maxLeft = Math.max(0, viewportWidth - panelWidth);
            const maxTop = Math.max(0, viewportHeight - panelHeight);

            const nextLeft = Math.min(maxLeft, Math.max(0, e.clientX - dragOffset.x));
            const nextTop = Math.min(maxTop, Math.max(0, e.clientY - dragOffset.y));

            panelStyle.left = px(nextLeft);
            panelStyle.top = px(nextTop);
        };

        const stopPointerDrag = (e) => {
            // 仅响应当前激活的指针
            if (e && activePointerId !== null && e.pointerId !== activePointerId) return;

            isDragging.value = false;

            try {
                if (dragPointerTarget && activePointerId !== null) {
                    dragPointerTarget.releasePointerCapture?.(activePointerId);
                }
            } catch (_) {}

            activePointerId = null;
            dragPointerTarget = null;

            const targetDoc = parentWindow.document || document;
            targetDoc.removeEventListener('pointermove', onPointerDrag);
            targetDoc.removeEventListener('pointerup', stopPointerDrag);
            targetDoc.removeEventListener('pointercancel', stopPointerDrag);
        };

        const isMobileLike = () => {
            try {
                const mm = parentWindow.matchMedia?.('(hover: none) and (pointer: coarse)');
                if (mm?.matches) return true;
            } catch (_) {}
            const ua = parentWindow.navigator?.userAgent || '';
            return /Android|iPhone|iPad|iPod|Mobile|HarmonyOS/i.test(ua);
        };

        const OUTSIDE_MINIMIZE_WHITELIST_SELECTORS = [
            'input',
            'textarea',
            'select',
            '[contenteditable="true"]',
            '.swal2-container',
            '.dropdown-menu',
            '.ui-autocomplete',
            '.autocomplete',
            '.ime-candidate',
            '.candidate-window',
            '.composition-view',
            '.tox-tinymce'
        ];

        const isWhitelistedTarget = (target) => {
            if (!target || typeof target.closest !== 'function') return false;
            return OUTSIDE_MINIMIZE_WHITELIST_SELECTORS.some(selector => !!target.closest(selector));
        };

        const isVirtualKeyboardLikelyOpen = () => {
            if (!isMobileLike()) return false;

            const doc = parentWindow.document || document;
            const ae = doc.activeElement;

            const isEditing =
                !!ae &&
                (
                    ae.tagName === 'INPUT' ||
                    ae.tagName === 'TEXTAREA' ||
                    ae.isContentEditable
                );

            if (!isEditing) return false;

            const vv = parentWindow.visualViewport;
            if (!vv) return true;

            const baseHeight = parentWindow.innerHeight || window.innerHeight || 0;
            if (!baseHeight) return isEditing;

            return vv.height < baseHeight * 0.82;
        };

        const onDocumentPointerDownAutoMinimize = (e) => {
            if (!isMobileLike()) return;
            if (isMinimized.value) return;

            const panelEl = panelRef.value;
            const target = e.target;

            if (!panelEl || !target) return;
            if (panelEl.contains(target)) return;

            // 白名单：输入/候选/编辑器相关区域
            if (isWhitelistedTarget(target)) return;

            // 软键盘活跃时，不执行外部点击最小化
            if (isVirtualKeyboardLikelyOpen()) return;

            isMinimized.value = true;
            showSettings.value = false;
        };

        onMounted(() => {
            const targetDoc = parentWindow.document || document;
            targetDoc.addEventListener('pointerdown', onDocumentPointerDownAutoMinimize, true);

            parentWindow.addEventListener('resize', onViewportResize);
            parentWindow.addEventListener('orientationchange', onViewportResize);

            const vv = parentWindow.visualViewport;
            vv?.addEventListener('resize', onViewportResize);
            vv?.addEventListener('scroll', onViewportResize);

            nextTick(() => {
                clampPanelIntoViewport();
            });
        });

        onUnmounted(() => {
            stopPointerDrag();

            const targetDoc = parentWindow.document || document;
            targetDoc.removeEventListener('pointerdown', onDocumentPointerDownAutoMinimize, true);

            parentWindow.removeEventListener('resize', onViewportResize);
            parentWindow.removeEventListener('orientationchange', onViewportResize);

            const vv = parentWindow.visualViewport;
            vv?.removeEventListener('resize', onViewportResize);
            vv?.removeEventListener('scroll', onViewportResize);

            if (resizeRafId !== null) {
                parentWindow.cancelAnimationFrame?.(resizeRafId);
                resizeRafId = null;
            }

            if (renameDebounceTimer) {
                clearTimeout(renameDebounceTimer);
                renameDebounceTimer = null;
            }

            if (personaPreviewTimer) {
                clearInterval(personaPreviewTimer);
                personaPreviewTimer = null;
            }
        });


        // 功能函数
        const joinRoom = async () => {
            if (isJoining.value) return;

            if (!offlinePort.value.toString().trim()) {
                const _toastr = parentWindow.toastr || window.toastr;
                _toastr?.error('请输入端口');
                return;
            }

            const safeName = (userName.value || '').trim();
            if (!safeName) {
                const _toastr = parentWindow.toastr || window.toastr;
                _toastr?.error('请输入用户名');
                return;
            }

            isJoining.value = true;
            try {
                store.settings.defaultUserName = safeName;
                await store.connectOffline(
                    offlinePort.value || '2157',
                    offlinePassword.value || '',
                    safeName,
                    localSettings.clientUid
                );
            } catch (e) {
                console.error(e);
                const _toastr = parentWindow.toastr || window.toastr;
                _toastr?.error('连接失败: ' + e.message);
            } finally {
                isJoining.value = false;
            }
        };

        const createLocalRoom = async () => {
            if (isJoining.value) return;

            if (!offlinePort.value.toString().trim()) {
                const _toastr = parentWindow.toastr || window.toastr;
                _toastr?.error('请输入端口');
                return;
            }

            const safeName = (userName.value || '').trim();
            if (!safeName) {
                const _toastr = parentWindow.toastr || window.toastr;
                _toastr?.error('请输入用户名');
                return;
            }

            isJoining.value = true;
            try {
                store.settings.defaultUserName = safeName;
                await store.startOfflineServer(
                    offlinePort.value || '2157',
                    offlinePassword.value || '',
                    safeName,
                    localSettings.clientUid
                );
            } catch (e) {
                console.error(e);
                const _toastr = parentWindow.toastr || window.toastr;
                _toastr?.error('创建失败: ' + e.message);
            } finally {
                isJoining.value = false;
            }
        };
        
        const disconnect = () => store.disconnect();

        // Render 函数 - 使用 h() 创建虚拟 DOM
        return () => {
            const h = o.h;
            const statusClass = store.isConnected ? 'connected' : (store.mode !== 'disconnected' ? 'connecting' : 'disconnected');

            // 切换设置面板（与 v0.5.3 逻辑一致）
            const toggleSettings = () => {
                if (!showSettings.value && isMinimized.value) {
                    isMinimized.value = false;
                }
                showSettings.value = !showSettings.value;
            };

            // 主面板容器
            return h('div', {
                class: ['multiplayer-panel', {
                    minimized: isMinimized.value,
                    dragging: isDragging.value,
                    'settings-open': !isMinimized.value && showSettings.value
                }],
                style: panelStyle,
                ref: panelRef
            }, [
                // 头部栏
                h('div', {
                    class: 'panel-header',
                    onPointerdown: startPointerDrag
                }, [
                    // 左侧：状态灯 + 标题
                    h('div', { class: 'header-left' }, [
                        h('span', { class: ['status-dot', statusClass] }),
                        h('span', { class: 'title' }, '联机工具')
                    ]),
                    // 右侧：操作按钮组
                    h('div', { class: 'header-actions' }, [
                        // 断开按钮（仅已连接时显示）
                        store.mode !== 'disconnected'
                            ? h('button', {
                                class: 'icon-btn danger-icon fa-solid',
                                title: '断开连接',
                                onClick: (e) => { e.stopPropagation(); disconnect(); }
                            }, String.fromCharCode(0xf011))
                            : null,
                        // 设置按钮
                        h('button', {
                            class: 'icon-btn fa-solid',
                            title: '设置',
                            onClick: (e) => { e.stopPropagation(); toggleSettings(); }
                        }, String.fromCharCode(0xf013)),
                        // 最小化/展开按钮
                        h('button', {
                            class: 'icon-btn fa-solid',
                            title: isMinimized.value ? '展开' : '最小化',
                            onClick: (e) => { e.stopPropagation(); isMinimized.value = !isMinimized.value; }
                        }, isMinimized.value
                            ? String.fromCharCode(0xf065)
                            : String.fromCharCode(0xf066))
                    ].filter(Boolean))
                ]),

                // 内容区（未最小化且未进入设置页时渲染）
                (!isMinimized.value && !showSettings.value) ? h('div', {
                    class: 'panel-content'
                }, [
                    // ========== 未连接状态 ==========
                    store.mode === 'disconnected' ? h('div', { class: 'settings-section' }, [
                        // 用户名区块（小标题样式）
                        h('div', { class: 'username-section' }, [
                            h('div', { class: 'section-title' }, [
                                h('span', { class: 'fa-solid', style: { marginRight: '6px' } }, 
                            String.fromCharCode(0xf007)),
                                '用户名'
                        ]),

                            h('input', {
                                value: userName.value,
                                onInput: (e) => {
                                    const nextName = (e.target.value || '');
                                    userName.value = nextName;
                                    localSettings.defaultUserName = nextName;
                                },
                                onBlur: flushRenameNow,
                                placeholder: '输入用户名',
                                class: 'input-field'
                            })
                        ]),

                        // 在线模式界面
                        store.settings.onlineMode ? h(o.Fragment, null, [
                            // 房间列表区块
                            h('div', { key: 'rooms-section', class: 'online-rooms-section' }, [
                                // 区块头部
                                h('div', { class: 'section-header' }, [
                                    h('span', { class: 'section-title' }, [
                                    h('span', { class: 'fa-solid', style: { marginRight: '6px' } }, 
                                String.fromCharCode(0xf0ac)),
                                    '在线房间'
                                ]),
                                    h('button', {
                                        class: 'refresh-btn fa-solid',
                                        onClick: fetchRooms,
                                        disabled: isLoadingRooms.value
                                    }, isLoadingRooms.value
                                        ? String.fromCharCode(0xf252)
                                        : String.fromCharCode(0xf021))
                                ]),

                                // 房间列表或空提示
                                displayRooms.value.length > 0
                                    ? h('div', { class: 'room-list' },
                                        displayRooms.value.map(room =>
                                            h('div', {
                                                key: room.id,
                                                class: ['room-item', { selected: selectedRoom.value === room.id }],
                                                onClick: () => selectRoom(room)
                                            }, [
                                                h('div', { class: 'room-info' }, [
                                                    h('span', { class: 'room-name' }, room.name),
                                                    room.hasPassword
                                                        ? h('span', { class: 'room-lock fa-solid' },
                                                            String.fromCharCode(0xf023))
                                                        : null
                                                ].filter(Boolean)),
                                                h('div', { class: 'room-meta' }, [
                                                    h('span', { class: 'fa-solid' },
                                                        String.fromCharCode(0xf0c0) + ' ' +
                                                        getRoomDisplayCurrentUsers(room) + '/' + room.maxUsers),
                                                    h('span', {}, 'by ' + room.creatorName)
                                                ])
                                            ])
                                        )
                                    )
                                    : h('div', { class: 'empty-rooms' },
                                        isLoadingRooms.value ? '加载中...' : '暂无房间，点击下方创建'),

                                // 加入选中房间
                                selectedRoom.value
                                    ? h('div', { class: 'join-room-section' }, [
                                        h('input', {
                                            value: joinPassword.value,
                                            onInput: (e) => joinPassword.value = e.target.value,
                                            type: 'password',
                                            placeholder: '房间密码（如需要）',
                                            class: 'input-field'
                                        }),
                                        h('button', {
                                            class: 'action-btn primary',
                                            onClick: () => joinSelectedRoom(false),
                                            disabled: isJoining.value,
                                            title: isJoining.value ? '正在加入，请稍候...' : '加入'
                                        }, [
                                            h('span', { class: 'join-btn-icon fa-solid' }, String.fromCharCode(0xf2f6)),
                                            h('span', { class: 'join-btn-label' }, '加入')
                                        ]),
                                        h('button', {
                                            class: 'action-btn primary',
                                            onClick: () => joinSelectedRoom(true),
                                            disabled: isJoining.value,
                                            title: isJoining.value ? '正在进入观看，请稍候...' : '观看'
                                        }, [
                                            h('span', { class: 'join-btn-icon fa-solid' }, String.fromCharCode(0xf06e)),
                                            h('span', { class: 'join-btn-label' }, '观看')
                                        ])
                                    ])
                                    : null,

                                // 创建新房间
                                h('div', { class: 'create-room-section' }, [
                                    h('div', { class: 'section-title' }, [
                                        h('span', { class: 'fa-solid', 
                                        style: { marginRight: '6px' } }, 
                                    String.fromCharCode(0xf067)),
                                        '创建房间'
                                    ]),
                                    h('input', {
                                        value: newRoomName.value,
                                        onInput: (e) => newRoomName.value = e.target.value,
                                        placeholder: '房间名称',
                                        class: 'input-field'
                                    }),
                                    h('div', { class: 'create-room-options' }, [
                                        h('input', {
                                            value: newRoomPassword.value,
                                            onInput: (e) => newRoomPassword.value = e.target.value,
                                            type: 'password',
                                            placeholder: '密码（可选）',
                                            class: 'input-field medium'
                                        }),
                                        h('input', {
                                            value: newRoomMaxUsers.value,
                                            onInput: (e) => newRoomMaxUsers.value = parseInt(e.target.value) || 8,
                                            type: 'number',
                                            placeholder: '人数',
                                            class: 'input-field tiny',
                                            min: 2,
                                            max: 20
                                        })
                                    ]),
                                    h('button', {
                                        class: 'action-btn primary',
                                        onClick: createAndJoinRoom,
                                        disabled: !newRoomName.value.trim() || isCreating.value
                                    }, isCreating.value ? '创建中...' : '创建并加入')
                                ])
                            ])
                        ])
                        // 离线模式界面
                        : h(o.Fragment, null, [
                            h('div', { key: 'offline-port', class: 'setting-row' }, [
                                h('label', {}, '端口:'),
                                h('input', {
                                    value: offlinePort.value,
                                    onInput: (e) => offlinePort.value = e.target.value,
                                    type: 'number',
                                    class: 'input-field small'
                                })
                            ]),
                            h('div', { key: 'offline-pwd', class: 'setting-row' }, [
                                h('label', {}, '密码:'),
                                h('input', {
                                    value: offlinePassword.value,
                                    onInput: (e) => offlinePassword.value = e.target.value,
                                    type: 'password',
                                    placeholder: '可选',
                                    class: 'input-field'
                                })
                            ]),
                            h('div', { key: 'offline-btns', class: 'button-group' }, [
                                h('button', {
                                    class: 'action-btn secondary',
                                    onClick: createLocalRoom,
                                    disabled: isJoining.value
                                }, isJoining.value ? '处理中...' : '创建房间'),
                                h('button', {
                                    class: 'action-btn primary',
                                    onClick: joinRoom,
                                    disabled: isJoining.value
                                }, isJoining.value ? '处理中...' : '加入房间')
                            ])
                        ])
                    ]) : null,

                    // ========== 已连接状态 ==========
                    store.mode !== 'disconnected' ? h(o.Fragment, null, [

                        // ---- 用户列表 ----
                        h('div', { key: 'user-list', class: 'user-list' }, [
                            h('div', { class: 'section-title fa-solid' }, [
                                String.fromCharCode(0xf0c0) + ' 玩家 (' + userCount.value + ') ',
                                store.isHost
                                    ? h('span', { class: 'host-badge' }, '你是房主')
                                    : null
                            ]),
                            h('div', { class: 'user-items' },
                                onlineUsers.value.map(u => {
                                    const leadingNode = u.isHost
                                        ? h(
                                            'span',
                                            {
                                                class: ['user-leading-icon', 'host-crown', 'fa-solid'],
                                                title: '房主'
                                            },
                                            String.fromCharCode(0xf521)
                                        )
                                        : (
                                            store.isHost
                                                ? h('button', {
                                                    class: 'transfer-leading-btn fa-solid',
                                                    title: '转让房主',
                                                    onClick: (e) => {
                                                        e.stopPropagation();
                                                        transferHost(u.id);
                                                    }
                                                }, String.fromCharCode(0xf362))
                                                : h(
                                                    'span',
                                                    {
                                                        class: ['user-leading-icon', 'fa-solid'],
                                                        title: '玩家'
                                                    },
                                                    String.fromCharCode(0xf007)
                                                )
                                        );

                                    return h('div', {
                                        key: u.id,
                                        class: ['user-item', {
                                            host: u.isHost,
                                            submitted: hasSubmitted(u.id)
                                        }]
                                    }, [
                                        leadingNode,
                                        h('span', { class: 'user-name' }, u.name || '匿名')
                                    ]);
                                })
                            )
                        ]),

                        // ---- 观众列表 ----
                        spectators.value.length > 0
                            ? h('div', { key: 'spectator-list', class: 'spectator-list' }, [
                                h(
                                    'div',
                                    {
                                        class: 'section-title fa-solid',
                                        style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            cursor: 'pointer'
                                        },
                                        onClick: toggleSpectatorsCollapsed
                                    },
                                    [
                                        h('span', {}, `${String.fromCharCode(0xf06e)} 观众 (${spectators.value.length})`),
                                        h(
                                            'span',
                                            { class: 'fa-solid' },
                                            spectatorsCollapsed.value
                                                ? String.fromCharCode(0xf078)
                                                : String.fromCharCode(0xf077)
                                        )
                                    ]
                                ),
                                !spectatorsCollapsed.value
                                    ? h('div', { class: 'spectator-items' },
                                        spectators.value.map(u =>
                                            h('span', { key: u.id, class: ['user-item', 'spectator-item'] }, [
                                                h(
                                                    'span',
                                                    {
                                                        class: ['user-leading-icon', 'fa-solid'],
                                                        title: '观众'
                                                    },
                                                    String.fromCharCode(0xf06e)
                                                ),
                                                h('span', { class: 'user-name' }, u.name || '匿名')
                                            ])
                                        )
                                    )
                                    : null
                            ])
                            : null,

                        // ---- 聊天日志 ----
                        h('div', { class: 'section-title fa-solid' }, `${String.fromCharCode(0xf4ad)} 聊天消息`),
                        h('div', {
                            key: 'chat-logs',
                            class: 'chat-logs',
                            ref: logsRef
                        }, [
                            ...store.chatLogs.map(log =>
                                h('div', {
                                    key: log.id,
                                    class: ['log-item', log.type]
                                }, [
                                    h('span', { class: 'log-time' }, formatTime(log.timestamp)),
                                    h('span', { class: 'log-from' }, log.from + ':'),
                                    h('span', { class: 'log-content' }, log.content)
                                ])
                            ),
                            store.chatLogs.length === 0
                                ? h('div', { class: 'empty-logs' }, '暂无消息')
                                : null
                        ]),

                        // ---- 本轮输入池（所有用户可见） ----
                        h('div', { key: 'inputs-display' }, [
                            h('div', { class: 'section-title' }, [
                                '本轮输入池 (' + submittedCount.value + '/' + userCount.value + ') ',
                                allSubmitted.value && userCount.value > 0
                                    ? h('span', { class: 'all-submitted' }, '✓ 全部到齐')
                                    : null
                            ]),
                            getPendingMap().size > 0
                                ? h('div', { class: 'pending-inputs' },
                                    Array.from(getPendingMap().entries()).map(([uid, data]) =>
                                        h('div', { key: uid, class: 'pending-input-item' }, [
                                            h('span', { class: 'input-user' }, data.userName + ':'),
                                            (data.hideContent && uid !== myClientId.value)
                                                ? h('span', { class: 'input-content hidden-content' }, '********')
                                                : h('span', { class: 'input-content' },
                                                    data.content.substring(0, 50) + (data.content.length > 50 ? '...' : ''))
                                        ])
                                    )
                                )
                                : h('div', { class: 'empty-inputs' }, '暂无输入')
                        ]),

                        // ---- 输入提交区 ----
                        h('div', { key: 'input-submit', class: 'input-submit-area' }, [
                            // 客户端同步按钮行（非房主可见）
                            !store.isHost
                                ? h('div', { class: 'sync-buttons-row' }, [
                                    h('button', {
                                        class: 'sync-history-btn fa-solid',
                                        title: '同步房主的历史消息',
                                        onClick: requestSyncHistory
                                    }, String.fromCharCode(0xf019) + ' 同步历史'),
                                    h('button', {
                                        class: 'sync-history-btn fa-solid',
                                        title: '同步房主的局部正则',
                                        onClick: requestSyncRegex
                                    }, String.fromCharCode(0xf328) + ' 同步正则'),
                                    h('button', {
                                        class: 'sync-history-btn fa-solid',
                                        title: '同步房主的变量数据',
                                        onClick: requestSyncVariables
                                    }, String.fromCharCode(0xf080) + ' 同步变量')
                                ])
                                : null,

                            // 输入文本框（观众模式隐藏）
                            !store.spectatorMode
                                ? h('textarea', {
                                    value: myInput.value,
                                    onInput: (e) => myInput.value = e.target.value,
                                    class: 'input-textarea',
                                    placeholder: store.isHost
                                        ? '房主输入（可选，会与其他输入合并）...'
                                        : '输入你的本轮内容，点击提交发送...',
                                    rows: 3
                                })
                                : null,

                            // 按钮组（观众模式隐藏）
                            !store.spectatorMode
                                ? h('div', { class: 'button-group' }, [
                                    // 房主重置按钮
                                    store.isHost
                                        ? h('button', {
                                            class: 'action-btn secondary',
                                            onClick: resetInputs,
                                            disabled: getPendingMap().size === 0
                                        }, '重置')
                                        : null,
                                    // 提交输入按钮
                                    h('button', {
                                        class: ['action-btn', mySubmitted.value ? 'secondary fa-solid' : 'primary'],
                                        onClick: mySubmitted.value ? revokeInput : sendInput,
                                        disabled: mySubmitted.value ? false : !myInput.value.trim()
                                    }, mySubmitted.value
                                        ? `${String.fromCharCode(0xf2ea)} 撤回`
                                        : '提交输入'),
                                    // 房主立即发送按钮
                                    store.isHost
                                        ? h('button', {
                                            class: 'action-btn primary',
                                            onClick: submitToAI,
                                            disabled: getPendingMap().size === 0
                                        }, '立即发送 ')
                                        : null
                                ].filter(Boolean))
                                : null
                        ]),

                        // ---- 聊天输入区 ----
                        h('div', { key: 'chat-input', class: 'chat-input-area' }, [
                            h('input', {
                                value: chatMsg.value,
                                onInput: (e) => chatMsg.value = e.target.value,
                                onKeyup: (e) => { if (e.key === 'Enter') sendChat(); },
                                placeholder: '发送聊天消息...',
                                class: 'chat-input'
                            }),
                            h('button', {
                                class: 'send-btn small fa-solid',
                                onClick: sendChat,
                                disabled: !chatMsg.value.trim()
                            }, String.fromCharCode(0xf1d8))
                        ])

                    ]) : null   // ← Fragment 三元结束
                ]) : null,      // ← panel-content 闭合

                // ========== 设置弹窗（绝对定位覆盖整个面板，与 v0.5.3 一致） ==========
                (!isMinimized.value && showSettings.value) ? h('div', {
                    key: 'settings',
                    class: 'settings-modal'
                }, [
                    h('div', { class: 'settings-modal-content' }, [
                    // 设置主体（无内置大标题，通过顶部“设置”按钮切换开关）
                    h('div', { class: 'settings-modal-body' }, [

                        // ---- UI主题导入（置顶） ----
                        h('div', { class: 'setting-item', style: { marginTop: UI_STYLE_TOKENS.gap4 } }, [
                            h('label', { class: 'mp-theme-import-label' }, 'UI主题导入:'),
                            h('input', {
                                ref: themeFileInputRef,
                                type: 'file',
                                accept: '.json,application/json',
                                style: { display: 'none' },
                                onChange: onThemeFileChange
                            }),
                            h('button', {
                                class: 'action-btn secondary fa-solid',
                                onClick: () => themeFileInputRef.value?.click()
                            }, String.fromCharCode(0xf093) + ' 导入JSON'),
                            h('small', { class: 'hint' }, '支持 mpThemeTokens / tokens / variables / 根对象中的 --mp- 变量')
                        ]),

                        // ---- 用户名（置顶） ----
                        h('div', { class: 'setting-item' }, [
                            h('label', {}, '用户名'),
                            h('input', {
                                value: localSettings.defaultUserName,
                                onInput: (e) => { localSettings.defaultUserName = e.target.value; },
                                onChange: saveSettings,
                                onBlur: flushRenameNow,
                                onKeyup: (e) => {
                                    if (e.key === 'Enter') flushRenameNow();
                                },
                                placeholder: '设置用户名',
                                class: 'settings-input'
                            })
                        ]),

                        // ---- UID（置顶，用户名下方） ----
                        h('div', { class: 'setting-item', style: { marginTop: UI_STYLE_TOKENS.gap2 } }, [
                            h('label', {}, 'UID:'),
                            h('input', {
                                value: localSettings.clientUid,
                                onInput: (e) => { localSettings.clientUid = e.target.value; },
                                onChange: saveSettings,
                                placeholder: '用户唯一标识（可自定义）',
                                class: 'settings-input',
                                disabled: store.isConnected
                            }),
                            h(
                                'small',
                                { class: 'hint' },
                                store.isConnected
                                    ? '已连接状态下 UID 已锁定，断开后可修改'
                                    : '用于绑定身份，不随用户名变化'
                            )
                        ]),

                        // ---- 在线模式开关 ----
                        h('div', { class: 'setting-item toggle-item', style: { marginTop: UI_STYLE_TOKENS.gap4 } }, [
                            h('div', {
                                class: 'toggle-label',
                                onClick: () => { store.settings.onlineMode = !store.settings.onlineMode; }
                            }, [
                                h('span', { class: 'fa-solid' }, String.fromCharCode(0xf0ac) + ' 在线模式:'),
                                h('span', { class: ['toggle-switch', { active: store.settings.onlineMode }] })
                            ]),
                            h('small', { class: 'hint' }, '连接到公共服务器创建/加入房间')
                        ]),

                        // ---- 服务器地址（仅在线模式） ----
                        store.settings.onlineMode
                            ? h('div', { class: 'setting-item', style: { marginBottom: UI_STYLE_TOKENS.gap2 } }, [

                                h('label', {}, '服务器地址:'),
                                h('input', {
                                    value: store.settings.onlineServer,
                                    onInput: (e) => { store.settings.onlineServer = e.target.value; },
                                    placeholder: 'https://room.example.com',
                                    class: 'settings-input'
                                })
                            ])
                            : null,

                        // ---- 观众模式 ----
                        h('div', { class: 'setting-item toggle-item', style: { marginTop: UI_STYLE_TOKENS.gap4 } }, [
                            h('div', {
                                class: 'toggle-label',
                                onClick: () => {
                                    const next = !store.spectatorMode;
                                    const ret = store.setSpectatorMode(next);
                                    if (ret?.ok === false) return;
                                    saveSettings();
                                }
                            }, [
                                h('span', { class: 'fa-solid' }, String.fromCharCode(0xf06e) + ' 观众模式:'),
                                h('span', { class: ['toggle-switch', { active: store.spectatorMode }] })
                            ]),
                            h(
                                'small',
                                { class: 'hint' },
                                store.isHost
                                    ? '房主不可切换为观众模式'
                                    : (store.isConnected ? '已连接：立即切换观战状态' : '未连接：作为默认加入身份')
                            )
                        ]),

                        // ---- 变量模式 ----
                        h('div', { class: 'setting-item' }, [
                            h('label', {}, '变量模式 (房主设置):'),
                            h('select', {
                                value: store.variableMode || 'none',
                                onChange: (e) => { store.variableMode = e.target.value; },
                                class: 'settings-input'
                            }, [
                                h('option', { value: 'none' }, '无变量'),
                                h('option', { value: 'mvu' }, 'MVU变量'),
                                h('option', { value: 'apotheosis' }, '数据库')
                            ]),
                            h('small', { class: 'hint' }, '支持MVU和数据库表数据同步')
                        ]),

                        // ---- 自动发送开关（仅房主可见）----
                        store.isHost
                            ? h('div', { class: 'setting-item toggle-item' }, [
                                h('div', {
                                    class: 'toggle-label',
                                    onClick: () => {
                                        localSettings.autoSendWhenAllSubmitted = !localSettings.autoSendWhenAllSubmitted;
                                        saveSettings();
                                    }
                                }, [
                                    h('span', {}, '自动发送:'),
                                    h('span', { class: ['toggle-switch', { active: localSettings.autoSendWhenAllSubmitted }] })
                                ]),
                                h('small', { class: 'hint' }, '开启后，所有玩家提交完成将自动发送')
                            ])
                            : null,

                        // ---- 限时输入（仅房主可见，放在自动发送下一行） ----
                        store.isHost
                            ? h('div', { class: 'setting-item' }, [
                                h('label', {}, '限时输入 (秒):'),
                                h('input', {
                                    type: 'number',
                                    value: localSettings.timedInputSeconds,
                                    onInput: (e) => { localSettings.timedInputSeconds = parseInt(e.target.value) || 0; },
                                    onChange: saveSettings,
                                    min: 0,
                                    max: 300,
                                    class: 'settings-input',
                                    style: { width: UI_STYLE_TOKENS.narrowInputWidth }
                                }),
                                h('small', { class: 'hint' }, '有人提交后N秒自动发送，0为关闭')
                            ])
                            : null,

                        // ---- 自动同步开关（仅非房主可见）----
                        !store.isHost
                            ? h('div', { class: 'setting-item toggle-item', style: { marginTop: UI_STYLE_TOKENS.gap4 } }, [
                                h('div', {
                                    class: 'toggle-label',
                                    onClick: () => {
                                        localSettings.autoSyncOnConnect = !localSettings.autoSyncOnConnect;
                                        saveSettings();
                                        if (localSettings.autoSyncOnConnect) {
                                            triggerAutoSync();
                                        }
                                    }
                                }, [
                                    h('span', {}, '自动同步:'),
                                    h('span', { class: ['toggle-switch', { active: localSettings.autoSyncOnConnect }] })
                                ]),
                                h('small', { class: 'hint' }, '开启后，连接成功将自动同步历史/正则/变量')
                            ])
                            : null,

                        // ---- 隐藏模式开关 ----
                        h('div', { class: 'setting-item toggle-item', style: { marginTop: UI_STYLE_TOKENS.gap4 } }, [
                            h('div', {
                                class: 'toggle-label',
                                onClick: () => {
                                    localSettings.hideUserInputContent = !localSettings.hideUserInputContent;
                                    saveSettings();
                                }
                            }, [
                                h('span', {}, '隐藏模式:'),
                                h('span', { class: ['toggle-switch', { active: localSettings.hideUserInputContent }] })
                            ]),
                            h('small', { class: 'hint' }, '开启后其他人看不到你输入的具体内容（显示为 ********）')
                        ]),

                        // ---- 同步历史消息层数（仅非房主可见） ----
                        !store.isHost
                            ? h('div', { class: 'setting-item' }, [
                                h('label', {}, '同步历史消息层数:'),
                                h('input', {
                                    type: 'number',
                                    value: localSettings.syncHistoryDepth,
                                    onInput: (e) => { localSettings.syncHistoryDepth = parseInt(e.target.value) || 0; },
                                    onChange: saveSettings,
                                    min: 0,
                                    max: 1000,
                                    class: 'settings-input',
                                    style: { width: UI_STYLE_TOKENS.narrowInputWidth }
                                }),
                                h('small', { class: 'hint' }, '限制同步的历史消息数量，0为全部')
                            ])
                            : null,

                        // ---- 发送用户设定开关 ----
                        h('div', { class: 'setting-item toggle-item', style: { marginTop: UI_STYLE_TOKENS.gap4 } }, [
                            h('div', {
                                class: 'toggle-label',
                                onClick: () => { localSettings.sendUserPersona = !localSettings.sendUserPersona; saveSettings(); }
                            }, [
                                h('span', {}, '发送用户设定:'),
                                h('span', { class: ['toggle-switch', { active: localSettings.sendUserPersona }] })
                            ]),
                            h('small', { class: 'hint' }, '开启后提交输入时会将酒馆用户设定同步给房主')
                        ]),

                        // ---- 设定前缀（仅开启发送用户设定时显示） ----
                        localSettings.sendUserPersona
                            ? h('div', { class: 'setting-item', style: { marginTop: UI_STYLE_TOKENS.gap2 } }, [
                                h('label', {}, '设定前缀:'),
                                h('input', {
                                    value: localSettings.personaPrefix,
                                    onInput: (e) => { localSettings.personaPrefix = e.target.value; },
                                    onChange: saveSettings,
                                    placeholder: '例如: [{name}]的设定:',
                                    class: 'settings-input'
                                }),
                                h('small', { class: 'hint' }, `当前设定前缀预览：${applyNameToken(localSettings.personaPrefix || '[{name}]的设定:')}`)
                            ])
                            : null,

                        // ---- 消息前缀（设定前缀下方、预览上方）----
                        h('div', { class: 'setting-item message-prefix-setting', style: { marginTop: UI_STYLE_TOKENS.gap2 } }, [
                            h('label', {}, '消息前缀:'),
                            h('input', {
                                value: localSettings.messagePrefix,
                                onInput: (e) => { localSettings.messagePrefix = e.target.value; },
                                onChange: saveSettings,
                                placeholder: '例如: [{name}]',
                                class: 'settings-input'
                            }),
                            h('small', { class: 'hint' }, '使用 {name}，默认按用户设定角色名替换')
                        ]),

                        // ---- 消息后缀（移动到消息前缀下一行）----
                        h('div', { class: 'setting-item', style: { marginTop: UI_STYLE_TOKENS.gap2 } }, [
                            h('label', {}, '消息后缀:'),
                            h('input', {
                                value: localSettings.messageSuffix,
                                onInput: (e) => { localSettings.messageSuffix = e.target.value; },
                                onChange: saveSettings,
                                placeholder: '例如: desu!!',
                                class: 'settings-input'
                            })
                        ]),

                        // ---- 预览框 ----
                        h('div', { class: 'preview-box' }, [
                            h('div', {}, [
                                h('span', { class: 'preview-label' }, '消息预览:'),
                                h('span', { class: 'preview-text' }, previewText.value)
                            ]),
                            h('div', { style: { marginTop: UI_STYLE_TOKENS.gap8 } }, [
                                h('span', { class: 'preview-label' }, '用户设定发送预览:'),
                                h('span', { class: 'preview-text' }, personaPreviewText.value)
                            ])
                        ])

                    ].filter(Boolean))  // ← settings-modal-body children 过滤 null
                    ])                  // ← settings-modal-content 闭合
                ]) : null               // ← settings-modal 三元结束
            ]);                         // ← multiplayer-panel 的 h() 闭合
        };                                  // ← render 箭头函数闭合
    }
});


// ==========================================
