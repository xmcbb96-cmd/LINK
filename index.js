import 'https://testingcf.jsdelivr.net/npm/@vueuse/core/+esm'; // 引入外部依赖
import { createPinia, defineStore } from 'https://testingcf.jsdelivr.net/npm/pinia/+esm'; // 引入 Pinia

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

const _trackedEventOffs = [];
let _eventOffMissingWarned = false;

const onEventTracked = (eventName, handler) => {
    const eventOnFn =
        (typeof eventOn === 'function' && eventOn) ||
        (typeof parentWindow.eventOn === 'function' && parentWindow.eventOn) ||
        null;

    const eventOffFn =
        (typeof eventOff === 'function' && eventOff) ||
        (typeof parentWindow.eventOff === 'function' && parentWindow.eventOff) ||
        null;

    if (!eventOnFn) {
        console.error('[联机Mod] eventOn 不可用，事件未注册:', eventName);
        return;
    }

    let off = null;

    try {
        const ret = eventOnFn(eventName, handler);
        if (typeof ret === 'function') {
            off = ret;
        }
    } catch (e) {
        console.error('[联机Mod] 事件注册失败:', eventName, e);
        return;
    }

    if (!off && eventOffFn) {
        off = () => {
            try { eventOffFn(eventName, handler); } catch (e) {}
        };
    }

    if (off) {
        _trackedEventOffs.push(off);
    } else if (!_eventOffMissingWarned) {
        _eventOffMissingWarned = true;
        console.info('[联机Mod] 当前环境未提供可追踪 eventOff；事件可用，但热重载时将依赖页面卸载清理。');
    }
};

const offAllTrackedEvents = () => {
    while (_trackedEventOffs.length > 0) {
        const off = _trackedEventOffs.pop();
        try { off?.(); } catch (e) {}
    }
};

