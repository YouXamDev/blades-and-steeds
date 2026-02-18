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
      
      // Don't register the room immediately - it will be registered when the first player joins
      // This ensures we have the actual host name instead of "unknown"
      
      return Response.json({ roomId });
    }

    // WebSocket: Join room
    if (url.pathname.startsWith('/api/rooms/')) {
      const roomId = url.pathname.split('/').pop();
      if (!roomId) {
        return new Response('Room ID required', { status: 400 });
      }

      // Get or create Durable Object for this room
      const id = env.GAME_ROOM.idFromName(roomId);
      const stub = env.GAME_ROOM.get(id);

      // Forward request to Durable Object
      return stub.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;