// 5. 数据库 
// ==========================================
const initACUSync = (store) => {
    const getWin = () => window.top || window.parent || window;
    const ACU_REGISTER_GUARD_KEY = '__st_multiplayer_acu_callback_registered_v1__';

    let retry = 0;

    const register = () => {
        const win = getWin();

        if (!win.AutoCardUpdaterAPI?.registerTableUpdateCallback) {
            if (++retry < 20) setTimeout(register, 3000); // 轮询等待 ACU 加载
            return;
        }

        // 防止热重载重复注册回调
        if (win[ACU_REGISTER_GUARD_KEY]) {
            return;
        }

        let debounceTimer;
        win.AutoCardUpdaterAPI.registerTableUpdateCallback(() => {
            if (store.isConnected && store.isHost) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const data = extractACUData(); // 提取 ACU 隔离数据
                    if (data) {
                        store.getClient()?.broadcast({
                            type: store.acuSyncState.fullSynced ? 'acu_delta_sync' : 'acu_full_sync',
                            data
                        });
                    }
                }, 3000);
            }
        });

        win[ACU_REGISTER_GUARD_KEY] = true;
    };

    const extractACUData = () => {
        const chat = getWin().SillyTavern?.getContext?.()?.chat;
        if (!chat || chat.length === 0) return null;

        let isoKey = '';
        const tables = {};

        for (let i = chat.length - 1; i >= 0; i--) {
            if (chat[i].TavernDB_ACU_IsolatedData) {
                isoKey = Object.keys(chat[i].TavernDB_ACU_IsolatedData)[0];
                break;
            }
        }

        if (!isoKey) return null;

        for (let i = chat.length - 1; i >= 0; i--) {
            const isoData = chat[i].TavernDB_ACU_IsolatedData?.[isoKey];
            if (isoData?.independentData) {
                Object.assign(tables, JSON.parse(JSON.stringify(isoData.independentData))); // 深拷贝表单数据
            }
        }

        return { isolationKey: isoKey, tables, modifiedKeys: Object.keys(tables) };
    };

    onEventTracked('multiplayer_acu_full_sync', async (payload) => {
        if (store.isHost) return;
        if (!getWin().AutoCardUpdaterAPI?.importTableAsJson) return;

        const tables = payload?.tables;
        if (!tables || typeof tables !== 'object') return;

        const format = { mate: { type: 'chatSheets', version: 1 } };
        Object.keys(tables).forEach(k => {
            if (k.startsWith('sheet_')) {
                format[k] = tables[k];
            }
        });

        await getWin().AutoCardUpdaterAPI.importTableAsJson(JSON.stringify(format)); // 调用 ACU 官方接口导入全量数据
    });

    register();
};

// ==========================================
