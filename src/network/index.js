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
