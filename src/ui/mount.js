// 9. 挂载与初始化 
// ==========================================
let _app = null; // 模块级变量，用于 unload 时 unmount
let _unloadHandler = null; // 防重复绑定 unload

// JS-Slash-Runner iframe 中 DOM 可能已 ready，用兼容写法确保执行
const bootstrap = () => {
    const CONTAINER_ID = 'st-multiplayer-container-v2';
    const targetDoc = parentWindow.document;

    // 二次防抖清理：先清掉残留事件监听（热重载/重复执行时避免叠加）
    offAllTrackedEvents();

    // 若旧容器存在，先尝试卸载旧 app 再移除容器
    const existed = targetDoc.getElementById(CONTAINER_ID);
    if (existed) {
        try { _app?.unmount(); } catch (e) {}
        existed.remove();
    }

    // 注入样式
    injectStyles();

    // 创建挂载点 — 面板需要挂到父窗口的 body 上才能在酒馆主界面可见
    const container = targetDoc.createElement('div');
    container.id = CONTAINER_ID;
    targetDoc.body.appendChild(container);

    const pinia = createPinia();
    _app = createApp(MultiplayerPanel);
    _app.use(pinia);
    _app.mount(container);

    const store = useMultiplayerStore();
    initSTHooks(store);
    initACUSync(store);
    initSpoilerEngine();

    if (_unloadHandler) {
        window.removeEventListener('unload', _unloadHandler);
    }

    _unloadHandler = () => {
        try {
            const s = useMultiplayerStore();
            if (s.isConnected) s.getClient()?.disconnect();
        } catch (e) {}

        offAllTrackedEvents();

        try { _app?.unmount(); } catch (e) {}

        const doc = (parentWindow.document || document);

        const old = doc.getElementById(CONTAINER_ID);
        if (old) old.remove();

        const oldStyle = doc.getElementById(STYLE_ID);
        if (oldStyle) oldStyle.remove();
    };

    window.addEventListener('unload', _unloadHandler);
    const toastr = parentWindow.toastr || window.toastr;
    toastr?.success('联机工具 已加载完毕！', '');
};

// 兼容 jQuery 存在/不存在两种情况
if ($ && typeof $ === 'function') {
    $(bootstrap);
} else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}
