// 7. ST 原生事件桥接 
// ==========================================
const initSTHooks = (store) => {
    let streamMsgId = null; // 客户端当前流式消息 ID
    let lastDeleteTrackId = getLastMessageId(); // 删除追踪

    // 房主端流标识
    let hostStreamId = '';
    let hostStreamSeq = 0;

    // 客户端端流状态
    let clientActiveStreamId = '';
    let clientLastSeq = 0;

    // 串行化消息写入，避免 create/set 并发竞态
    let streamQueue = Promise.resolve();
    const enqueueStreamTask = (task) => {
        streamQueue = streamQueue
            .then(() => task())
            .catch((e) => {
                console.error('[联机Mod] 流式任务失败:', e);
            });
        return streamQueue;
    };

    // ---- 房主：广播流式 Token ----
    onEventTracked(tavern_events.STREAM_TOKEN_RECEIVED, (token) => {
        if (store.isHost && store.isConnected) {
            if (!hostStreamId) {
                hostStreamId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                hostStreamSeq = 0;
            }
            hostStreamSeq += 1;

            store.getClient()?.broadcast({
                type: 'ai_stream',
                data: {
                    streamId: hostStreamId,
                    seq: hostStreamSeq,
                    content: token
                }
            });
        }
    });

    // ---- 房主：广播完整 AI 回复 ----
    onEventTracked(tavern_events.MESSAGE_RECEIVED, (data) => {
        lastDeleteTrackId = getLastMessageId();
        if (!store.isHost || !store.isConnected) return;

        const msgs = getChatMessages(data);
        if (msgs.length > 0 && msgs[0].role === 'assistant') {
            const doneStreamId = hostStreamId || `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

            store.getClient()?.broadcast({
                type: 'ai_response',
                data: {
                    streamId: doneStreamId,
                    content: msgs[0].message,
                    variableMode: store.variableMode
                }
            });

            hostStreamId = '';
            hostStreamSeq = 0;
        }
    });

    // ---- 房主：消息发送后更新追踪 ID ----
    onEventTracked(tavern_events.MESSAGE_SENT, () => {
        lastDeleteTrackId = getLastMessageId();
    });

    // ---- 房主：检测删除最新消息并广播 ----
    onEventTracked(tavern_events.MESSAGE_DELETED, (id) => {
        if (store.isConnected && store.isHost) {
            if (id === lastDeleteTrackId) {
                store.getClient()?.broadcast({ type: 'delete_last_message', data: {} });
            }
            lastDeleteTrackId = getLastMessageId();
        }
    });

    // ---- 房主：AI 生成结束后同步 MVU 变量 ----
    onEventTracked(tavern_events.GENERATION_ENDED, () => {
        if (store.isConnected && store.isHost && store.variableMode === 'mvu') {
            setTimeout(() => {
                const msgId = getLastMessageId();
                if (msgId < 0) return;
                try {
                    const vars = getVariables({ type: 'message', message_id: msgId });
                    if (vars && (vars.stat_data || vars.display_data)) {
                        store.getClient()?.broadcast({
                            type: 'sync_variables',
                            data: {
                                variableType: 'mvu',
                                content: {
                                    stat_data: vars.stat_data,
                                    display_data: vars.display_data,
                                    delta_data: vars.delta_data,
                                    schema: vars.schema
                                }
                            }
                        });
                    }
                } catch (e) { console.error('[联机Mod] MVU 自动同步失败:', e); }
            }, 500);
        }
    });

    // ---- 房主：注入联机玩家 Persona ----
    onEventTracked(tavern_events.GENERATION_AFTER_COMMANDS, () => {
        const personaMap = (() => {
            const pp = store.pendingPersonas;
            return (pp && typeof pp.has === 'function') ? pp : (pp?.value ?? new Map());
        })();

        if (store.isHost && personaMap.size > 0) {
            const combined = Array.from(personaMap.values())
                .map(p => `${p.prefix} ${p.content}`)
                .join('\n\n');
            injectPrompts([{
                id: 'mp_personas',
                position: 'in_chat',
                depth: 0,
                role: 'system',
                content: combined
            }], { once: true });
            personaMap.clear();
            try { triggerRef(store.pendingPersonas); } catch (e) {}
        }

        // 重roll补偿：隐藏模式输入不会保留在用户层消息中，这里在生成前补回系统层上下文
        const hiddenCtx = (store.getHiddenRerollContext?.() || '').toString().trim();
        if (store.isHost && hiddenCtx) {
            injectPrompts([{
                id: 'mp_hidden_inputs_reroll',
                position: 'in_chat',
                depth: 0,
                role: 'system',
                content: `以下为本轮隐藏模式输入，仅用于保持重roll一致性：\n\n${hiddenCtx}`
            }], { once: true });
        }
    });

    // ---- 客户端：接收流式 Token ----
    onEventTracked('multiplayer_ai_stream', (payload) => {
        if (store.isHost) return;

        enqueueStreamTask(async () => {
            const data = typeof payload === 'string'
                ? { content: payload, streamId: '', seq: 0 }
                : (payload || {});

            const token = (data.content ?? '').toString();
            const incomingStreamId = (data.streamId || '').toString();
            const incomingSeq = Number(data.seq || 0);

            // 新流：重置序列与消息引用
            if (incomingStreamId && incomingStreamId !== clientActiveStreamId) {
                clientActiveStreamId = incomingStreamId;
                clientLastSeq = 0;
                streamMsgId = null;
            }

            // 去重/乱序保护（有 seq 时生效）
            if (incomingSeq > 0) {
                if (incomingSeq <= clientLastSeq) return;
                clientLastSeq = incomingSeq;
            }

            if (streamMsgId === null) {
                await createChatMessages([{ role: 'assistant', message: token }]);
                streamMsgId = getLastMessageId();
            } else {
                await setChatMessages([{ message_id: streamMsgId, message: token }]);
            }
        });
    });

    // ---- 客户端：接收完整 AI 回复 ----
    onEventTracked('multiplayer_ai_response', (payload) => {
        if (store.isHost) return;

        enqueueStreamTask(async () => {
            try {
                const data = typeof payload === 'string'
                    ? { content: payload, streamId: '' }
                    : (payload || {});

                const content = (data.content ?? '').toString();
                const doneStreamId = (data.streamId || '').toString();

                let finalContent = content;
                if (store.variableMode === 'mvu' && !content.includes('<StatusPlaceHolderImpl/>')) {
                    finalContent = content + '\n\n<StatusPlaceHolderImpl/>';
                }

                if (doneStreamId && clientActiveStreamId && doneStreamId !== clientActiveStreamId) {
                    // 完整包属于新轮次，直接新建，避免覆盖旧流
                    streamMsgId = null;
                    clientActiveStreamId = doneStreamId;
                    clientLastSeq = 0;
                }

                if (streamMsgId !== null) {
                    await setChatMessages([{ message_id: streamMsgId, message: finalContent }]);
                } else {
                    await createChatMessages([{ role: 'assistant', message: finalContent }]);
                }

                streamMsgId = null;
                clientActiveStreamId = '';
                clientLastSeq = 0;

            } catch (e) {
                store.addLog('error', '系统', '同步AI回复失败');
                console.error('[联机Mod] 同步AI回复失败:', e);
            }
        });
    });

    // ---- 客户端：接收用户合并消息 ----
    onEventTracked('multiplayer_user_message', async (payload) => {
        if (store.isHost) return;

        try {
            let content = '';

            if (payload && Array.isArray(payload.inputs) && payload.inputs.length > 0) {
                content = payload.inputs
                    .map(item => {
                        const name = item.userName || '匿名';
                        const prefix = (item.prefix || '[{name}]:').replace('{name}', name);
                        return `${prefix} ${(item.content ?? '').toString()}`;
                    })
                    .join('\n\n');
            } else {
                content = (payload?.content ?? '').toString();
            }

            if (!content.trim()) {
                if (!payload?.userLayerHidden) {
                    store.addLog('error', '系统', '同步用户消息为空，已忽略');
                }
                return;
            }

            await createChatMessages([{ role: 'user', message: content }]);
        } catch (e) {
            store.addLog('error', '系统', '创建用户消息失败');
            console.error('[联机Mod] 创建用户消息失败:', e);
        }
    });

    // ---- 客户端：接收删除最新消息指令 ----
    onEventTracked('multiplayer_delete_last_message', async () => {
        if (store.isHost) return;
        try {
            const lastId = getLastMessageId();
            if (lastId >= 0) {
                await deleteChatMessages([lastId]);
            }
        } catch (e) {
            store.addLog('error', '系统', '删除消息失败');
            console.error('[联机Mod] 删除消息失败:', e);
        }
    });

    // ---- 房主：处理历史同步请求 ----
    onEventTracked('multiplayer_sync_history_request', async (payload) => {
        if (!store.isHost) return;

        const safePayload = payload ?? {};
        let userId = '';
        let depth = 0;

        if (typeof safePayload === 'string') {
            userId = safePayload;
        } else {
            userId = (safePayload.userId || '').toString();
            const d = Number(safePayload.depth);
            depth = Number.isFinite(d) && d >= 0 ? Math.floor(d) : 0;
        }

        try {
            const lastId = getLastMessageId();
            if (lastId < 0) return;

            let startId = 0;
            if (depth > 0 && lastId >= depth) startId = lastId - depth + 1;

            const messages = getChatMessages(`${startId}-${lastId}`).map(m => ({
                role: m.role,
                message: m.message
            }));

            const client = store.getClient();
            for (const msg of messages) {
                client?.send({
                    type: 'sync_history_data',
                    data: { role: msg.role, message: msg.message, targetUserId: userId }
                });
            }

            client?.send({
                type: 'sync_history_data',
                data: { complete: true, count: messages.length, targetUserId: userId }
            });
        } catch (e) {
            store.addLog('error', '系统', '获取历史消息失败');
            console.error('[联机Mod] 获取历史消息失败:', e);
        }
    });

    // ---- 客户端：接收历史消息数据 ----
    onEventTracked('multiplayer_sync_history_data', async (data) => {
        if (store.isHost) return;

        const myId = (store.getClient()?.userId || '').toString();
        const targetUserId = (data?.targetUserId || '').toString();

        // 定向包：非目标客户端直接忽略
        if (targetUserId && targetUserId !== myId) return;

        try {
            if (data?.role && data?.message) {
                await createChatMessages([{ role: data.role, message: data.message }]);
            }
        } catch (e) {
            store.addLog('error', '系统', '创建历史消息失败');
            console.error('[联机Mod] 创建历史消息失败:', e);
        }
    });

    // ---- 房主：处理正则同步请求 ----
    onEventTracked('multiplayer_sync_regex_request', (userId) => {
        if (!store.isHost) return;
        try {
            const regexes = getTavernRegexes({ scope: 'character' });
            store.getClient()?.send({ type: 'sync_regex_data', data: { regexes, targetUserId: userId } });
        } catch (e) {
            store.addLog('error', '系统', '获取正则失败');
            console.error('[联机Mod] 获取正则失败:', e);
        }
    });

    // ---- 客户端：接收正则数据 ----
    onEventTracked('multiplayer_sync_regex_data', async (data) => {
        if (store.isHost) return;

        const myId = (store.getClient()?.userId || '').toString();
        const targetUserId = (data?.targetUserId || '').toString();

        // 定向包：非目标客户端直接忽略
        if (targetUserId && targetUserId !== myId) return;

        try {
            const { regexes } = data || {};
            if (regexes && Array.isArray(regexes)) {
                await replaceTavernRegexes(regexes, { scope: 'character' });
            }
        } catch (e) {
            store.addLog('error', '系统', '替换正则失败');
            console.error('[联机Mod] 替换正则失败:', e);
        }
    });

    // ---- 房主：处理变量同步请求 ----
    onEventTracked('multiplayer_sync_variables_request', async (payload) => {
        if (!store.isHost) return;
        const { userId, variableMode: reqMode } = payload;
        const client = store.getClient();
        try {
            if (reqMode === 'mvu') {
                const msgId = getLastMessageId();
                if (msgId < 0) {
                    client?.send({ type: 'sync_variables', data: { variableType: 'mvu', content: { error: '无消息ID' }, targetUserId: userId } });
                    return;
                }
                const vars = getVariables({ type: 'message', message_id: msgId });
                if (!vars || (!vars.stat_data && !vars.display_data && !vars.delta_data)) {
                    client?.send({ type: 'sync_variables', data: { variableType: 'mvu', content: { error: '无MVU变量' }, targetUserId: userId } });
                    return;
                }
                client?.send({ type: 'sync_variables', data: {
                    variableType: 'mvu',
                    content: { stat_data: vars.stat_data, display_data: vars.display_data, delta_data: vars.delta_data, schema: vars.schema },
                    targetUserId: userId
                } });
            } else if (reqMode === 'apotheosis') {
                // 数据库全量同步：提取 ACU 隔离数据并广播
                const win = parentWindow;
                const ctx = win.SillyTavern?.getContext?.();
                const chat = ctx?.chat;
                if (!chat || chat.length === 0) {
                    client?.send({ type: 'sync_variables', data: { variableType: 'apotheosis', content: { error: '无数据库变量' }, targetUserId: userId } });
                    return;
                }
                // 找到隔离标签
                let isoKey = '';
                for (let i = chat.length - 1; i >= 0; i--) {
                    if (chat[i].TavernDB_ACU_IsolatedData) {
                        const keys = Object.keys(chat[i].TavernDB_ACU_IsolatedData);
                        if (keys.length > 0) { isoKey = keys[0]; break; }
                    }
                    if (chat[i].TavernDB_ACU_Identity !== undefined) { isoKey = chat[i].TavernDB_ACU_Identity || ''; break; }
                }
                // 合并所有表
                const tables = {}, visited = {};
                let targetMsgId;
                for (let i = chat.length - 1; i >= 0; i--) {
                    const isoData = chat[i].TavernDB_ACU_IsolatedData?.[isoKey];
                    if (isoData?.independentData) {
                        Object.keys(isoData.independentData).forEach(k => {
                            if (!visited[k]) {
                                tables[k] = JSON.parse(JSON.stringify(isoData.independentData[k]));
                                visited[k] = true;
                                if (!targetMsgId) targetMsgId = chat[i].id;
                            }
                        });
                    }
                    if (chat[i].TavernDB_ACU_IndependentData && (chat[i].TavernDB_ACU_Identity || '') === isoKey) {
                        Object.keys(chat[i].TavernDB_ACU_IndependentData).forEach(k => {
                            if (!visited[k]) {
                                tables[k] = JSON.parse(JSON.stringify(chat[i].TavernDB_ACU_IndependentData[k]));
                                visited[k] = true;
                                if (!targetMsgId) targetMsgId = chat[i].id;
                            }
                        });
                    }
                }
                if (Object.keys(tables).length === 0) {
                    client?.send({ type: 'sync_variables', data: { variableType: 'apotheosis', content: { error: '无数据库变量' }, targetUserId: userId } });
                    return;
                }
                // 广播全量同步（所有客户端受益）
                client?.broadcast({ type: 'acu_full_sync', data: { isolationKey: isoKey, tables, targetMessageId: targetMsgId } });
                store.acuSyncState.fullSynced = true;
            } else {
                client?.send({ type: 'sync_variables', data: { variableType: 'unknown', content: { error: `未知变量模式: ${reqMode}` }, targetUserId: userId } });
            }
        } catch (e) {
            store.addLog('error', '系统', `变量同步失败: ${e.message}`);
            console.error('[联机Mod] 变量同步失败:', e);
        }
    });

    // ---- 客户端：接收变量同步数据 ----
    onEventTracked('multiplayer_sync_variables', async (payload) => {
        if (store.isHost) return;

        const variableType = payload?.variableType;
        const content = payload?.content;

        try {
            if (!content || content?.error) {
                return;
            }

            if (variableType === 'mvu') {
                const msgId = getLastMessageId();
                if (msgId >= 0) {
                    await updateVariablesWith(v => {
                        if (content.stat_data) v.stat_data = content.stat_data;
                        if (content.display_data) v.display_data = content.display_data;
                        if (content.delta_data) v.delta_data = content.delta_data;
                        if (content.schema) v.schema = content.schema;
                        return v;
                    }, { type: 'message', message_id: msgId });
                }
            }
        } catch (e) {
            store.addLog('error', '系统', `变量同步失败: ${e.message}`);
            console.error('[联机Mod] 变量同步失败:', e);
        }
    });
};


// ==========================================
