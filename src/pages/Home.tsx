import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Settings as SettingsIcon, Trash2, BookOpen } from 'lucide-react';
import { getUserProfile, getUserId } from '../utils/auth';
import type { RoomListItem } from '../types/game';
import { RulesModal } from '../components/RulesModal';

export function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  useEffect(() => {
    document.title = t('app.title');
  }, [t]);

  useEffect(() => {
    const profile = getUserProfile();
    if (!profile) {
      navigate('/profile');
      return;
    }
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

  const handleDeleteRoom = async (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation(); 
    if (!window.confirm(t('room.confirmDelete'))) {
      return;
    }
    try {
      await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
      loadRooms(); 
    } catch (error) {
      console.error('Failed to delete room:', error);
    }
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
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {t('app.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{t('app.tagline')}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRulesOpen(true)}
              className="p-3 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow text-blue-600 dark:text-blue-400 cursor-pointer flex items-center gap-2 font-semibold"
            >
              <BookOpen className="w-6 h-6" />
              <span className="hidden sm:inline">{t('app.rules')}</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="p-3 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow text-gray-900 dark:text-gray-100 cursor-pointer"
            >
              <SettingsIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <button
          onClick={handleCreateRoom}
          className="w-full mb-8 p-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-3 cursor-pointer"
        >
          <Plus className="w-6 h-6" />
          <span className="text-lg font-semibold">{t('room.create')}</span>
        </button>

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
                <div
                  key={room.id}
                  className="w-full p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{room.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('room.host')}: {room.hostName}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {room.playerCount}/{room.maxPlayers} {t('room.players')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {t(`game.phase.${room.phase}`)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {room.hostId === getUserId() && (
                          <button 
                            onClick={(e) => handleDeleteRoom(e, room.id)}
                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title={t('room.delete')}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleJoinRoom(room.id)}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow transition-colors cursor-pointer"
                        >
                          {t('room.join')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 挂载独立的规则弹窗组件 */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
    </div>
  );
}