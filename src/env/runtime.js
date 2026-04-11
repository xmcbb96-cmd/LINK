// JS-Slash-Runner 的 srcdoc iframe 内没有全局 Vue/jQuery，必须从父窗口获取
const parentWindow = (() => {
    try { return window.top || window.parent || window; } catch (e) { return window; }
})();
const o = parentWindow.Vue || window.Vue;
if (!o) {
    console.error('[联机Mod] 无法获取 Vue 实例，脚本终止');
    throw new Error('Vue not found');
}
const $ = parentWindow.jQuery || window.jQuery;
const { ref, reactive, computed, watch, shallowRef, triggerRef, onMounted, onUnmounted, nextTick, defineComponent, createApp } = o;
