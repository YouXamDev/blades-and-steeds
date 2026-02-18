import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Save, User } from 'lucide-react';
import { getUserId, getUserProfile, saveUserProfile, getQQAvatar } from '../utils/auth';
import type { UserProfile } from '../utils/auth';

export function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [qqNumber, setQQNumber] = useState('');
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    document.title = `${t('profile.title')} - ${t('app.title')}`;
  }, [t]);

  useEffect(() => {
    const profile = getUserProfile();
    if (profile) {
      setName(profile.name);
      setQQNumber(profile.qqNumber || '');
      setAvatar(profile.avatar || '');
    }
  }, []);

  const handleUseQQAvatar = () => {
    if (qqNumber) {
      setAvatar(getQQAvatar(qqNumber));
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert(t('common.error'));
      return;
    }

    // Only use avatar if it exists and is valid
    const finalAvatar = avatar && avatar.trim() ? avatar.trim() : undefined;

    const profile: UserProfile = {
      id: getUserId(),
      name: name.trim(),
      avatar: finalAvatar,
      qqNumber: qqNumber || undefined,
    };

    saveUserProfile(profile);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('profile.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t('app.tagline')}</p>
        </div>

        <div className="space-y-6">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('profile.username')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('profile.usernamePlaceholder')}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* QQ Number (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('profile.qqNumber')} <span className="text-gray-500 text-xs">({t('common.optional')})</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={qqNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setQQNumber(value);
                  // Auto-clear avatar if QQ number is cleared
                  if (!value && avatar && avatar.includes('q.qlogo.cn')) {
                    setAvatar('');
                  }
                }}
                placeholder={t('profile.qqPlaceholder')}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleUseQQAvatar}
                disabled={!qqNumber}
                className="px-4 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
              >
                {t('profile.useQQAvatar')}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('profile.qqHint')}
            </p>
          </div>

          {/* Avatar Preview */}
          {avatar && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile.avatar')}
              </label>
              <div className="flex justify-center">
                <img
                  src={avatar}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full border-4 border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-5 h-5" />
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
