import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Users, Lock, Globe } from 'lucide-react';
import { getUserProfile } from '../utils/auth';

export function CreateRoom() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // Set page title
    document.title = `${t('room.create')} - ${t('app.title')}`;
  }, [t]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const profile = getUserProfile();
      if (!profile) {
        navigate('/profile');
        return;
      }
      
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isPublic,
          hostId: profile.id,
        }),
      });

      const data = await response.json();
      // Pass isPublic as URL parameter so the room can be initialized correctly
      navigate(`/room/${data.roomId}?isPublic=${isPublic}`);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert(t('common.error'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="container mx-auto max-w-2xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('common.back')}
        </button>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('room.create')}
            </h1>
          </div>

          <div className="space-y-6">
            {/* Room Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('room.roomType')}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setIsPublic(true)}
                  className={`p-6 rounded-lg border-2 transition-all cursor-pointer ${
                    isPublic
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Globe className={`w-8 h-8 mx-auto mb-2 ${isPublic ? 'text-blue-500' : 'text-gray-400'}`} />
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {t('room.publicRoom')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('room.publicDescription')}
                  </p>
                </button>

                <button
                  onClick={() => setIsPublic(false)}
                  className={`p-6 rounded-lg border-2 transition-all cursor-pointer ${
                    !isPublic
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Lock className={`w-8 h-8 mx-auto mb-2 ${!isPublic ? 'text-blue-500' : 'text-gray-400'}`} />
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {t('room.privateRoom')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('room.privateDescription')}
                  </p>
                </button>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full py-4 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
            >
              {creating ? t('common.loading') : t('room.create')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