// ==========================================
// 1. 样式注入 (CSS)
// ==========================================
const injectStyles = () => {
    const targetDoc = parentWindow.document;
    // 防止重复注入
    if (targetDoc.getElementById('multiplayer-mod-styles')) return;
    const style = targetDoc.createElement('style');
    style.id = 'multiplayer-mod-styles';
    style.innerHTML = `

/* ============================
   主容器 - 悬浮面板
   ============================ */

/* 面板主体：固定定位，毛玻璃背景，圆角阴影 */
.multiplayer-panel {
    position: fixed;
    width: 320px;
    min-height: 44px;
    max-height: calc(100vh - 40px);
    background: var(--SmartThemeBlurTintColor, rgba(30, 30, 45, 0.98));
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.5);
    backdrop-filter: var(--SmartThemeBlur, blur(12px));
    z-index: 99999;
    font-family: inherit;
    font-size: 13px;
    color: var(--SmartThemeFontColor, inherit) !important;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: all 0.3s ease;
}

/* 最小化状态：收缩为仅显示标题栏 */
.multiplayer-panel.minimized {
    width: fit-content;
    min-width: 175px;
    max-height: 44px;
}

/* 最小化时标题栏内边距微调 */
.multiplayer-panel.minimized .panel-header {
    padding: 10px 14px;
}

/* 拖拽中状态：半透明 + 抓取光标 */
.multiplayer-panel.dragging {
    opacity: 0.9;
    cursor: grabbing;
}

/* ============================
   头部栏 - 标题 + 操作按钮
   ============================ */

/* 头部容器：靛蓝半透背景，可拖拽 */
.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    background: rgba(99, 102, 241, 0.3);
    cursor: grab;
    -webkit-user-select: none;
    user-select: none;
    position: relative;
    touch-action: none;
}

/* 头部左侧：状态灯 + 标题文字 */
.header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
}

/* 标题文字：加粗，溢出省略 */
.title {
    font-weight: 600;
    font-size: 14px;
    color: var(--SmartThemeFontColor, inherit);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    height: 24px;
}

/* ============================
   状态指示灯
   ============================ */

/* 默认状态：灰色圆点 */
.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #666;
}

/* 已连接：绿色 + 发光 */
.status-dot.connected {
    background: #4ade80;
    box-shadow: 0 0 8px #4ade80;
}

/* 连接中：黄色 + 慢闪 */
.status-dot.connecting {
    background: #facc15;
    animation: pulse 1s infinite;
}

/* .status-dot.unstable 已下线（当前状态机未使用） */

/* 已断开：灰色（与默认一致） */
.status-dot.disconnected {
    background: #666;
}

/* 呼吸灯动画 */
@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

/* ============================
   头部操作按钮
   ============================ */

/* 按钮组容器 */
.header-actions {
    display: flex;
    gap: 4px;
    align-items: center;
}

/* 图标按钮：24px 正方形，圆角，居中图标 */
.icon-btn {
    width: 24px;
    height: 24px;
    border: none;
    background: var(--SmartThemeChatColor, rgba(128, 128, 128, 0.15));
    color: var(--SmartThemeFontColor, inherit);
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    transition: background 0.2s;
    margin: 0;
    flex-shrink: 0;
}

/* 图标按钮悬停：靛蓝高亮 */
.icon-btn:hover {
    background: rgba(99, 102, 241, 0.3);
}

/* 危险操作按钮悬停：红色高亮 */
.icon-btn.danger-icon:hover {
    background: rgba(255, 59, 48, 0.3);
    color: #ff3b30;
}

/* ============================
   内容区 - 主体滚动区域
   ============================ */

/* 内容容器：弹性纵向布局，可滚动 */
.panel-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 10px;
    gap: 8px;
    overflow-y: auto;
    overflow-x: hidden;
}

/* ============================
   设置区域 - 未连接时的配置表单
   ============================ */

/* 设置区块容器 */
.settings-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

/* 用户名区块：小标题 + 输入框，底部长条分隔 */
.username-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* 单行设置：标签 + 输入框水平排列 */
.setting-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 34px;
}

/* 设置标签：固定最小宽度，垂直居中对齐 */
.setting-row label {
    min-width: 70px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    color: var(--SmartThemeFontColor, inherit);
    font-size: 12px;
    line-height: 1;
}

/* ============================
   输入框
   ============================ */

/* 统一输入控件样式：主页与设置完全一致（边框/底色/字体/内边距） */
.multiplayer-panel .input-field,
.multiplayer-panel .settings-input,
.multiplayer-panel .chat-input,
.multiplayer-panel .input-textarea {
    box-sizing: border-box;
    border: 1px solid rgba(99, 102, 241, 0.3) !important;
    border-radius: 8px !important;
    background: var(--SmartThemeChatColor, rgba(128, 128, 128, 0.15)) !important;
    color: var(--SmartThemeFontColor, inherit) !important;
    -webkit-text-fill-color: var(--SmartThemeFontColor, inherit) !important;
    font-family: inherit;
    font-size: 13px;
    line-height: 1.2;
    padding: 8px 12px;
    outline: none;
    box-shadow: none !important;
    transition: border-color 0.2s, background 0.2s;
}

/* 各控件尺寸保留 */
.multiplayer-panel .input-field,
.multiplayer-panel .settings-input,
.multiplayer-panel .chat-input {
    height: 34px;
}

/* 输入框本体布局属性 */
.multiplayer-panel .input-field {
    flex: 1;
}

/* 聚焦态统一 */
.multiplayer-panel .input-field:focus,
.multiplayer-panel .settings-input:focus,
.multiplayer-panel .chat-input:focus,
.multiplayer-panel .input-textarea:focus {
    border-color: rgba(99, 102, 241, 0.6) !important;
    background: rgba(99, 102, 241, 0.15) !important;
}

/* 占位符颜色统一为与输入文字同色，不再偏灰 */
.multiplayer-panel .input-field::placeholder,
.multiplayer-panel .settings-input::placeholder,
.multiplayer-panel .chat-input::placeholder,
.multiplayer-panel .input-textarea::placeholder {
    color: var(--SmartThemeFontColor, inherit) !important;
    opacity: 1 !important;
}

/* 兼容浏览器自动填充导致的白底/黄底 */
.multiplayer-panel .input-field:-webkit-autofill,
.multiplayer-panel .input-field:-webkit-autofill:hover,
.multiplayer-panel .input-field:-webkit-autofill:focus {
    -webkit-text-fill-color: var(--SmartThemeFontColor, inherit) !important;
    -webkit-box-shadow: 0 0 0 1000px rgba(20, 20, 30, 0.9) inset !important;
    box-shadow: 0 0 0 1000px rgba(20, 20, 30, 0.9) inset !important;
    transition: background-color 9999s ease-out 0s;
}

/* 中尺寸输入框（密码等） */
.input-field.medium {
    min-width: 130px;
    max-width: 170px;
}

/* 小尺寸输入框（端口号等） */
.input-field.small {
    max-width: 80px;
}

/* 超小尺寸输入框（人数等） */
.input-field.tiny {
    max-width: 60px;
}

/* ============================
   在线房间区域
   ============================ */

/* 房间列表区块 */
.online-rooms-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 8px;
}

/* 区块头部：标题 + 刷新按钮 */
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* 刷新按钮 */
.refresh-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: var(--SmartThemeChatColor, rgba(128, 128, 128, 0.15)) !important;
    color: var(--SmartThemeFontColor, inherit) !important;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
}

/* 刷新按钮悬停 */
.refresh-btn:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.3);
}

/* 刷新按钮禁用 */
.refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* ============================
   房间列表
   ============================ */

/* 房间列表容器：限高可滚动 */
.room-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 150px;
    overflow-y: auto;
}

/* 单个房间卡片 */
.room-item {
    padding: 8px 10px;
    background: var(--SmartThemeChatColor, rgba(128, 128, 128, 0.15));
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

/* 房间卡片悬停 */
.room-item:hover {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.6);
}

/* 房间卡片选中 */
.room-item.selected {
    background: rgba(99, 102, 241, 0.3);
    border-color: rgba(99, 102, 241, 0.8);
}

/* 房间信息行：名称 + 锁图标 */
.room-info {
    display: flex;
    align-items: center;
    gap: 6px;
}

/* 房间名称 */
.room-name {
    font-weight: 500;
    color: var(--SmartThemeFontColor, inherit);
}

/* 房间锁图标 */
.room-lock {
    font-size: 12px;
}

/* 房间元信息：人数、创建者 */
.room-meta {
    display: flex;
    gap: 8px;
    font-size: 9px;
    color: var(--SmartThemeFontColor, inherit);
    opacity: 0.8;
    margin-top: 4px;
}

/* 空房间提示 */
.empty-rooms {
    padding: 16px;
    text-align: center;
    color: var(--SmartThemeFontColor, inherit);
    opacity: 0.8;
    font-size: 12px;
    background: var(--SmartThemeChatColor, rgba(128, 128, 128, 0.15));
    border-radius: 8px;
}

/* 加入房间区域：密码框 + 按钮 */
.join-room-section {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 56px 56px;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
}

.join-room-section .input-field {
    min-width: 0;
    max-width: 100%;
}

.join-room-section .action-btn {
    height: 34px;
    min-width: 56px;
    padding: 0 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    white-space: nowrap;
    word-break: keep-all;
    writing-mode: horizontal-tb;
    text-orientation: mixed;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.2px;
}

.join-room-section .join-btn-icon.fa-solid {
    font-size: 12px;
    line-height: 1;
}

.join-room-section .join-btn-label {
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}

/* ============================
   创建房间区域
   ============================ */

/* 创建房间区块：顶部分割线 */
.create-room-section {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    gap: 8px;
}

/* 创建选项行：密码 + 人数并排 */
.create-room-options {
    display: flex;
    gap: 8px;
}

/* ============================
   分割线与复选框
   ============================ */

/* 设置分割线 */
.settings-divider {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin: 8px 0;
}

/* ============================
   按钮组
   ============================ */

/* 按钮组容器 */
.button-group {
    display: flex;
    gap: 8px;
    margin-top: 4px;
}

/* 通用操作按钮 */
.action-btn {
    flex: 1;
    padding: 5px 10px;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

/* 主要按钮：靛蓝背景 + 文字阴影 */
.action-btn.primary {
    background: rgba(99, 102, 241, 0.6);
    border: 1px solid rgba(99, 102, 241, 0.8);
    color: var(--SmartThemeFontColor, #fff);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

/* 主要按钮悬停：加深 + 微上浮 */
.action-btn.primary:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.8);
    transform: translateY(-1px);
}

/* 次要按钮：透明背景 + 靛蓝边框 */
.action-btn.secondary {
    background: var(--SmartThemeChatColor, rgba(128, 128, 128, 0.15));
    color: var(--SmartThemeFontColor, inherit);
    border: 1px solid rgba(99, 102, 241, 0.4);
}

/* 次要按钮悬停 */
.action-btn.secondary:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.3);
}

/* 危险按钮：红色系 */
.action-btn.danger {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
}

/* 危险按钮悬停 */
.action-btn.danger:hover {
    background: rgba(239, 68, 68, 0.3);
}

/* 按钮禁用状态 */
.action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* ============================
   用户列表区域
   ============================ */

/* 用户列表容器：不允许收缩 */
.user-list {
    flex-shrink: 0;
}

/* 区块标题：小号灰色大写字母 */
.section-title {
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
}

/* 用户标签容器：自动换行 */
.user-items {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

/* 胶囊基础规格（观众通过复用 user-item 获得完全一致结构） */
.user-item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 88px;
    min-height: 28px;
    max-width: 100%;
    box-sizing: border-box;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    line-height: 1;
    white-space: nowrap;
}

/* 玩家默认配色 */
.user-item {
    background: var(--SmartThemeChatColor, rgba(128, 128, 128, 0.15));
    border: 1px solid var(--SmartThemeBorderColor, rgba(128, 128, 128, 0.3));
}

/* 房主标签：金色边框 + 背景 */
.user-item.host {
    background: rgba(251, 191, 36, 0.15);
    border: 1px solid rgba(251, 191, 36, 0.8);
}

/* 已提交输入状态：绿色系 */
.user-item.submitted {
    background: rgba(74, 222, 128, 0.15);
    border-color: rgba(74, 222, 128, 0.6);
}

/* 用户头像：圆形渐变背景 */
.user-avatar {
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 600;
    color: #fff;
}

/* 已提交用户头像：绿色渐变覆盖 */
.user-avatar.avatar-submitted {
    background: linear-gradient(135deg, #22c55e, #16a34a);
}

/* 用户名文字 */
.user-name {
    color: var(--SmartThemeFontColor, inherit);
}

/* 房主皇冠图标 */
.host-crown {
    font-size: 12px;
}

/* 房主徽章文字 */
.host-badge {
    font-size: 10px;
    color: #fbbf24;
    margin-left: 8px;
}

/* 全部已提交提示 */
.all-submitted {
    color: #4ade80;
    font-size: 10px;
    margin-left: 8px;
}

/* ============================
   同步按钮行
   ============================ */

/* 同步按钮容器：自动换行 */
.sync-buttons-row {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    margin-bottom: 2px;
}

/* 同步历史按钮：靛蓝半透明风格 */
.sync-history-btn {
    padding: 3px 7px;
    border: 1px solid rgba(99, 102, 241, 0.5);
    background: rgba(99, 102, 241, 0.2);
    color: var(--SmartThemeFontColor, inherit);
    border-radius: 4px;
    font-size: 11px;
    font-weight: normal !important;
    font-family: "Font Awesome 6 Free", "SimHei", "Heiti SC", sans-serif !important;
    cursor: pointer;
    transition: all 0.2s;
}

/* 同步按钮悬停 */
.sync-history-btn:hover {
    background: rgba(99, 102, 241, 0.4);
    border-color: rgba(99, 102, 241, 0.8);
}

/* 转让房主按钮：小圆形 */
.transfer-btn {
    width: 18px;
    height: 18px;
    padding: 0;
    margin-left: auto;
    border: none;
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
    border-radius: 50%;
    cursor: pointer;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
}

/* 转让按钮悬停 */
.transfer-btn:hover {
    background: rgba(100, 100, 255, 0.4);
}

/* 观众列表区域 */
.spectator-list {
    flex-shrink: 0;
    margin-top: 2px;
}

.spectator-items {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: stretch;
    gap: 6px;
}

.user-item.spectator-item {
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.45);
}

.user-item.spectator-item .user-avatar {
    background: linear-gradient(135deg, #0ea5e9, #38bdf8);
}

/* ============================
   聊天日志区域
   ============================ */

/* 日志容器：限高可滚动，自定义滚动条 */
.chat-logs {
    flex: 1;
    min-height: 80px;
    max-height: 120px;
    overflow-y: auto;
    padding: 6px;
    background: var(--SmartThemeChatColor, rgba(128, 128, 128, 0.15)) !important;
    /* 兜底叠层：在浅色主题下也保证有一点对比度 */
    box-shadow: inset 0 0 0 9999px rgba(20, 20, 30, 0.08);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 8px;
    scrollbar-width: thin;
    scrollbar-color: rgba(99, 102, 241, 0.5) transparent !important;
}

/* Webkit 滚动条宽度（聊天日志 / 设置弹窗共用） */
.chat-logs::-webkit-scrollbar,
.settings-modal-body::-webkit-scrollbar {
    width: 6px;
}

/* Webkit 滚动条轨道：透明 */
.chat-logs::-webkit-scrollbar-track {
    background: transparent;
}

/* Webkit 滚动条滑块：靛蓝圆角 */
.chat-logs::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.5);
    border-radius: 3px;
}

/* 单条日志：允许长单词换行 */
.log-item {
    padding: 4px 0;
    line-height: 1.4;
    word-break: break-word;
    color: var(--SmartThemeFontColor, #e0e0e0);
}

/* 系统消息：半透明小字 */
.log-item.system {
    color: var(--SmartThemeFontColor, #888);
    opacity: 0.8;
    font-size: 11px;
}

/* 聊天消息 */
.log-item.chat {
    /* 优先正文色，避免浅色主题下字体过亮 */
    color: var(--SmartThemeBodyColor, var(--SmartThemeEmColor, #1f2937)) !important;
}

/* 错误消息：红色 */
.log-item.error {
    color: #f87171;
}

/* AI 消息：紫色，适配酒馆 Bot 颜色变量 */
.log-item.ai {
    color: var(--SmartThemeBotColor, #a78bfa);
}

/* 日志时间戳 */
.log-time {
    color: var(--SmartThemeFontColor, #888);
    font-size: 10px;
    margin-right: 6px;
}

/* 日志发送者名称 */
.log-from {
    font-weight: 500;
    margin-right: 4px;
}

/* 日志正文内容 */
.log-content {
    color: inherit;
}

.log-item.chat .log-from,
.log-item.chat .log-content {
    color: inherit !important;
    opacity: 1;
    font-weight: 500;
}

/* 空日志占位提示 */
.empty-logs {
    text-align: center;
    color: var(--SmartThemeFontColor, #888);
    padding: 20px;
    font-size: 12px;
}

/* ============================
   聊天输入区
   ============================ */

/* 输入区容器：输入框 + 发送按钮水平排列 */
.chat-input-area {
    display: flex;
    gap: 8px;
}

/* 聊天输入框：仅保留布局，视觉走统一输入样式 */
.chat-input {
    flex: 1;
}

/* 发送按钮：靛蓝背景 + 文字阴影 */
.send-btn {
    padding: 8px 12px;
    background: rgba(99, 102, 241, 0.6);
    border: 1px solid rgba(99, 102, 241, 0.8);
    border-radius: 8px;
    color: var(--SmartThemeFontColor, #fff);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

/* 发送按钮悬停 */
.send-btn:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.8);
}

/* 发送按钮禁用 */
.send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* 小号发送按钮（图标按钮用） */
.send-btn.small {
    font-size: 14px;
}

/* ============================
   输入提交区 & 房主控制区
   ============================ */

/* 输入提交区 */
.input-submit-area {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px;
    background: var(--SmartThemeChatColor, rgba(128, 128, 128, 0.15));
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 8px;
}

/* 多行输入框：保留结构行为，视觉走统一输入样式 */
.input-textarea {
    width: 100%;
    resize: vertical;
    min-height: 60px;
}

/* 待处理输入列表容器：暗色背景，限高可滚动 */
.pending-inputs {
    max-height: 100px;
    overflow-y: auto;
    padding: 8px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
}

/* 单条待处理输入：底部细分割线 */
.pending-input-item {
    padding: 4px 0;
    font-size: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

/* 最后一条待处理输入：去掉底部分割线 */
.pending-input-item:last-child {
    border-bottom: none;
}

/* 输入者用户名：紫色加粗 */
.input-user {
    color: #a78bfa;
    font-weight: 500;
    margin-right: 6px;
}

/* 输入内容文字 */
.input-content {
    color: #ccc;
}

/* 空输入占位提示 */
.empty-inputs {
    text-align: center;
    color: #555;
    font-size: 12px;
    padding: 12px;
}

/* ============================
   设置弹窗
   ============================ */

/* 弹窗遮罩层：覆盖整个面板（含标题栏），居中内容 */
.settings-modal {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    border-radius: 16px;
}

/* 弹窗内容容器：不透明背景完全遮盖下层 */
.settings-modal-content {
    background: var(--SmartThemeBlurTintColor, rgba(30, 30, 45, 0.98)) !important;
    backdrop-filter: var(--SmartThemeBlur, blur(12px));
    border-radius: 16px;
    border: 1px solid rgba(99, 102, 241, 0.5) !important;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* 弹窗头部：靛蓝背景 + 底部分割线 */
.settings-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: rgba(99, 102, 241, 0.3);
    border-bottom: 1px solid rgba(99, 102, 241, 0.5);
    font-weight: 600;
    color: var(--SmartThemeFontColor, inherit);
}

/* 弹窗主体：可滚动，自定义滚动条 */
.settings-modal-body {
    padding: 16px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(99, 102, 241, 0.5) transparent !important;
}

/* Webkit 滚动条轨道：透明 */
.settings-modal-body::-webkit-scrollbar-track {
    background: transparent !important;
}

/* Webkit 滚动条滑块：靛蓝圆角 */
.settings-modal-body::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.5) !important;
    border-radius: 3px;
}

/* 单个设置项：块级显示 */
.setting-item {
    display: block;
    font-size: 12px;
    color: var(--SmartThemeFontColor, inherit) !important;
}

/* 通用标题与输入间距（参考“消息前缀”） */
.settings-modal-body .setting-item > label {
    display: block;
    margin-bottom: 6px;
    line-height: 1.2;
}

/* 保持输入框独占一行，和标题形成稳定间距 */
.settings-modal-body .setting-item > .settings-input {
    display: block;
}

/* 数字类型设置输入框：强制背景色 */
input[type="number"].settings-input {
    background: var(--SmartThemeChatColor, rgba(128, 128, 128, 0.15)) !important;
}

/* 设置输入框：保留结构属性，其余视觉由统一输入样式接管 */
.settings-input {
    width: 100%;
    -webkit-appearance: none;
    appearance: none;
}

/* 设置输入框聚焦：保持与统一输入样式一致（不额外加外发光） */
.settings-input:focus {
    box-shadow: none !important;
}

/* 下拉选项样式：适配暗色主题 */
.settings-input option {
    background: var(--SmartThemeBlurTintColor, #1e1e2e);
    color: var(--SmartThemeFontColor, inherit);
}

/* 提示文字：小号半透明 */
.hint {
    display: block;
    font-size: 10px;
    color: var(--SmartThemeFontColor, inherit);
    opacity: 0.6;
    margin-top: 4px;
}

/* 预览框：灰色背景圆角卡片 */
.preview-box {
    background: var(--SmartThemeChatColor, rgba(128, 128, 128, 0.15));
    border-radius: 6px;
    padding: 10px;
    margin-top: 8px;
}

/* 预览标签 */
.preview-label {
    font-size: 11px;
    color: var(--SmartThemeFontColor, inherit);
    opacity: 0.8;
    margin-right: 8px;
}

/* 预览文字：斜体 */
.preview-text {
    font-size: 12px;
    color: var(--SmartThemeFontColor, inherit);
    font-style: italic;
}

/* ============================
   开关组件
   ============================ */

/* 开关设置项：底部间距 */
.toggle-item {
    margin-bottom: 16px;
}

/* 开关标签：水平排列，可点击 */
.toggle-label {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 12px;
    color: var(--SmartThemeFontColor, inherit);
}

/* 开关轨道：圆角矩形，灰色默认 */
.toggle-switch {
    display: inline-block;
    position: relative;
    width: 40px;
    height: 20px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    transition: background 0.3s;
}

/* 开关滑块：白色圆形，绝对定位 */
.toggle-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.3s;
}

/* 选中状态：轨道变绿（active class 写法） */
.toggle-switch.active {
    background: #4ade80 !important;
}

/* 选中状态：滑块右移（active class 写法） */
.toggle-switch.active::after {
    transform: translateX(20px) !important;
}

/* ============================
   隐藏内容
   ============================ */

/* 隐藏内容文字：灰色斜体，用于"已提交"等脱敏显示 */
.hidden-content {
    color: #888;
    font-style: italic;
}

/* ============================
   剧透遮罩（Spoiler）
   ============================ */

/* 遮罩默认状态：灰色背景遮住文字，文字透明不可见 */
.mp-spoiler {
    background-color: #4a4a4a;
    color: transparent;
    cursor: pointer;
    border-radius: 3px;
    padding: 0 4px;
    transition: all 0.2s ease;
    user-select: none;
}

/* 遮罩悬停：背景微亮，提示可点击 */
.mp-spoiler:hover {
    background-color: #5a5a5a;
}

/* 遮罩已揭示：背景透明，文字恢复，可选中 */
.mp-spoiler.revealed {
    background-color: transparent;
    color: inherit;
    cursor: text;
    user-select: auto;
}

    `;
    targetDoc.head.appendChild(style);
};


