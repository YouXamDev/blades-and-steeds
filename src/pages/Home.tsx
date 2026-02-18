import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Settings as SettingsIcon } from 'lucide-react';
import { getUserProfile } from '../utils/auth';
import type { RoomListItem } from '../types/game';

export function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set page title
    document.title = t('app.title');
  }, [t]);

  useEffect(() => {
    // Check if user has profile
    const profile = getUserProfile();
    if (!profile) {
      navigate('/profile');
      return;
    }

    // Load public rooms
    loadRooms();
  }, [navigate]);

  const loadRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = () => {
    navigate('/create-room');
  };

  const handleJoinRoom = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-lg dark:text-white">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {t('app.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{t('app.tagline')}</p>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="p-3 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow text-gray-900 dark:text-gray-100 cursor-pointer"
          >
            <SettingsIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Create Room Button */}
        <button
          onClick={handleCreateRoom}
          className="w-full mb-8 p-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-3 cursor-pointer"
        >
          <Plus className="w-6 h-6" />
          <span className="text-lg font-semibold">{t('room.create')}</span>
        </button>

        {/* Room List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <Users className="w-6 h-6" />
            {t('room.roomList')}
          </h2>

          {rooms.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>{t('room.noPublicRooms')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleJoinRoom(room.id)}
                  className="w-full p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{room.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('room.host')}: {room.hostName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {room.playerCount}/{room.maxPlayers} {t('room.players')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {t(`game.phase.${room.phase}`)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
