import { TILE_SIZE } from "./office/types.js";

export interface MultiplayerConfig {
  room: string;
  endpoint: string;
}

export interface MultiplayerPresence {
  playerId: string;
  displayName: string;
  avatar: string;
  x: number;
  y: number;
  room: string;
  status: "online" | "away" | "offline";
  lastActive: number;
}

type PresenceHandler = (presence: MultiplayerPresence) => void;
type SnapshotHandler = (players: MultiplayerPresence[]) => void;
type LeaveHandler = (playerId: string) => void;
type StatusHandler = (status: string) => void;

interface MultiplayerClientHandlers {
  onSnapshot: SnapshotHandler;
  onPresence: PresenceHandler;
  onLeave: LeaveHandler;
  onStatus: StatusHandler;
}

interface IncomingMessage {
  type?: string;
  playerId?: string;
  presence?: Partial<MultiplayerPresence>;
  players?: Array<Partial<MultiplayerPresence>>;
}

export function readMultiplayerConfig(): MultiplayerConfig | null {
  const params = new URLSearchParams(window.location.search);
  const room = params.get("room")?.trim();
  const endpoint = params.get("mp")?.trim();
  if (!room || !endpoint) return null;

  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return { room, endpoint: url.toString().replace(/\/$/, "") };
  } catch {
    return null;
  }
}

export function getOrCreatePlayerId(): string {
  const storageKey = "peach_multiplayer_player_id";
  const existing = localStorage.getItem(storageKey);
  if (existing) return existing;
  const id = `pbs-${crypto.randomUUID()}`;
  localStorage.setItem(storageKey, id);
  return id;
}

export function createPresence(
  config: MultiplayerConfig,
  playerId: string,
  displayName: string,
  avatar: string,
  tile: { col: number; row: number },
): MultiplayerPresence {
  return {
    playerId,
    displayName,
    avatar,
    x: tile.col,
    y: tile.row,
    room: config.room,
    status: "online",
    lastActive: Date.now(),
  };
}

const JITSI_BASE_URL = "https://meet.ffmuc.net";

export function jitsiUrlForEncounter(room: string, playerA: string, playerB: string): string {
  const roomPart = safeJitsiPart(room);
  const ids = [playerA, playerB].map(safeJitsiPart).sort().join("-");
  return `${JITSI_BASE_URL}/peach-${roomPart}-${ids}`;
}

export function tileFromPixels(x: number, y: number): { col: number; row: number } {
  return {
    col: Math.floor(x / TILE_SIZE),
    row: Math.floor(y / TILE_SIZE),
  };
}

function safeJitsiPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "anon";
}

function isPresence(value: Partial<MultiplayerPresence> | undefined): value is MultiplayerPresence {
  return (
    typeof value?.playerId === "string" &&
    typeof value.displayName === "string" &&
    typeof value.avatar === "string" &&
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    typeof value.room === "string" &&
    typeof value.status === "string" &&
    typeof value.lastActive === "number"
  );
}

export class MultiplayerPresenceClient {
  private ws: WebSocket | null = null;
  private closed = false;
  private reconnectTimer: number | null = null;
  private reconnectDelayMs = 1000;
  private latestPresence: MultiplayerPresence;
  private readonly config: MultiplayerConfig;
  private readonly handlers: MultiplayerClientHandlers;

  constructor(
    config: MultiplayerConfig,
    initialPresence: MultiplayerPresence,
    handlers: MultiplayerClientHandlers,
  ) {
    this.config = config;
    this.latestPresence = initialPresence;
    this.handlers = handlers;
  }

  connect(): void {
    if (this.closed) return;
    this.handlers.onStatus("connecting");
    const url = new URL(this.config.endpoint);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = `${url.pathname.replace(/\/$/, "")}/ws`;
    url.searchParams.set("room", this.config.room);

    const ws = new WebSocket(url.toString());
    this.ws = ws;

    ws.addEventListener("open", () => {
      this.reconnectDelayMs = 1000;
      this.handlers.onStatus("connected");
      this.send("join_room", this.latestPresence);
    });

    ws.addEventListener("message", (event) => {
      this.handleMessage(event.data);
    });

    ws.addEventListener("close", () => {
      if (this.ws === ws) this.ws = null;
      if (this.closed) return;
      this.handlers.onStatus("reconnecting");
      this.scheduleReconnect();
    });

    ws.addEventListener("error", () => {
      this.handlers.onStatus("error");
      ws.close();
    });
  }

  updatePresence(presence: MultiplayerPresence): void {
    this.latestPresence = presence;
    this.send("presence_update", presence);
  }

  close(): void {
    this.closed = true;
    if (this.reconnectTimer !== null) window.clearTimeout(this.reconnectTimer);
    this.send("leave_room", this.latestPresence);
    this.ws?.close();
    this.ws = null;
  }

  private send(type: "join_room" | "presence_update" | "move_player" | "leave_room", presence: MultiplayerPresence): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type, room: this.config.room, presence }));
  }

  private handleMessage(data: unknown): void {
    if (typeof data !== "string") return;
    let message: IncomingMessage;
    try {
      message = JSON.parse(data) as IncomingMessage;
    } catch {
      return;
    }

    if (message.type === "room_snapshot") {
      this.handlers.onSnapshot((message.players ?? []).filter(isPresence));
      return;
    }
    if ((message.type === "presence_update" || message.type === "move_player") && isPresence(message.presence)) {
      this.handlers.onPresence(message.presence);
      return;
    }
    if (message.type === "leave_room" && typeof message.playerId === "string") {
      this.handlers.onLeave(message.playerId);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) return;
    const delay = this.reconnectDelayMs;
    this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 1.6, 10000);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}
