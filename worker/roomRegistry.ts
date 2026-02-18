import { DurableObject } from 'cloudflare:workers';

interface RoomInfo {
  id: string;
  hostId: string;
  playerCount: number;
  maxPlayers: number;
  phase: string;
  isPublic: boolean;
  createdAt: number;
}

interface Env {
  GAME_ROOM: DurableObjectNamespace;
}

export class RoomRegistry extends DurableObject<Env> {
  private rooms: Map<string, RoomInfo>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.rooms = new Map();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/register' && request.method === 'POST') {
      const roomInfo: RoomInfo = await request.json();
      this.rooms.set(roomInfo.id, roomInfo);
      await this.ctx.storage.put(`room:${roomInfo.id}`, roomInfo);
      return Response.json({ success: true });
    }
    
    if (url.pathname === '/unregister' && request.method === 'POST') {
      const body = await request.json() as { roomId: string };
      this.rooms.delete(body.roomId);
      await this.ctx.storage.delete(`room:${body.roomId}`);
      return Response.json({ success: true });
    }
    
    if (url.pathname === '/update' && request.method === 'POST') {
      const roomInfo: RoomInfo = await request.json();
      this.rooms.set(roomInfo.id, roomInfo);
      await this.ctx.storage.put(`room:${roomInfo.id}`, roomInfo);
      return Response.json({ success: true });
    }
    
    if (url.pathname === '/list' && request.method === 'GET') {
      // Load from storage if not in memory
      if (this.rooms.size === 0) {
        const stored = await this.ctx.storage.list<RoomInfo>({ prefix: 'room:' });
        for (const [, roomInfo] of stored) {
          this.rooms.set(roomInfo.id, roomInfo);
        }
      }
      
      // Return only public rooms
      const publicRooms = Array.from(this.rooms.values())
        .filter(room => room.isPublic)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 50); // Limit to 50 rooms
      
      return Response.json({ rooms: publicRooms });
    }
    
    return new Response('Not found', { status: 404 });
  }
}