// ==========================================
// 2. 大厅 API 服务 (RoomApiService)
// ==========================================
const requestWithTimeout = async (url, options = {}, timeoutMs = 8000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            cache: 'no-store'
        });
        return response;
    } catch (e) {
        if (e?.name === 'AbortError') {
            throw new Error('请求超时，请检查网络或稍后重试');
        }
        throw e;
    } finally {
        clearTimeout(timer);
    }
};

const RoomApiService = {
    async fetchRooms(baseUrl) {
        const response = await requestWithTimeout(`${baseUrl}/rooms`, {}, 8000);
        if (!response.ok) throw new Error('获取房间列表失败');
        return (await response.json()).rooms || [];
    },
    async createRoom(baseUrl, params) {
        const response = await requestWithTimeout(`${baseUrl}/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        }, 8000);

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '创建房间失败');
        return data;
    },
    async verifyAndJoin(baseUrl, roomId, password) {
        const response = await requestWithTimeout(`${baseUrl}/rooms/${roomId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        }, 8000);

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '加入房间失败');
        return `${baseUrl.replace('http', 'ws')}/ws/room/${roomId}`;
    }
};

// ==========================================
// 3. 网络通信模块 (WebSocket & LocalChannel)
// ==========================================
const generateId = () => Math.random().toString(36).substring(2, 10); // 生成随机用户ID

class WebSocketClient {
    constructor() {
        this.ws = null;
        this.userId = generateId();
        this.userName = '';
        this.isConnected = false;
        this.isHost = false;
        this.isSpectator = false;
        this.handlers = {};

        this.heartbeatTimer = null;
        this.pendingPong = false;
        this.missedPongs = 0;

        this.HEARTBEAT_INTERVAL = 5000;
        this.MAX_MISSED_PONGS = 8;
        this.CONNECT_TIMEOUT_MS = 10000;
    }

    init(handlers) {
        this.handlers = handlers;
    }

