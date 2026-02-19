import { GameRoom } from './gameRoom';
import { RoomRegistry } from './roomRegistry';

export { GameRoom, RoomRegistry };

interface Env {
  GAME_ROOM: DurableObjectNamespace<GameRoom>;
  ROOM_REGISTRY: DurableObjectNamespace<RoomRegistry>;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API: List public rooms
    if (url.pathname === '/api/rooms' && request.method === 'GET') {
      const registryId = env.ROOM_REGISTRY.idFromName('global');
      const registry = env.ROOM_REGISTRY.get(registryId);
      return registry.fetch(new Request(url.origin + '/list'));
    }

    // API: Create room
    if (url.pathname === '/api/rooms' && request.method === 'POST') {
      const roomId = crypto.randomUUID();
      return Response.json({ roomId });
    }

    // API: Delete/Dismiss room (新增：从大厅解散房间)
    if (url.pathname.startsWith('/api/rooms/') && request.method === 'DELETE') {
      const roomId = url.pathname.split('/').pop();
      if (roomId) {
        const registryId = env.ROOM_REGISTRY.idFromName('global');
        const registry = env.ROOM_REGISTRY.get(registryId);
        // 调用 Registry 的 unregister 接口
        await registry.fetch(new Request(url.origin + '/unregister', {
          method: 'POST',
          body: JSON.stringify({ roomId }),
        }));
        return Response.json({ success: true });
      }
    }

    // WebSocket: Join room
    if (url.pathname.startsWith('/api/rooms/')) {
      const roomId = url.pathname.split('/').pop();
      if (!roomId) {
        return new Response('Room ID required', { status: 400 });
      }

      const id = env.GAME_ROOM.idFromName(roomId);
      const stub = env.GAME_ROOM.get(id);
      return stub.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;