/**
 * LINK build output
 * Source: modularized project layout with lossless concatenation build
 * Generated at: 2026-04-11T08:05:35.581Z
 */

// --- src/entry/preamble.js ---
import { createPinia, defineStore } from 'https://testingcf.jsdelivr.net/npm/pinia/+esm'; // 引入 Pinia

// --- src/env/runtime.js ---
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

// --- src/env/events.js ---
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

// --- src/styles/inject.js ---
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

// --- src/network/index.js ---
// 2. 大厅 API 服务 
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

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const err = new Error(
                data.error ||
                (response.status === 404 ? '房间不存在或已关闭' : '加入房间失败')
            );
            err.status = response.status;
            err.code = 'ROOM_JOIN_FAILED';
            throw err;
        }

        return `${baseUrl.replace('http', 'ws')}/ws/room/${roomId}`;
    }
};

// ==========================================
// 3. 网络通信模块
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

// --- src/store/index.js ---
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

// --- src/features/acu/index.js ---
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

// --- src/features/spoiler/index.js ---
// 6. 剧透遮罩渲染 
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

// --- src/tavern/hooks.js ---
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

// --- src/ui/panel.js ---
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

// --- src/ui/mount.js ---
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