    async connect(url, password) {
        return new Promise((resolve, reject) => {
            let settled = false;
            let connectTimer = null;

            const safeReject = (err) => {
                if (settled) return;
                settled = true;
                clearTimeout(connectTimer);
                reject(err);
            };

            const safeResolve = () => {
                if (settled) return;
                settled = true;
                clearTimeout(connectTimer);
                resolve();
            };

            try {
                this.ws = new WebSocket(url);

                connectTimer = setTimeout(() => {
                    this.handlers.onError?.('连接超时，请重试');
                    try { this.ws?.close(); } catch (e) {}
                    safeReject(new Error('连接超时'));
                }, this.CONNECT_TIMEOUT_MS);

                this.ws.onopen = () => {
                    this.isConnected = true;
                    this.missedPongs = 0;
                    this.pendingPong = false;

                    this.startHeartbeat();
                    this.send({
                        type: 'join',
                        data: {
                            name: this.userName,
                            password,
                            spectator: !!this.isSpectator
                        }
                    });
                    this.handlers.onConnectionChange?.(true);

                    safeResolve();
                };

                this.ws.onclose = () => {
                    this.stopHeartbeat();
                    this.isConnected = false;
                    this.handlers.onConnectionChange?.(false);

                    if (!settled) {
                        safeReject(new Error('连接已关闭'));
                    }
                };

                this.ws.onerror = (e) => {
                    this.handlers.onError?.('WebSocket错误');
                    safeReject(e instanceof Error ? e : new Error('WebSocket错误'));
                };

                this.ws.onmessage = (e) => {
                    // 收到任意消息都说明链路可用，降低误判断线
                    this.pendingPong = false;
                    this.missedPongs = 0;

                    let msg = null;
                    try {
                        msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
                    } catch (err) {
                        console.warn('[联机Mod] 收到非 JSON 消息，已忽略:', e.data);
                        return;
                    }

                    if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') {
                        console.warn('[联机Mod] 收到非法消息结构，已忽略:', msg);
                        return;
                    }

                    switch (msg.type) {
                        case 'pong':
                            break;
                        case 'error':
                            if (msg.data?.targetId === this.userId) {
                                this.handlers.onError?.(msg.data.message);
                            }
                            break;
                        case 'join': {
                            const d = msg.data || {};
                            const hasSpectatorFlag =
                                Object.prototype.hasOwnProperty.call(d, 'spectator') ||
                                Object.prototype.hasOwnProperty.call(d, 'isSpectator') ||
                                Object.prototype.hasOwnProperty.call(d, 'observer') ||
                                Object.prototype.hasOwnProperty.call(d, 'is_observer') ||
                                Object.prototype.hasOwnProperty.call(d, 'role');

                            const parsedSpectator =
                                d.spectator ??
                                d.isSpectator ??
                                d.observer ??
                                d.is_observer ??
                                (d.role === 'spectator' || d.role === 'observer');

                            const joinUser = {
                                id: msg.from,
                                name: msg.fromName,
                                isHost: false
                            };

                            if (hasSpectatorFlag) {
                                joinUser.isSpectator = !!parsedSpectator;
                            }

                            this.handlers.onUserJoin?.(joinUser);
                            break;
                        }
                        case 'leave':
                            this.handlers.onUserLeave?.(msg.from);
                            break;
                        case 'sync_state':
                            if (msg.data?.users) {
                                msg.data.users.forEach(u => this.handlers.onUserJoin?.(u));
                            }
                            break;
                        case 'host_change':
                            this.handlers.onMessage?.(msg);
                            break;
                        default:
                            this.handlers.onMessage?.(msg);
                    }
                };
            } catch (e) {
                safeReject(e);
            }
        });
    }

    send(payload) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                ...payload,
                from: this.userId,
                fromName: this.userName,
                timestamp: Date.now()
            }));
        }
    }

    broadcast(payload) {
        this.send(payload);
    }

    startHeartbeat() {
        this.stopHeartbeat();
        this.pendingPong = false;

        this.heartbeatTimer = setInterval(() => {
            if (!this.isConnected) return;

            if (this.pendingPong) {
                this.missedPongs++;
                if (this.missedPongs >= this.MAX_MISSED_PONGS) {
                    this.handlers.onError?.('网络不稳定，连接已断开');
                    this.ws?.close();
                    return;
                }
            }

            this.pendingPong = true;
            this.send({ type: 'ping', data: { timestamp: Date.now() } });
        }, this.HEARTBEAT_INTERVAL);
    }

    stopHeartbeat() {
        clearInterval(this.heartbeatTimer);
        this.pendingPong = false;
        this.missedPongs = 0;
    }

    disconnect() {
        this.stopHeartbeat();
        this.ws?.close();
        this.isConnected = false;
    }
}

class LocalChannelClient {
    constructor() {
        this.channel = null; this.userId = generateId(); this.userName = '';
        this.isConnected = false; this.isHost = false; this.isSpectator = false; this.roomPassword = ''; this.users = new Map();
    }
    init(handlers) { this.handlers = handlers; }
    async startServer(config) {
        this.isHost = true;
        this.isSpectator = false;
        this.roomPassword = config.password || '';
        this.userName = config.userName || this.userName || '房主';

        this.channel = new BroadcastChannel(`st-multiplayer-${config.port}`); // 使用本地频道作为房主
        this.channel.onmessage = (e) => this.handleMessage(e.data);
        this.isConnected = true;
        this.handlers.onConnectionChange?.(true);

        const hostUser = { id: this.userId, name: this.userName, isHost: true, isSpectator: false };
        this.users.set(this.userId, hostUser);
        this.handlers.onUserJoin?.(hostUser);
    }
    async connect(port, password, userName, spectator = false) {
        this.isHost = false;
        this.isSpectator = !!spectator;
        this.userName = userName || `用户${this.userId.substring(0, 4)}`;
        this.channel = new BroadcastChannel(`st-multiplayer-${port}`); // 客户端连接本地频道
        this.channel.onmessage = (e) => this.handleMessage(e.data);
        this.isConnected = true;
        this.handlers.onConnectionChange?.(true);
        this.send({ type: 'join', data: { name: this.userName, password, spectator: this.isSpectator } });
    }
    send(payload) {
        if (this.channel && this.isConnected) {
            this.channel.postMessage({ ...payload, from: this.userId, fromName: this.userName, timestamp: Date.now() }); // 本地广播消息
        }
    }
    broadcast(payload) { this.send(payload); }
    handleMessage(msg) {
        if (msg.from === this.userId) return;
        if (msg.type === 'join') {
            if (this.isHost && this.roomPassword && msg.data.password !== this.roomPassword) {
                this.send({ type: 'error', data: { targetId: msg.from, message: '密码错误' } }); return;
            }
            const newUser = {
                id: msg.from,
                name: msg.data.name || msg.fromName,
                isSpectator: !!msg.data?.spectator
            };
            this.users.set(msg.from, newUser); this.handlers.onUserJoin?.(newUser);
            if (this.isHost) this.send({ type: 'sync_state', data: { users: Array.from(this.users.values()) } }); // 房主同步状态
        } else if (msg.type === 'leave') {
            this.users.delete(msg.from);
            this.handlers.onUserLeave?.(msg.from);
        } else if (msg.type === 'sync_state' && !this.isHost) {
            msg.data.users.forEach(u => {
                if (!this.users.has(u.id)) {
                    this.users.set(u.id, u);
                    this.handlers.onUserJoin?.(u);
                }
            });
        } else {
            this.handlers.onMessage?.(msg);
        }
    }
    disconnect() { this.send({ type: 'leave', data: null }); this.channel?.close(); this.isConnected = false; }
}

