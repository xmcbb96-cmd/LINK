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
