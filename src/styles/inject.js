// ==========================================
// 1. CSS样式注入
// ==========================================
const STYLE_ID = 'multiplayer-mod-styles';
const STYLE_VERSION = '2026-02-27-01';

const injectStyles = () => {
    const targetDoc = parentWindow.document;

    // 热重载时移除旧样式，确保新CSS必定生效
    const prevStyle = targetDoc.getElementById(STYLE_ID);
    if (prevStyle) {
        prevStyle.remove();
    }

    const style = targetDoc.createElement('style');
    style.id = STYLE_ID;
    style.setAttribute('data-style-version', STYLE_VERSION);
    style.innerHTML = `

/* =========================================================
   00) Tokens / 设计令牌（可导入覆盖）
   ========================================================= */
:root {
    /* 尺寸 */
    --mp-full: 100%;
    --mp-w: 320px;
    --mp-min-w: 180px;
    --mp-head-h: 40px;
    --mp-ctrl-h: 30px;
    --mp-chat-min-h: 80px;
    --mp-chat-max-h: 120px;

    /* 圆角 */
    --mp-r1: 8px;
    --mp-r2: 20px;
    --mp-rp: 999px;
    --mp-rr: 50%;

    /* 间距 */
    --mp-s1: 2px;
    --mp-s2: 4px;
    --mp-s3: 8px;
    --mp-s4: 10px;
    --mp-s5: 14px;
    --mp-s6: 20px;
    --mp-s7: 80px;

    /* 字体族 */
    --mp-ffm: "SimHei", "Microsoft YaHei", "Heiti SC", sans-serif;
    --mp-ffs: "SimHei", "Microsoft YaHei", "Heiti SC", sans-serif;

    /* 字号 */
    --mp-f1: 10px;
    --mp-f2: 12px;
    --mp-f3: 14px;

    /* 字重 */
    --mp-w1: 400;
    --mp-w2: 500;
    --mp-w3: 700;

    /* 图标 */
    --mp-ic: 14px;

    /* 标题文字（section title） */
    --mp-t-fs: var(--mp-f1);
    --mp-t-fw: var(--mp-w3);
    --mp-t-ls: 0.5px;
    --mp-t-tt: uppercase;
    --mp-t-ff: var(--mp-ffm);

    /* 小字体（hint/meta/empty） */
    --mp-sm-fs: var(--mp-f1);
    --mp-sm-fw: var(--mp-w1);
    --mp-sm-ff: var(--mp-ffs);
    --mp-sm-op: 0.8;

    /* 输入框 */
    --mp-in-h: var(--mp-ctrl-h);
    --mp-in-py: 4px;
    --mp-in-px: 10px;
    --mp-in-fs: var(--mp-f3);
    --mp-in-fw: var(--mp-w2);
    --mp-in-ff: var(--mp-ffm);
    --mp-in-bw: 2px;

    /* 按钮 */
    --mp-btn-h: var(--mp-ctrl-h);
    --mp-btn-minw: 60px;
    --mp-btn-py: 4px;
    --mp-btn-px: 10px;
    --mp-btn-fs: var(--mp-f1);
    --mp-btn-fw: var(--mp-w2);
    --mp-btn-ff: var(--mp-ffm);
    --mp-btn-bw: 2px;

    /* 创建并加入按钮（独立） */
    --mp-cf: 12px;
    --mp-ch: 34px;
    --mp-cpx: 10px;

    /* 动效 */
    --mp-z: 99999;
    --mp-fast: 0.2s;
    --mp-mid: 0.3s;
    --mp-ease: ease;

    /* 基础 RGB 主题 */
    --mp-brand: 99, 102, 241;
    --mp-ok: 74, 222, 128;
    --mp-warn: 251, 191, 36;
    --mp-danger: 255, 59, 48;
    --mp-host: 251, 191, 36;
    --mp-spec: 56, 189, 248;
    --mp-white: 255, 255, 255;
    --mp-shadow: 0, 0, 0;
    --mp-overlay: 20, 20, 30;

    /* 透明度 */
    --mp-at: 1;
    --mp-abg: 0.98;

    /* 图案（可选） */
    --mp-ptn: none;
    --mp-ptn-size: 12px 12px;

    /* 全局语义兜底（避免面板外元素引用失效） */
    --mp-text: var(--SmartThemeFontColor, #fff);
    --mp-text-body: var(--SmartThemeBodyColor, var(--SmartThemeEmColor, #ddd));
    --mp-title-c: var(--mp-text);

    --mp-c-ok: rgb(var(--mp-ok));
    --mp-c-warn: rgb(var(--mp-warn));
    --mp-c-danger: rgb(var(--mp-danger));
    --mp-c-host: rgb(var(--mp-host));
    --mp-c-spec: rgb(var(--mp-spec));

    --mp-c-gray-1: #666;
    --mp-c-gray-2: #555;
    --mp-c-gray-3: #ccc;
    --mp-c-red-soft: #f87171;
    --mp-c-violet: #a78bfa;
    --mp-c-crown-hover: #fde68a;
    --mp-c-white: #fff;
    --mp-c-spoiler: #4a4a4a;
    --mp-c-spoiler-h: #5a5a5a;
}

/* =========================================================
   01) Layout / 布局容器
   顺序：容器 -> 子项 -> 状态
   ========================================================= */
.multiplayer-panel {
    /* 业务绑定色：可被 SmartTheme 覆盖 */
    --mp-text: var(--SmartThemeFontColor, inherit);
    --mp-text-body: var(--SmartThemeBodyColor, var(--SmartThemeEmColor, inherit));
    --mp-title-c: var(--mp-text);

    --mp-bg-panel: var(--SmartThemeBlurTintColor, rgba(var(--mp-overlay), var(--mp-abg)));
    --mp-bg-surface: var(--SmartThemeChatColor, rgba(var(--mp-white), calc(0.10 * var(--mp-abg))));
    --mp-bg-strong: rgba(var(--mp-brand), calc(0.30 * var(--mp-at)));

    --mp-bd: rgba(var(--mp-brand), calc(0.35 * var(--mp-at)));
    --mp-bd-strong: rgba(var(--mp-brand), calc(0.55 * var(--mp-at)));

    --mp-hover: rgba(var(--mp-brand), calc(0.30 * var(--mp-at)));
    --mp-hover-soft: rgba(var(--mp-brand), calc(0.15 * var(--mp-at)));
    --mp-hover-danger: rgba(var(--mp-danger), calc(0.30 * var(--mp-at)));

    --mp-scroll: rgba(var(--mp-brand), calc(0.50 * var(--mp-at)));

    --mp-c-ok: rgb(var(--mp-ok));
    --mp-c-warn: rgb(var(--mp-warn));
    --mp-c-danger: rgb(var(--mp-danger));
    --mp-c-host: rgb(var(--mp-host));
    --mp-c-spec: rgb(var(--mp-spec));

    /* 常用纯色也变量化 */
    --mp-c-gray-1: #666;
    --mp-c-gray-2: #555;
    --mp-c-gray-3: #ccc;
    --mp-c-red-soft: #f87171;
    --mp-c-violet: #a78bfa;
    --mp-c-crown-hover: #fde68a;
    --mp-c-white: #fff;
    --mp-c-spoiler: #4a4a4a;
    --mp-c-spoiler-h: #5a5a5a;

    position: fixed;
    z-index: var(--mp-z);
    width: var(--mp-w);
    min-height: var(--mp-head-h);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    font-family: var(--mp-ffm) !important;
    font-size: var(--mp-f3);
    font-weight: var(--mp-w2);
    color: var(--mp-text) !important;

    background: var(--mp-bg-panel);
    background-image: var(--mp-ptn);
    background-size: var(--mp-ptn-size);

    border-radius: var(--mp-r2);
    box-shadow:
        0 10px 32px rgba(var(--mp-shadow), 0.5),
        0 0 0 2px var(--mp-bd-strong);
    backdrop-filter: var(--SmartThemeBlur, blur(10px));

    transition:
        box-shadow var(--mp-mid) var(--mp-ease),
        opacity var(--mp-fast) var(--mp-ease);
}

.multiplayer-panel.minimized {
    width: fit-content;
    min-width: var(--mp-min-w);
    max-height: var(--mp-head-h);
}

.multiplayer-panel.settings-open:not(.minimized) {
    height: min(520px, calc(100vh - 20px));
    max-height: min(520px, calc(100vh - 20px));
}

.multiplayer-panel.dragging {
    opacity: 0.9;
    cursor: grabbing;
}

/* 头部 */
.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--mp-head-h);
    padding: 0 var(--mp-s5);
    background: var(--mp-bg-strong);
    cursor: grab;
    touch-action: none;
    user-select: none;
}

.header-left,
.header-actions {
    display: flex;
    align-items: center;
    gap: var(--mp-s2);
}

.header-left {
    flex: 1;
    min-width: 0;
}

.title {
    flex: 1;
    min-width: 0;
    height: 30px;
    display: flex;
    align-items: center;
    font-family: var(--mp-ffm);
    font-size: var(--mp-f3);
    font-weight: var(--mp-w2);
    color: var(--mp-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* 内容容器 */
.panel-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--mp-s2);
    padding: var(--mp-s4);
    overflow: auto;
}

.settings-section,
.online-rooms-section,
.create-room-section,
.username-section {
    display: flex;
    flex-direction: column;
}

.settings-section,
.online-rooms-section {
    gap: var(--mp-s4);
}

.create-room-section {
    margin-top: var(--mp-s4);
    padding-top: var(--mp-s4);
    border-top: 2px solid rgba(var(--mp-white), 0.1);
    gap: var(--mp-s2);
}

.username-section {
    gap: var(--mp-s2);
    padding-bottom: var(--mp-s4);
    border-bottom: 2px solid rgba(var(--mp-white), 0.1);
}

.setting-row {
    display: flex;
    align-items: center;
    gap: var(--mp-s2);
    min-height: var(--mp-ctrl-h);
}

.setting-row label {
    min-width: 60px;
    height: var(--mp-ctrl-h);
    display: inline-flex;
    align-items: center;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.join-room-section {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 60px 60px;
    align-items: center;
    gap: var(--mp-s2);
    margin-top: var(--mp-s1);
}

.create-room-options {
    display: flex;
    gap: var(--mp-s2);
}

.button-group {
    display: flex;
    gap: var(--mp-s2);
    margin-top: var(--mp-s1);
}

.chat-input-area {
    display: flex;
    gap: var(--mp-s2);
}

.input-submit-area {
    display: flex;
    flex-direction: column;
    gap: var(--mp-s2);
    padding: var(--mp-s2);
    border: 2px solid var(--mp-bd);
    border-radius: var(--mp-r1);
    background: var(--mp-bg-surface);
}

.sync-buttons-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--mp-s2);
    margin-bottom: var(--mp-s1);
}

/* =========================================================
   02) Inputs / 输入控件
   顺序：子项 -> 状态
   ========================================================= */
.multiplayer-panel .input-field,
.multiplayer-panel .settings-input,
.multiplayer-panel .chat-input,
.multiplayer-panel .input-textarea {
    box-sizing: border-box;
    border: var(--mp-in-bw) solid var(--mp-bd) !important;
    border-radius: var(--mp-r1) !important;
    background: var(--mp-bg-surface) !important;
    color: var(--mp-text) !important;
    -webkit-text-fill-color: var(--mp-text) !important;
    outline: none;

    font-family: var(--mp-in-ff);
    font-size: var(--mp-in-fs);
    font-weight: var(--mp-in-fw);
    padding: var(--mp-in-py) var(--mp-in-px);
}

.multiplayer-panel .input-field,
.multiplayer-panel .settings-input,
.multiplayer-panel .chat-input {
    height: var(--mp-in-h);
}

.multiplayer-panel .input-field {
    flex: 1;
}

.multiplayer-panel .input-field:focus,
.multiplayer-panel .settings-input:focus,
.multiplayer-panel .chat-input:focus,
.multiplayer-panel .input-textarea:focus {
    border-color: rgba(var(--mp-brand), 0.6) !important;
    background: rgba(var(--mp-brand), 0.15) !important;
}

.input-field.medium {
    min-width: 120px;
    max-width: 170px;
}

.input-field.small {
    max-width: 80px;
}

.input-field.tiny {
    max-width: 60px;
}

.input-textarea {
    width: var(--mp-full);
    min-height: 60px;
    resize: vertical;
}

.settings-input {
    width: var(--mp-full);
    appearance: none;
    -webkit-appearance: none;
}

input[type="number"].settings-input {
    background: var(--mp-bg-surface) !important;
}

.join-room-section .input-field {
    min-width: 0;
    max-width: var(--mp-full);
}

.chat-input {
    flex: 1;
}

/* =========================================================
   03) Buttons / 按钮系统
   顺序：本体 -> 状态 -> 交互
   ========================================================= */
.icon-btn,
.refresh-btn,
.action-btn,
.send-btn,
.sync-history-btn,
.transfer-leading-btn {
    transition: all var(--mp-fast) var(--mp-ease);
    font-family: var(--mp-btn-ff);
}

/* 图标按钮 */
.icon-btn,
.refresh-btn {
    width: 30px;
    height: 30px;
    border: none;
    border-radius: var(--mp-r1);
    background: var(--mp-bg-surface) !important;
    color: var(--mp-text) !important;
    cursor: pointer;
}

.icon-btn:hover,
.refresh-btn:hover:not(:disabled) {
    background: var(--mp-hover);
}

.icon-btn.danger-icon:hover {
    background: var(--mp-hover-danger);
    color: var(--mp-c-danger);
}

/* 主按钮 */
.action-btn,
.send-btn {
    border-radius: var(--mp-r1);
    border: var(--mp-btn-bw) solid transparent;
    cursor: pointer;
}

.action-btn {
    flex: 1;
    height: var(--mp-btn-h);
    min-width: var(--mp-btn-minw);
    padding: var(--mp-btn-py) var(--mp-btn-px);
    font-size: var(--mp-btn-fs);
    font-weight: var(--mp-btn-fw);
    color: var(--mp-text);
}

.action-btn.primary,
.send-btn {
    background: rgba(var(--mp-brand), 0.6);
    border-color: rgba(var(--mp-brand), 0.8);
    color: var(--mp-text);
}

.action-btn.secondary {
    background: var(--mp-bg-surface);
    border-color: rgba(var(--mp-brand), 0.4);
    color: var(--mp-text);
}

.action-btn.primary:hover:not(:disabled),
.send-btn:hover:not(:disabled) {
    background: rgba(var(--mp-brand), 0.8);
}

.action-btn.secondary:hover:not(:disabled) {
    background: var(--mp-hover);
}

/* 创建并加入按钮独立尺寸 */
.create-room-section .action-btn {
    height: var(--mp-ch);
    font-size: var(--mp-cf);
    padding: var(--mp-btn-py) var(--mp-cpx);
}

/* Join 行按钮 */
.join-room-section .action-btn {
    height: var(--mp-btn-h);
    min-width: var(--mp-btn-minw);
    padding: 0 var(--mp-s2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--mp-s2);
    font-size: var(--mp-btn-fs);
    font-weight: var(--mp-btn-fw);
    white-space: nowrap;
}

.join-room-section .join-btn-icon.fa-solid {
    font-size: var(--mp-ic);
    line-height: 1;
}

.join-room-section .join-btn-label {
    line-height: 1;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* 发送按钮 */
.send-btn {
    padding: var(--mp-btn-py) var(--mp-btn-px);
    font-size: var(--mp-f3);
    font-weight: var(--mp-w2);
}

/* 同步按钮 */
.sync-history-btn {
    padding: 2px 4px;
    border-radius: var(--mp-r1);
    border: var(--mp-btn-bw) solid rgba(var(--mp-brand), 0.5);
    background: rgba(var(--mp-brand), 0.2);
    color: var(--mp-text);
    cursor: pointer;
    font-size: var(--mp-sm-fs);
    font-weight: var(--mp-sm-fw) !important;
}

.sync-history-btn:hover {
    background: rgba(var(--mp-brand), 0.4);
    border-color: var(--mp-bd-strong);
}

/* 转让房主按钮 */
.transfer-leading-btn {
    width: 14px;
    min-width: 14px;
    height: 14px;
    padding: 0;
    border: none;
    border-radius: var(--mp-rr);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    color: var(--mp-c-host);
    font-size: var(--mp-f1);
    cursor: pointer;
}

.transfer-leading-btn:hover {
    color: var(--mp-c-crown-hover);
    background: rgba(var(--mp-host), 0.15);
}

/* 禁用态 */
.action-btn:disabled,
.send-btn:disabled,
.refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* =========================================================
   04) Lists / 列表与文本
   顺序：容器 -> 子项 -> 状态 -> 空态
   ========================================================= */
/* 滚动条统一 */
.panel-content,
.settings-modal-body,
.chat-logs,
.room-list,
.pending-inputs {
    scrollbar-width: thin;
    scrollbar-color: var(--mp-scroll) transparent !important;
}

.panel-content::-webkit-scrollbar,
.settings-modal-body::-webkit-scrollbar,
.chat-logs::-webkit-scrollbar,
.room-list::-webkit-scrollbar,
.pending-inputs::-webkit-scrollbar {
    width: 4px;
}

.panel-content::-webkit-scrollbar-thumb,
.settings-modal-body::-webkit-scrollbar-thumb,
.chat-logs::-webkit-scrollbar-thumb,
.room-list::-webkit-scrollbar-thumb,
.pending-inputs::-webkit-scrollbar-thumb {
    background: var(--mp-scroll) !important;
    border-radius: var(--mp-rp);
}

/* 小字体统一入口 */
.setting-row label,
.room-meta,
.empty-rooms,
.host-badge,
.all-submitted,
.log-time,
.pending-input-item,
.empty-inputs,
.empty-logs,
.hint,
.preview-label,
.preview-text,
.sync-history-btn {
    font-family: var(--mp-sm-ff);
    font-size: var(--mp-sm-fs);
    font-weight: var(--mp-sm-fw);
}

/* 标题统一入口 */
.section-title {
    margin-bottom: var(--mp-s1);
    font-size: var(--mp-t-fs);
    font-weight: var(--mp-t-fw);
    letter-spacing: var(--mp-t-ls);
    text-transform: var(--mp-t-tt);
    color: var(--mp-title-c);
}

/* 图标统一入口 */
.icon-btn.fa-solid,
.refresh-btn.fa-solid,
.join-btn-icon.fa-solid,
.transfer-leading-btn.fa-solid,
.user-leading-icon.fa-solid,
.send-btn.fa-solid,
.sync-history-btn.fa-solid,
.action-btn.fa-solid,
.section-title.fa-solid {
    font-family: "Font Awesome 6 Free", "Font Awesome 5 Free" !important;
    font-weight: 900 !important;
    font-size: var(--mp-ic);
    line-height: 1;
}

/* 状态点 */
.status-dot {
    width: 10px;
    height: 10px;
    border-radius: var(--mp-rr);
    background: var(--mp-c-gray-1);
}

.status-dot.connected {
    background: var(--mp-c-ok);
    box-shadow: 0 0 10px rgba(var(--mp-ok), 1);
}

.status-dot.connecting {
    background: var(--mp-c-warn);
    animation: mp-pulse 1s infinite;
}

/* 房间列表 */
.room-list {
    display: flex;
    flex-direction: column;
    gap: var(--mp-s2);
    max-height: 150px;
    overflow-y: auto;
}

.room-item,
.empty-rooms {
    border-radius: var(--mp-r1);
    background: var(--mp-bg-surface);
}

.room-item {
    border: 2px solid var(--mp-bd);
    padding: 4px 10px;
    cursor: pointer;
}

.room-item:hover {
    background: var(--mp-hover-soft);
    border-color: rgba(var(--mp-brand), 0.6);
}

.room-item.selected {
    background: var(--mp-hover);
    border-color: var(--mp-bd-strong);
}

.room-info,
.room-meta {
    display: flex;
    align-items: center;
    gap: var(--mp-s2);
}

.room-meta {
    margin-top: var(--mp-s1);
    opacity: var(--mp-sm-op);
}

.empty-rooms {
    padding: var(--mp-s6);
    text-align: center;
    opacity: var(--mp-sm-op);
}

/* 用户列表 */
.user-list,
.spectator-list {
    flex-shrink: 0;
}

.user-list .section-title,
.spectator-list .section-title {
    margin-bottom: var(--mp-s2);
}

.user-items,
.spectator-items {
    display: flex;
    flex-wrap: wrap;
    gap: var(--mp-s2);
}

.user-item {
    display: inline-flex;
    align-items: center;
    gap: var(--mp-s2);
    min-width: 60px;
    max-width: 100px;
    height: 30px;
    padding: 4px 10px;
    border-radius: var(--mp-r2);
    border: 2px solid rgba(var(--mp-white), 0.25);
    background: var(--mp-bg-surface);
    font-size: var(--mp-f1);
    white-space: nowrap;
    overflow: hidden;
}

.user-item.host {
    background: rgba(var(--mp-host), 0.15);
    border-color: rgba(var(--mp-host), 0.8);
}

.user-item.submitted {
    background: rgba(var(--mp-ok), 0.15);
    border-color: rgba(var(--mp-ok), 0.6);
}

.user-item.spectator-item {
    background: rgba(var(--mp-spec), 0.12);
    border-color: rgba(var(--mp-spec), 0.45);
}

.user-leading-icon {
    width: 14px;
    min-width: 14px;
    text-align: center;
    font-size: var(--mp-f1);
    opacity: 0.9;
}

.user-leading-icon.host-crown {
    color: var(--mp-c-host);
    opacity: 1;
}

.user-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
}

.host-badge {
    margin-left: var(--mp-s2);
    color: var(--mp-c-host);
}

.all-submitted {
    margin-left: var(--mp-s2);
    color: var(--mp-c-ok);
}

/* 聊天日志 */
.chat-logs {
    flex: 1;
    min-height: var(--mp-chat-min-h);
    max-height: var(--mp-chat-max-h);
    overflow-y: auto;
    padding: var(--mp-s2);
    border: 2px solid var(--mp-bd);
    border-radius: var(--mp-r1);
    background: var(--mp-bg-surface) !important;
}

.log-item {
    padding: 2px 0;
    line-height: 1.4;
    word-break: break-word;
    color: var(--mp-text);
}

.log-item.chat {
    color: var(--mp-text-body) !important;
}

.log-item.error {
    color: var(--mp-c-red-soft);
}

.log-time {
    margin-right: var(--mp-s2);
    opacity: var(--mp-sm-op);
}

.log-from {
    margin-right: var(--mp-s1);
    font-weight: var(--mp-w2);
}

.log-item.chat .log-from,
.log-item.chat .log-content {
    font-weight: var(--mp-w2);
}

.empty-logs {
    padding: var(--mp-s6);
    text-align: center;
}

/* 输入池 */
.pending-inputs {
    max-height: 100px;
    overflow-y: auto;
    padding: var(--mp-s2);
    border-radius: var(--mp-r1);
    background: rgba(var(--mp-shadow), 0.2);
}

.pending-input-item {
    padding: 2px 0;
    border-bottom: 2px solid rgba(var(--mp-white), 0.05);
}

.pending-input-item:last-child {
    border-bottom: none;
}

.input-user {
    margin-right: var(--mp-s2);
    font-weight: var(--mp-w2);
    color: var(--mp-c-violet);
}

.input-content {
    color: var(--mp-c-gray-3);
}

.empty-inputs {
    padding: var(--mp-s2);
    text-align: center;
    color: var(--mp-c-gray-2);
}

/* =========================================================
   05) Modal / 设置面板
   顺序：容器 -> 子项 -> 状态
   ========================================================= */
.settings-modal,
.settings-modal-content {
    width: var(--mp-full);
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

/* 层级说明：跟随 .multiplayer-panel z-index，不再额外叠高 */
.settings-modal-content {
    overflow: hidden;
    border: 2px solid var(--mp-bd-strong) !important;
    background: var(--mp-bg-panel) !important;
    backdrop-filter: var(--SmartThemeBlur, blur(10px));
}

.settings-modal-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: var(--mp-s4);
}

.setting-item {
    display: block;
    font-size: var(--mp-f1);
    color: var(--mp-text) !important;
}

.settings-modal-body .setting-item > label {
    display: block;
    margin-bottom: var(--mp-s2);
    font-family: var(--mp-ffm);
    font-size: var(--mp-f2);
    font-weight: var(--mp-w2);
    color: var(--mp-text);
}

.hint {
    display: block;
    margin-top: var(--mp-s2);
    opacity: 0.6;
}

.preview-box {
    margin-top: var(--mp-s2);
    padding: var(--mp-s4);
    border-radius: var(--mp-r1);
    background: var(--mp-bg-surface);
}

.preview-label {
    margin-right: var(--mp-s2);
    opacity: 0.8;
}

.preview-text {
    font-style: italic;
}

.toggle-item {
    margin-bottom: var(--mp-s6);
}

.toggle-label {
    display: flex;
    align-items: center;
    gap: var(--mp-s4);
    cursor: pointer;
    font-size: var(--mp-f2);
    font-weight: var(--mp-w2);
    color: var(--mp-text);
}

.toggle-switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;
    border-radius: 10px;
    background: rgba(var(--mp-white), 0.2);
}

.toggle-switch::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    border-radius: var(--mp-rr);
    background: var(--mp-c-white);
    transition: transform var(--mp-mid) var(--mp-ease);
}

.toggle-switch.active {
    background: var(--mp-c-ok) !important;
}

.toggle-switch.active::after {
    transform: translateX(20px) !important;
}

/* =========================================================
   06) Utilities / 状态、动效、辅助
   ========================================================= */
@keyframes mp-pulse {
    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

.hidden-content {
    color: var(--mp-text);
    font-style: italic;
}

.mp-spoiler {
    padding: 0 var(--mp-s2);
    border-radius: var(--mp-r1);
    cursor: pointer;
    user-select: none;
    color: transparent;
    background: var(--mp-c-spoiler);
}

.mp-spoiler:hover {
    background: var(--mp-c-spoiler-h);
}

.mp-spoiler.revealed {
    color: inherit;
    cursor: text;
    user-select: auto;
    background: transparent;
}

.toggle-switch.active::after {
    transform: translateX(20px) !important;
}

/* ==============================
   P) 文本隐藏与剧透
   ============================== */
.hidden-content {
    color: var(--mp-text);
    font-style: italic;
}

.mp-spoiler {
    padding: 0 var(--mp-s4);
    border-radius: var(--mp-r1);
    cursor: pointer;
    user-select: none;
    color: transparent;
    background: #4a4a4a;
}

.mp-spoiler:hover {
    background: #5a5a5a;
}

.mp-spoiler.revealed {
    color: inherit;
    cursor: text;
    user-select: auto;
    background: transparent;
}

    `;

    targetDoc.head.appendChild(style);
};

// ==========================================