// ==========================================
// 4. 状态管理器 (Pinia Store)
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

    const ROOM_LOGS_KEY = 'st_multiplayer_room_logs_v1';
    const NO_ROOM_KEY = '__no_room__';
    const currentRoomId = ref('');

    const normalizeRoomKey = (roomId = '') => {
        const raw = (roomId || '').toString().trim().toLowerCase();
        return raw || NO_ROOM_KEY;
    };

    const loadRoomLogs = () => {
        try {
            const raw = localStorage.getItem(ROOM_LOGS_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (e) {
            return {};
        }
    };

    const roomLogsMap = ref(loadRoomLogs());

    const persistRoomLogs = () => {
        try {
            localStorage.setItem(ROOM_LOGS_KEY, JSON.stringify(roomLogsMap.value));
        } catch (e) {}
    };

    const switchRoomLogs = (roomId = '') => {
        currentRoomId.value = (roomId || '').toString().trim();
        const key = normalizeRoomKey(currentRoomId.value);
        if (!Array.isArray(roomLogsMap.value[key])) {
            roomLogsMap.value[key] = [];
            persistRoomLogs();
        }
        chatLogs.value = [...roomLogsMap.value[key]];
    };

    const pruneRoomLogsByExistingRoomIds = (roomIds = []) => {
        const keepKeys = new Set(roomIds.map(id => normalizeRoomKey(id)));
        const next = {};

        for (const [key, logs] of Object.entries(roomLogsMap.value || {})) {
            if (key === NO_ROOM_KEY || keepKeys.has(key)) {
                next[key] = Array.isArray(logs) ? logs : [];
            }
        }

        roomLogsMap.value = next;
        persistRoomLogs();

        const currentKey = normalizeRoomKey(currentRoomId.value);
        if (currentKey !== NO_ROOM_KEY && !keepKeys.has(currentKey)) {
            currentRoomId.value = '';
            chatLogs.value = [];
        } else if (currentRoomId.value) {
            chatLogs.value = [...(roomLogsMap.value[currentKey] || [])];
        }
    };

    // 变量模式（需跨组件/跨模块访问，必须放在 store 中）
    const _VM_KEY = 'st_multiplayer_variable_mode';
    const variableMode = ref(localStorage.getItem(_VM_KEY) || 'none');
    watch(variableMode, (v) => { localStorage.setItem(_VM_KEY, v); });

    const spectatorMode = ref(false);

    // 连接相关设置（作为运行时统一来源）
    const settings = reactive({
        onlineMode: true,
        onlineServer: 'https://room.yufugemini.cloud',
        defaultUserName: '',
        timedInputSeconds: 0
    });

    let networkClient = null;
    let userJoinOrderSeed = 0;

    // 自动重连状态
    let reconnectTimer = null;
    let reconnectAttempt = 0;
    const reconnectDelays = [1000, 2000, 4000];
    let reconnectContext = null;
    let sessionEstablished = false;
    let manualDisconnect = false;
    let isReconnecting = false;

    const clearReconnectTimer = () => {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
    };

    const scheduleReconnect = () => {
        if (manualDisconnect || !reconnectContext || reconnectTimer || isConnected.value) return;

        const idx = Math.min(reconnectAttempt, reconnectDelays.length - 1);
        const delay = reconnectDelays[idx];
        reconnectAttempt++;

        addLog('system', '系统', `连接断开，${delay / 1000}s 后自动重连（第 ${reconnectAttempt} 次）`);

        reconnectTimer = setTimeout(async () => {
            reconnectTimer = null;
            if (manualDisconnect || isConnected.value || !reconnectContext) return;

            try {
                isReconnecting = true;
                await connectOnline(
                    reconnectContext.roomId,
                    reconnectContext.pwd,
                    reconnectContext.name,
                    reconnectContext.uid,
                    { isReconnect: true }
                );
            } catch (e) {
                scheduleReconnect();
            }
        }, delay);
    };

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

        const isHost = !!(user.isHost ?? user.host ?? false);
        const isSpectator = !!(user.isSpectator ?? user.spectator ?? user.is_observer ?? user.observer ?? false);

        return {
            id: user.id,
            name: user.name || user.fromName || '匿名',
            isHost,
            isSpectator,
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

    const buildUsersSnapshot = () => {
        return users.value.map((u, idx) => ({
            id: u.id,
            name: u.name || '匿名',
            isHost: !!u.isHost,
            isSpectator: !!u.isSpectator,
            _joinOrder: Number.isFinite(u?._joinOrder) ? u._joinOrder : (idx + 1)
        }));
    };

    const getUserJoinOrder = (u, idx = 0) => {
        return Number.isFinite(u?._joinOrder) ? u._joinOrder : (idx + 1);
    };

    const pickNextHostCandidate = () => {
        const players = users.value
            .filter(u => !u.isSpectator)
            .slice()
            .sort((a, b) => {
                const orderDiff = getUserJoinOrder(a) - getUserJoinOrder(b);
                if (orderDiff !== 0) return orderDiff;
                return String(a.id).localeCompare(String(b.id), 'zh-CN');
            });

        return players[0] || null;
    };

    const addLog = (type, from, content) => {
        const key = normalizeRoomKey(currentRoomId.value);
        const list = Array.isArray(roomLogsMap.value[key]) ? roomLogsMap.value[key] : [];
        const nextItem = {
            id: `log-${Date.now()}-${Math.random()}`,
            type,
            from,
            content,
            timestamp: Date.now()
        };

        list.push(nextItem);
        const trimmed = list.length > 150 ? list.slice(-100) : list;

        roomLogsMap.value[key] = trimmed;
        if (key === normalizeRoomKey(currentRoomId.value)) {
            chatLogs.value = [...trimmed];
        }

        persistRoomLogs();
    };

    const initNetwork = (forceOnline = settings.onlineMode) => {
        if (networkClient) {
            try { networkClient.disconnect(); } catch (e) {}
        }

        networkClient = forceOnline ? new WebSocketClient() : new LocalChannelClient();
        networkClient.init({
            onConnectionChange: (status) => {
                isConnected.value = status;
                addLog('system', '系统', status ? '连接成功' : '连接断开');

                if (status) {
                    sessionEstablished = true;
                    reconnectAttempt = 0;
                    isReconnecting = false;
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
            onUserJoin: (user) => {
                const normalized = normalizeIncomingUser(user);

                const selfId = networkClient?.userId || '';
                const existingById = users.value.find(u => u.id === normalized.id);
                const target = existingById;

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

                    addLog(
                        'system',
                        '系统',
                        `${normalized.name}${normalized.isHost ? ' (房主)' : ''} 加入房间`
                    );
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

                    if (normalized.hasHostField) {
                        target.isHost = normalized.isHost;
                    }

                    if (normalized.hasSpectatorField) {
                        target.isSpectator = normalized.isSpectator;
                    }

                    if (normalized.name && normalized.name !== target.name) {
                        target.name = normalized.name;
                    }

                    if (normalized.id === selfId) {
                        target.isSpectator = !!networkClient?.isSpectator;
                        if (target.isSpectator) {
                            target.isHost = false;
                        }
                    }

                    // 非房主用户在“身份更新”时移动到末尾
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

                if (isHost.value) {
                    networkClient?.broadcast({
                        type: 'sync_user_state',
                        data: { users: buildUsersSnapshot() }
                    });
                }
            },
            onUserLeave: (userId) => {
                const idx = users.value.findIndex(u => u.id === userId);
                if (idx !== -1) {
                    const leavingUser = users.value[idx];
                    const name = leavingUser.name;
                    const wasHost = !!leavingUser.isHost;

                    users.value.splice(idx, 1);
                    pendingInputs.value.delete(userId);
                    touchPendingInputs();
                    addLog('system', '系统', `${name} 离开了房间`);

                    if (wasHost && isConnected.value) {
                        const nextHost = pickNextHostCandidate();

                        if (!nextHost) {
                            addLog('system', '系统', '房主已离开且玩家列表为空，房间已解散');
                            disconnect();
                            return;
                        }

                        users.value.forEach(u => {
                            u.isHost = (u.id === nextHost.id);
                        });

                        const selfId = networkClient?.userId || '';
                        isHost.value = nextHost.id === selfId;
                        if (isHost.value) {
                            mode.value = 'client';
                        }

                        addLog('system', '系统', `房主已离开，${nextHost.name} 已自动成为新房主`);

                        if (isHost.value) {
                            networkClient?.broadcast({
                                type: 'host_change',
                                data: {
                                    hostId: nextHost.id,
                                    hostName: nextHost.name
                                }
                            });

                            networkClient?.broadcast({
                                type: 'sync_user_state',
                                data: { users: buildUsersSnapshot() }
                            });
                        }
                    }
                }
            },
            onMessage: (msg) => {
                switch (msg.type) {
                    case 'chat':
                        addLog('chat', msg.fromName, msg.data.content);
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
                        if (target) {
                            const oldName = target.name;
                            target.name = newName;
                            if (oldName !== newName) {
                                addLog('system', '系统', `${oldName} 更名为 ${newName}`);
                            }
                        }
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
                        addLog('system', msg.fromName, '提交了输入');
                        break;
                    case 'revoke_input':
                        if (pendingInputs.value.has(msg.from)) {
                            pendingInputs.value.delete(msg.from);
                            touchPendingInputs();
                            addLog('system', msg.fromName || '用户', '撤回了已提交输入');
                        }
                        break;
                    case 'spectator_mode': {
                        const enabled = !!msg.data?.enabled;
                        const targetId = msg.from || msg.data?.userId || '';
                        const fallbackName = (msg.fromName || msg.data?.userName || '').trim();

                        const target = users.value.find(u => u.id === targetId);

                        if (target) {
                            target.isSpectator = enabled;
                            if (enabled && pendingInputs.value.has(target.id)) {
                                pendingInputs.value.delete(target.id);
                                touchPendingInputs();
                            }
                        }

                        addLog(
                            'system',
                            '系统',
                            `${(target?.name || fallbackName || '用户')}${enabled ? '进入' : '退出'}观众模式`
                        );

                        if (isHost.value) {
                            networkClient?.broadcast({
                                type: 'sync_user_state',
                                data: { users: buildUsersSnapshot() }
                            });
                        }
                        break;
                    }
                    case 'ai_response':
                        if (msg.data?.variableMode) variableMode.value = msg.data.variableMode;
                        eventEmit('multiplayer_ai_response', msg.data || {});
                        break;
                    case 'ai_stream':
                        eventEmit('multiplayer_ai_stream', msg.data || {});
                        break;
                    case 'user_message':
                        // 房主已合并发送后，所有端都应重置“已提交/待提交”状态
                        clearPendingInputs();
                        eventEmit('multiplayer_user_message', msg.data || {});
                        break;
                    case 'request_pending_inputs':
                        if (isHost.value && msg.from !== networkClient?.userId) {
                            const items = buildPendingInputsSnapshot();
                            networkClient.send({
                                type: 'sync_pending_inputs',
                                data: { targetUserId: msg.from, items }
                            });

                            networkClient.send({
                                type: 'sync_user_state',
                                data: { targetUserId: msg.from, users: buildUsersSnapshot() }
                            });

                            addLog('system', '系统', `已向 ${msg.fromName || '用户'} 同步待提交输入 (${items.length} 条)`);
                        }
                        break;
                    case 'sync_pending_inputs':
                        if (!isHost.value && msg.data?.targetUserId === networkClient?.userId) {
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
                            addLog('system', '系统', `待提交输入同步完成 (${pendingInputs.value.size} 条)`);
                        }
                        break;
                    case 'sync_user_state':
                        if (!isHost.value) {
                            const targetUserId = msg.data?.targetUserId;
                            if (targetUserId && targetUserId !== networkClient?.userId) break;

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

                            const myId = networkClient?.userId;
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
                                if (me.isSpectator) {
                                    me.isHost = false;
                                }
                            }

                            isHost.value = !!users.value.find(u => u.id === myId)?.isHost;
                            mode.value = me?.isSpectator ? 'spectator' : 'client';
                        }
                        break;
                    case 'delete_last_message':
                        eventEmit('multiplayer_delete_last_message');
                        break;
                    case 'request_input':
                        addLog('system', '系统', '房主请求输入，请提交你的回复');
                        eventEmit('multiplayer_request_input');
                        break;
                    case 'reset_input':
                        clearPendingInputs();
                        addLog('system', '系统', '输入已被重置');
                        break;
                    case 'sync_history_request':
                        if (isHost.value) {
                            addLog('system', msg.fromName, '请求同步历史消息');
                            eventEmit('multiplayer_sync_history_request', { userId: msg.from, depth: msg.data?.depth || 0 });
                        }
                        break;
                    case 'sync_history_data':
                        if (!isHost.value) eventEmit('multiplayer_sync_history_data', msg.data);
                        break;
                    case 'sync_regex_request':
                        if (isHost.value) {
                            addLog('system', msg.fromName, '请求同步正则');
                            eventEmit('multiplayer_sync_regex_request', msg.from);
                        }
                        break;
                    case 'sync_regex_data':
                        if (!isHost.value) eventEmit('multiplayer_sync_regex_data', msg.data);
                        break;
                    case 'sync_variables_request':
                        if (isHost.value) {
                            addLog('system', msg.fromName, `请求同步变量 (模式: ${msg.data?.variableMode})`);
                            eventEmit('multiplayer_sync_variables_request', { userId: msg.from, variableMode: msg.data?.variableMode });
                        }
                        break;
                    case 'sync_variables':
                        if (!isHost.value) {
                            const targetUserId = (msg.data?.targetUserId || '').toString();
                            const myId = (networkClient?.userId || '').toString();

                            // 定向包：非目标客户端直接忽略
                            if (targetUserId && targetUserId !== myId) break;

                            const { variableType, content } = msg.data || {};
                            addLog('system', '系统', `[${variableType}] 收到变量同步`);
                            eventEmit('multiplayer_sync_variables', { variableType, content, targetUserId });
                        }
                        break;
                    case 'acu_full_sync':
                        if (!isHost.value) {
                            addLog('system', '系统', `[数据库] 收到全量同步 (${Object.keys(msg.data.tables || {}).length} 表)`);
                            acuSyncState.value.fullSynced = true;
                            acuSyncState.value.lastSyncTimestamp = Date.now();
                            acuSyncState.value.isolationKey = msg.data.isolationKey || '';
                            eventEmit('multiplayer_acu_full_sync', msg.data);
                        }
                        break;
                    case 'acu_delta_sync':
                        if (!isHost.value) {
                            addLog('system', '系统', `[数据库] 收到增量同步 (${(msg.data.modifiedKeys || []).length} 表)`);
                            acuSyncState.value.lastSyncTimestamp = Date.now();
                            eventEmit('multiplayer_acu_delta_sync', msg.data);
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

                        isHost.value = target.id === networkClient?.userId && !target.isSpectator;
                        addLog('system', '系统', `${target.name} 成为了房主`);

                        // 如果我就是新房主，主动广播最终权威状态，避免各端视图不一致
                        if (isHost.value) {
                            networkClient?.broadcast({
                                type: 'host_change',
                                data: {
                                    hostId: target.id,
                                    hostName: target.name
                                }
                            });

                            networkClient?.broadcast({
                                type: 'sync_user_state',
                                data: { users: buildUsersSnapshot() }
                            });
                        }
                        break;
                    }
                    case 'host_change':
                        if (msg.data?.hostId) {
                            let targetHost = users.value.find(u => u.id === msg.data.hostId);

                            if (!targetHost || targetHost.isSpectator) {
                                const fallbackHost = pickNextHostCandidate();

                                if (!fallbackHost) {
                                    addLog('system', '系统', '房间无可用玩家，房间已解散');
                                    disconnect();
                                    break;
                                }

                                targetHost = fallbackHost;
                                addLog('system', '系统', `收到无效房主变更，已自动改派为 ${targetHost.name}`);
                            }

                            users.value.forEach(u => {
                                u.isHost = (u.id === targetHost.id);
                            });

                            isHost.value = targetHost.id === networkClient?.userId && !targetHost.isSpectator;
                            addLog('system', '系统', `${targetHost.name || msg.data.hostName || '未知'} 成为了房主`);
                        }
                        break;

                }
            }
        });
    };

    // 房主限时发送逻辑
    let timeoutTimer;
    let lastPendingSize = 0;
    watch(() => pendingInputs.value, () => { // 用 getter 确保 shallowRef 变化被追踪
        const newSize = pendingInputs.value.size;
        const oldSize = lastPendingSize;
        lastPendingSize = newSize;
        if (isHost.value && settings.timedInputSeconds > 0 && newSize > 0 && newSize > oldSize) {
            if (timeoutTimer) clearTimeout(timeoutTimer);
            addLog('system', '系统', `[限时输入] ${settings.timedInputSeconds}秒后自动发送`);
            timeoutTimer = setTimeout(() => {
                if (isHost.value && pendingInputs.value.size > 0) {
                    addLog('system', '系统', '[限时输入] 自动触发合并发送');
                    submitToAI();
                }
            }, settings.timedInputSeconds * 1000);
        }
    });

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

        const fullCombined = snapshot
            .map(item => `${(item.prefix || '[{name}]:').replace('{name}', item.userName)} ${item.content}${item.suffix || ''}`)
            .join('\n\n');

        const visibleInputs = snapshot.filter(item => !item.hideContent);
        const visibleCombined = visibleInputs
            .map(item => `${(item.prefix || '[{name}]:').replace('{name}', item.userName)} ${item.content}${item.suffix || ''}`)
            .join('\n\n');

        const hiddenInputs = snapshot.filter(item => item.hideContent);
        const hiddenCombined = hiddenInputs
            .map(item => `${(item.prefix || '[{name}]:').replace('{name}', item.userName)} ${item.content}${item.suffix || ''}`)
            .join('\n\n');

        const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        try {
            await createChatMessages([{ role: 'user', message: fullCombined }]);
            const hostMsgId = getLastMessageId();

            networkClient.broadcast({
                type: 'user_message',
                data: {
                    batchId,
                    content: visibleCombined,
                    inputs: visibleInputs,
                    userLayerHidden: visibleInputs.length !== snapshot.length
                }
            });

            await triggerSlash('/trigger');

            // 首轮生成已读取 fullCombined；这里仅为后续重roll保留隐藏输入上下文
            if (hiddenCombined.trim()) {
                setHiddenRerollContext(hiddenCombined);
            } else {
                setHiddenRerollContext('');
            }

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

            addLog('ai', '系统', `已触发 AI 生成（${snapshot.length}条）`);
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

        const oldName = networkClient.userName;
        networkClient.userName = newName;

        const me = users.value.find(u => u.id === myId);
        if (me) me.name = newName;

        if (isConnected.value) {
            networkClient.broadcast({
                type: 'rename',
                data: { name: newName }
            });
        }

        if (oldName && oldName !== newName) {
            addLog('system', '系统', `你已更名为 ${newName}`);
        }

        return { ok: true };
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
        if (!isReconnect) {
            switchRoomLogs(roomId);
        }

        const safeName = (name || '').trim() || '匿名';
        const safeUid = (uid || '').trim() || `uid_${Math.random().toString(36).slice(2, 10)}`;

        networkClient.userName = safeName;
        networkClient.userId = makeBoundUserId(roomId, safeUid);
        networkClient.isSpectator = spectatorFlag;
        spectatorMode.value = spectatorFlag;

        try {
            const wsUrl = await RoomApiService.verifyAndJoin(settings.onlineServer, roomId, pwd);
            await networkClient.connect(wsUrl, pwd);
            mode.value = spectatorFlag ? 'spectator' : 'client';
            isHost.value = false;
            isReconnecting = false;

            const existing = users.value.find(
                u => u.id === networkClient.userId
            );
            if (!existing) {
                users.value.push({
                    id: networkClient.userId,
                    name: networkClient.userName,
                    isHost: false,
                    isSpectator: spectatorFlag
                });
            } else {
                existing.isSpectator = spectatorFlag;
            }

            addLog(
                'system',
                '系统',
                isReconnect
                    ? `自动重连成功，已回到房间 "${roomId}"（${spectatorFlag ? '观众' : '玩家'}）`
                    : `已加入房间 "${roomId}"（${spectatorFlag ? '观众' : '玩家'}）`
            );

            networkClient.send({
                type: 'spectator_mode',
                data: {
                    enabled: spectatorFlag,
                    userId: networkClient.userId,
                    userName: networkClient.userName
                }
            });

            networkClient.send({ type: 'request_pending_inputs', data: {} });
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
        isReconnecting = false;

        const channelPort = String((port || '').toString().trim() || '2157');
        const roomKey = `local_${channelPort}`;

        initNetwork(false);
        switchRoomLogs(roomKey);

        const safeName = (name || '').trim() || '房主';
        const safeUid = (uid || '').trim() || `uid_${Math.random().toString(36).slice(2, 10)}`;

        networkClient.userName = safeName;
        networkClient.userId = makeBoundUserId(roomKey, safeUid);
        networkClient.isSpectator = false;
        spectatorMode.value = false;

        try {
            await networkClient.startServer({
                port: channelPort,
                password: pwd || '',
                userName: safeName
            });

            mode.value = 'client';
            isHost.value = true;

            addLog('system', '系统', `已创建本地房间 "${channelPort}"（你是房主）`);
        } catch (e) {
            addLog('error', '系统', `创建本地房间失败: ${e.message}`);
            throw e;
        }
    };

    const connectOffline = async (port, pwd, name, uid, options = {}) => {
        const { spectator = false } = options;
        const spectatorFlag = !!spectator;

        manualDisconnect = false;
        sessionEstablished = false;
        reconnectContext = null;
        reconnectAttempt = 0;
        isReconnecting = false;

        const channelPort = String((port || '').toString().trim() || '2157');
        const roomKey = `local_${channelPort}`;

        initNetwork(false);
        switchRoomLogs(roomKey);

        const safeName = (name || '').trim() || '匿名';
        const safeUid = (uid || '').trim() || `uid_${Math.random().toString(36).slice(2, 10)}`;

        networkClient.userName = safeName;
        networkClient.userId = makeBoundUserId(roomKey, safeUid);
        networkClient.isSpectator = spectatorFlag;
        spectatorMode.value = spectatorFlag;

        try {
            await networkClient.connect(channelPort, pwd || '', safeName, spectatorFlag);

            mode.value = spectatorFlag ? 'spectator' : 'client';
            isHost.value = false;

            const existing = users.value.find(
                u => u.id === networkClient.userId
            );

            if (!existing) {
                users.value.push({
                    id: networkClient.userId,
                    name: networkClient.userName,
                    isHost: false,
                    isSpectator: spectatorFlag
                });
            } else {
                existing.isSpectator = spectatorFlag;
            }

            addLog('system', '系统', `已连接本地频道 "${channelPort}"（${spectatorFlag ? '观众' : '玩家'}）`);

            networkClient.send({
                type: 'spectator_mode',
                data: {
                    enabled: spectatorFlag,
                    userId: networkClient.userId,
                    userName: networkClient.userName
                }
            });

            networkClient.send({ type: 'request_pending_inputs', data: {} });
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
        isReconnecting = false;
        clearReconnectTimer();
        setHiddenRerollContext('');

        if (timeoutTimer) {
            clearTimeout(timeoutTimer);
            timeoutTimer = null;
        }

        networkClient?.disconnect();
    };

    const revokeMyInput = () => {
        if (!networkClient || !isConnected.value) return;

        const myId = networkClient.userId;
        if (!pendingInputs.value.has(myId)) {
            addLog('system', '系统', '你当前没有可撤回的输入');
            return;
        }

        pendingInputs.value.delete(myId);
        touchPendingInputs();

        networkClient.broadcast({
            type: 'revoke_input',
            data: {}
        });

        addLog('system', '我', '已撤回输入');
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

        // 未初始化网络客户端时，仅保存本地状态（作为默认加入身份）
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
        addLog('system', '系统', next ? '你已进入观众模式' : '你已退出观众模式');
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
// 5. 数据库 (ACUSyncManager)
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
        if (!store.isHost && getWin().AutoCardUpdaterAPI?.importTableAsJson) {
            const format = { mate: { type: 'chatSheets', version: 1 } };
            Object.keys(payload.tables).forEach(k => {
                if (k.startsWith('sheet_')) format[k] = payload.tables[k];
            });
            await getWin().AutoCardUpdaterAPI.importTableAsJson(JSON.stringify(format)); // 调用 ACU 官方接口导入全量数据
        }
    });

    register();
};

// ==========================================
// 6. 剧透遮罩渲染 (SpoilerEngine)
// ==========================================
const initSpoilerEngine = () => {
    const targetDoc = parentWindow.document;
    const process = (root) => {
        const walker = targetDoc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        const nodes = [];
        while (walker.nextNode()) if (walker.currentNode.textContent.includes('||')) nodes.push(walker.currentNode); // 查找包含 || 的节点
        
        nodes.forEach(node => {
            const text = node.textContent; const regex = /\|\|(.+?)\|\|/g;
            if (regex.test(text)) {
                const frag = targetDoc.createDocumentFragment(); let match, last = 0; regex.lastIndex = 0;
                while ((match = regex.exec(text)) !== null) {
                    if (match.index > last) frag.appendChild(targetDoc.createTextNode(text.slice(last, match.index)));
                    const span = targetDoc.createElement('span'); span.className = 'mp-spoiler'; span.textContent = match[1]; // 替换为遮罩 span
                    span.onclick = function() { this.classList.toggle('revealed'); };
                    frag.appendChild(span); last = match.index + match[0].length;
                }
                if (last < text.length) frag.appendChild(targetDoc.createTextNode(text.slice(last)));
                node.parentNode?.replaceChild(frag, node);
            }
        });
    };
    const handler = (mesId) => setTimeout(() => {
        const el = targetDoc.querySelector(`[mesid="${mesId}"] .mes_text`);
        if (el) process(el);
    }, 50);
    onEventTracked(tavern_events.USER_MESSAGE_RENDERED, handler);
    onEventTracked(tavern_events.CHARACTER_MESSAGE_RENDERED, handler);
    setTimeout(() => targetDoc.querySelectorAll('.mes_text').forEach(process), 1000);
};

// ==========================================
// 7. ST 原生事件桥接 (Interop)
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
                        store.addLog('system', '系统', '[MVU] 变量已自动同步');
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

                store.addLog('system', '系统', 'AI回复已同步');
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
                if (payload?.userLayerHidden) {
                    store.addLog('system', '系统', '本轮存在隐藏输入，用户层无可展示内容');
                } else {
                    store.addLog('error', '系统', '同步用户消息为空，已忽略');
                }
                return;
            }

            await createChatMessages([{ role: 'user', message: content }]);
            store.addLog('system', '系统', '用户消息已同步');
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
                store.addLog('system', '系统', '最新消息已同步删除');
            }
        } catch (e) {
            store.addLog('error', '系统', '删除消息失败');
            console.error('[联机Mod] 删除消息失败:', e);
        }
    });

    // ---- 房主：处理历史同步请求 ----
    onEventTracked('multiplayer_sync_history_request', async (payload) => {
        if (!store.isHost) return;
        let userId, depth = 0;
        if (typeof payload === 'string') { userId = payload; }
        else { userId = payload.userId || ''; depth = payload.depth || 0; }
        try {
            const lastId = getLastMessageId();
            if (lastId < 0) { store.addLog('system', '系统', '没有历史消息可同步'); return; }
            let startId = 0;
            if (depth > 0 && lastId >= depth) startId = lastId - depth + 1;
            const messages = getChatMessages(`${startId}-${lastId}`).map(m => ({ role: m.role, message: m.message }));
            store.addLog('system', '系统', `准备发送${messages.length}条历史消息 (深度: ${depth || '全部'})`);
            const client = store.getClient();
            for (const msg of messages) {
                client?.send({ type: 'sync_history_data', data: { role: msg.role, message: msg.message, targetUserId: userId } });
            }
            client?.send({ type: 'sync_history_data', data: { complete: true, count: messages.length, targetUserId: userId } });
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
            if (data?.complete) {
                store.addLog('system', '系统', `历史同步完成，共${data.count}条消息`);
            } else if (data?.role && data?.message) {
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
            store.addLog('system', '系统', `已发送${regexes.length}条正则`);
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
                store.addLog('system', '系统', `正则同步完成，共${regexes.length}条`);
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
                store.addLog('system', '系统', '[MVU] 变量已发送给用户');
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
                store.addLog('system', '系统', `[数据库] 已发送全量同步 (${Object.keys(tables).length} 表)`);
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
        const { variableType, content } = payload;
        try {
            if (content.error) {
                store.addLog('system', '系统', `[${variableType}] ${content.error}`);
                return;
            }
            if (variableType === 'mvu') {
                const msgId = getLastMessageId();
                if (msgId >= 0 && content) {
                    await updateVariablesWith(v => {
                        if (content.stat_data) v.stat_data = content.stat_data;
                        if (content.display_data) v.display_data = content.display_data;
                        if (content.delta_data) v.delta_data = content.delta_data;
                        if (content.schema) v.schema = content.schema;
                        return v;
                    }, { type: 'message', message_id: msgId });
                    store.addLog('system', '系统', '[MVU] 变量同步完成');
                }
            }
        } catch (e) {
            store.addLog('error', '系统', `变量同步失败: ${e.message}`);
            console.error('[联机Mod] 变量同步失败:', e);
        }
    });
};


// ==========================================
// 8. Vue 界面组件 (UI) - Render 函数版本
// ==========================================
const MultiplayerPanel = defineComponent({
    setup() {
        const store = useMultiplayerStore();
        const isMinimized = ref(true);
        const showSettings = ref(false);
        const isDragging = ref(false);
        const panelRef = ref(null);
        const panelStyle = reactive({ left: '20px', top: '20px' });
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
                store.addLog('system', '系统', '观众模式下不可提交输入');
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

            store.addLog('system', '我', '输入已提交');
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
            store.addLog('system', '系统', '已重置输入状态');
            myInput.value = '';
        };

        // 客户端同步按钮
        const requestSyncHistory = () => {
            store.getClient()?.send({ type: 'sync_history_request', data: { depth: localSettings.syncHistoryDepth || 10 } });
            store.addLog('system', '系统', '正在请求同步历史消息...');
        };
        const requestSyncRegex = () => {
            store.getClient()?.send({ type: 'sync_regex_request', data: {} });
            store.addLog('system', '系统', '正在请求同步正则...');
        };
        const requestSyncVariables = () => {
            store.getClient()?.send({ type: 'sync_variables_request', data: { variableMode: store.variableMode || 'none' } });
            store.addLog('system', '系统', '正在请求同步变量...');
        };

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
            hideUserInputContent: false,
            sendUserPersona: true,
            personaPrefix: '[{name}]的设定:',
            timedInputSeconds: 0,
            syncHistoryDepth: 10,
            variableMode: 'none'
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

        // 将关键运行配置归一到 store.settings
        store.settings.defaultUserName = (localSettings.defaultUserName || '').trim();
        store.settings.timedInputSeconds = Number(localSettings.timedInputSeconds) || 0;

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

        // 自动滚动日志
        watch(() => store.chatLogs.length, () => {
            nextTick(() => {
                if (logsRef.value) logsRef.value.scrollTop = logsRef.value.scrollHeight;
            });
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
            const panelWidth = panelEl.offsetWidth || 320;
            const panelHeight = panelEl.offsetHeight || 44;

            const maxLeft = Math.max(0, viewportWidth - panelWidth);
            const maxTop = Math.max(0, viewportHeight - panelHeight);

            const currentLeft = parseInt(panelStyle.left, 10) || 0;
            const currentTop = parseInt(panelStyle.top, 10) || 0;

            const nextLeft = Math.min(maxLeft, Math.max(0, currentLeft));
            const nextTop = Math.min(maxTop, Math.max(0, currentTop));

            panelStyle.left = nextLeft + 'px';
            panelStyle.top = nextTop + 'px';
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
            const panelWidth = panelEl?.offsetWidth || 320;
            const panelHeight = panelEl?.offsetHeight || 44;

            const maxLeft = Math.max(0, viewportWidth - panelWidth);
            const maxTop = Math.max(0, viewportHeight - panelHeight);

            const nextLeft = Math.min(maxLeft, Math.max(0, e.clientX - dragOffset.x));
            const nextTop = Math.min(maxTop, Math.max(0, e.clientY - dragOffset.y));

            panelStyle.left = nextLeft + 'px';
            panelStyle.top = nextTop + 'px';
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
                class: ['multiplayer-panel', { minimized: isMinimized.value, dragging: isDragging.value }],
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

                // 内容区（未最小化时始终渲染，设置页时用 display:none 隐藏，模拟 v-show）
                !isMinimized.value ? h('div', {
                    class: 'panel-content'
                }, [
                    // ========== 未连接状态 ==========
                    store.mode === 'disconnected' ? h('div', { class: 'settings-section' }, [
                        // 用户名区块（小标题样式）
                        h('div', { class: 'username-section' }, [
                            h(
                                'div',
                                { class: 'section-title fa-solid' },
                                String.fromCharCode(0xf007) + ' 用户名'
                            ),
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
                                    h('span', { class: 'section-title fa-solid' },
                                        String.fromCharCode(0xf0ac) + ' 在线房间'),
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
                                                        room.currentUsers + '/' + room.maxUsers),
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
                                    h('div', { class: 'section-title fa-solid' },
                                        String.fromCharCode(0xf067) + ' 创建房间'),
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
                                onlineUsers.value.map(u =>
                                    h('div', {
                                        key: u.id,
                                        class: ['user-item', {
                                            host: u.isHost,
                                            submitted: hasSubmitted(u.id)
                                        }]
                                    }, [
                                        // 头像
                                        h('span', {
                                            class: ['user-avatar', { 'avatar-submitted': hasSubmitted(u.id) }]
                                        }, hasSubmitted(u.id) ? '✓' : (u.name || '?').charAt(0).toUpperCase()),
                                        // 用户名
                                        h('span', { class: 'user-name' }, u.name),
                                        // 房主皇冠
                                        u.isHost
                                            ? h('span', { class: 'host-crown fa-solid' }, String.fromCharCode(0xf521))
                                            : null,
                                        // 等待中徽章（已移除）
                                        null,
                                        // 转让房主按钮（仅房主可见，且不显示在自己身上）
                                        store.isHost && !u.isHost
                                            ? h('button', {
                                                class: 'transfer-btn fa-solid',
                                                title: '转让房主',
                                                onClick: () => transferHost(u.id)
                                            }, String.fromCharCode(0xf362)) // fa-right-left / exchange
                                            : null
                                    ].filter(Boolean))
                                )
                            )
                        ]),

                        // ---- 观众列表 ----
                        h('div', { key: 'spectator-list', class: 'spectator-list' }, [
                            h('div', { class: 'section-title fa-solid' }, `${String.fromCharCode(0xf06e)} 观众 (${spectators.value.length})`),
                            spectators.value.length > 0
                                ? h('div', { class: 'spectator-items' },
                                    spectators.value.map(u =>
                                        h('span', { key: u.id, class: ['user-item', 'spectator-item'] }, [
                                            h('span', { class: 'user-avatar' }, (u.name || '?').charAt(0).toUpperCase()),
                                            h('span', { class: 'user-name' }, u.name)
                                        ])
                                    )
                                )
                                : h('div', { class: 'empty-inputs' }, '暂无观众')
                        ]),

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
                            h('div', { class: 'section-title' }, '本轮输入'),

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
                                        : '输入你的回复内容，点击提交发送...',
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
                                        ? `${String.fromCharCode(0xf2ea)} 撤回输入`
                                        : '提交输入'),
                                    // 房主立即发送按钮
                                    store.isHost
                                        ? h('button', {
                                            class: 'action-btn primary',
                                            onClick: submitToAI,
                                            disabled: getPendingMap().size === 0
                                        }, '立即发送 (' + getPendingMap().size + ')')
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
                    // 弹窗头部
                    h('div', { class: 'settings-modal-header' }, [
                        h('span', { class: 'fa-solid' }, String.fromCharCode(0xf013) + ' 设置'),
                        h('button', {
                            class: 'icon-btn fa-solid',
                            onClick: () => showSettings.value = false
                        }, String.fromCharCode(0xf00d))
                    ]),

                    // 设置主体
                    h('div', { class: 'settings-modal-body' }, [

                        // ---- 在线模式开关 ----
                        h('div', { class: 'setting-item toggle-item' }, [
                            h('div', {
                                class: 'toggle-label',
                                onClick: () => { store.settings.onlineMode = !store.settings.onlineMode; }
                            }, [
                                h('span', { class: 'fa-solid' }, String.fromCharCode(0xf0ac) + ' 在线模式:'),
                                h('span', { class: ['toggle-switch', { active: store.settings.onlineMode }] })
                            ]),
                            h('small', { class: 'hint' }, '连接到公共服务器创建/加入房间')
                        ]),

                        h('div', { class: 'setting-item toggle-item' }, [
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

                        // ---- 服务器地址（仅在线模式） ----
                        store.settings.onlineMode
                            ? h('div', { class: 'setting-item' }, [
                                h('label', {}, '服务器地址:'),
                                h('input', {
                                    value: store.settings.onlineServer,
                                    onInput: (e) => { store.settings.onlineServer = e.target.value; },
                                    placeholder: 'https://room.example.com',
                                    class: 'settings-input'
                                })
                            ])
                            : null,

                        // ---- 分割线 ----
                        h('hr', { class: 'settings-divider' }),

                        // ---- 用户名 ----
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

                        // ---- UID ----
                        h('div', { class: 'setting-item' }, [
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

                        // ---- 隐藏模式开关 ----
                        h('div', { class: 'setting-item toggle-item' }, [
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

                        // ---- 限时输入（仅房主可见） ----
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
                                    style: { width: '80px' }
                                }),
                                h('small', { class: 'hint' }, '有人提交后N秒自动发送，0为关闭')
                            ])
                            : null,

                        // ---- 同步历史消息层数 ----
                        h('div', { class: 'setting-item' }, [
                            h('label', {}, '同步历史消息层数:'),
                            h('input', {
                                type: 'number',
                                value: localSettings.syncHistoryDepth,
                                onInput: (e) => { localSettings.syncHistoryDepth = parseInt(e.target.value) || 0; },
                                onChange: saveSettings,
                                min: 0,
                                max: 1000,
                                class: 'settings-input',
                                style: { width: '80px' }
                            }),
                            h('small', { class: 'hint' }, '限制同步的历史消息数量，0为全部')
                        ]),

                        // ---- 发送用户设定开关 ----
                        h('div', { class: 'setting-item toggle-item' }, [
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
                            ? h('div', { class: 'setting-item' }, [
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
                        h('div', { class: 'setting-item message-prefix-setting' }, [
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
                        h('div', { class: 'setting-item' }, [
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
                            h('div', { style: { marginTop: '8px' } }, [
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
// 9. 挂载与初始化 (Bootstrap)
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
        const old = (parentWindow.document || document).getElementById(CONTAINER_ID);
        if (old) old.remove();
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