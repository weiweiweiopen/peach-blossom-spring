export interface Env {
  ROOM_PRESENCE: DurableObjectNamespace;
}

interface Presence {
  playerId: string;
  displayName: string;
  avatar: string;
  x: number;
  y: number;
  room: string;
  status: "online" | "away" | "offline";
  lastActive: number;
}

interface ChatMessage {
  id: string;
  room: string;
  encounterId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

interface ClientState {
  socket: WebSocket;
  presence: Presence | null;
}

interface ClientMessage {
  type?: string;
  room?: string;
  presence?: Partial<Presence>;
  message?: Partial<ChatMessage>;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  fetch(request: Request, env: Env): Response | Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (url.pathname === "/health" || url.pathname === "/status") {
      return Response.json({ ok: true, service: "peach-blossom-spring-multiplayer" }, { headers: corsHeaders });
    }
    if (request.headers.get("Upgrade") !== "websocket") {
      return Response.json({ ok: true, websocket: "/ws?room=<roomId>" }, { headers: corsHeaders });
    }

    const room = url.searchParams.get("room")?.trim();
    if (!room) return new Response("Missing room", { status: 400, headers: corsHeaders });
    const id = env.ROOM_PRESENCE.idFromName(room);
    return env.ROOM_PRESENCE.get(id).fetch(request);
  },
};

export class RoomPresence {
  private readonly clients = new Set<ClientState>();
  private readonly presences = new Map<string, Presence>();

  fetch(request: Request): Response {
    if (request.headers.get("Upgrade") !== "websocket") {
      return Response.json({ ok: true, players: [...this.presences.values()] }, { headers: corsHeaders });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();

    const state: ClientState = { socket: server, presence: null };
    this.clients.add(state);
    this.send(server, { type: "room_snapshot", players: [...this.presences.values()] });

    server.addEventListener("message", (event) => {
      this.handleMessage(state, event.data);
    });
    server.addEventListener("close", () => this.removeClient(state));
    server.addEventListener("error", () => this.removeClient(state));

    return new Response(null, { status: 101, webSocket: client });
  }

  private handleMessage(state: ClientState, data: unknown): void {
    if (typeof data !== "string") return;
    let message: ClientMessage;
    try {
      message = JSON.parse(data) as ClientMessage;
    } catch {
      return;
    }

    if (message.type === "join_room" || message.type === "presence_update" || message.type === "move_player") {
      const presence = normalizePresence(message.presence, message.room);
      if (!presence) return;
      state.presence = presence;
      this.presences.set(presence.playerId, presence);
      this.broadcast({ type: message.type === "move_player" ? "move_player" : "presence_update", presence });
      return;
    }

    if (message.type === "chat_message") {
      const chatMessage = normalizeChatMessage(message.message, message.room);
      if (!chatMessage) return;
      this.broadcast({ type: "chat_message", message: chatMessage });
      return;
    }

    if (message.type === "leave_room") {
      this.removeClient(state);
    }
  }

  private removeClient(state: ClientState): void {
    this.clients.delete(state);
    const playerId = state.presence?.playerId;
    if (!playerId) return;
    this.presences.delete(playerId);
    this.broadcast({ type: "leave_room", playerId });
  }

  private broadcast(payload: unknown): void {
    const text = JSON.stringify(payload);
    for (const client of this.clients) {
      try {
        client.socket.send(text);
      } catch {
        this.removeClient(client);
      }
    }
  }

  private send(socket: WebSocket, payload: unknown): void {
    socket.send(JSON.stringify(payload));
  }
}

function normalizeChatMessage(input: Partial<ChatMessage> | undefined, room: string | undefined): ChatMessage | null {
  if (!input || typeof room !== "string") return null;
  if (typeof input.id !== "string" || typeof input.encounterId !== "string") return null;
  if (typeof input.senderId !== "string" || typeof input.senderName !== "string") return null;
  if (typeof input.text !== "string" || typeof input.timestamp !== "number") return null;
  const text = input.text.trim().slice(0, 500);
  if (!text) return null;
  return {
    id: input.id.slice(0, 96),
    room: room.slice(0, 96),
    encounterId: input.encounterId.slice(0, 160),
    senderId: input.senderId.slice(0, 96),
    senderName: input.senderName.slice(0, 48),
    text,
    timestamp: Number.isFinite(input.timestamp) ? input.timestamp : Date.now(),
  };
}

function normalizePresence(input: Partial<Presence> | undefined, room: string | undefined): Presence | null {
  if (!input || typeof room !== "string") return null;
  if (typeof input.playerId !== "string" || typeof input.displayName !== "string") return null;
  if (typeof input.x !== "number" || typeof input.y !== "number") return null;
  return {
    playerId: input.playerId.slice(0, 96),
    displayName: input.displayName.slice(0, 48),
    avatar: typeof input.avatar === "string" ? input.avatar.slice(0, 48) : "wanderer",
    x: input.x,
    y: input.y,
    room,
    status: input.status === "away" || input.status === "offline" ? input.status : "online",
    lastActive: Date.now(),
  };
}
