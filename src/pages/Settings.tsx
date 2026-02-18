/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Globe, User, Save } from 'lucide-react';
import { changeLanguage } from '../i18n';
import { getUserProfile, saveUserProfile, getQQAvatar } from '../utils/auth';
import type { UserProfile } from '../utils/auth';

export function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [qqNumber, setQQNumber] = useState('');
  const [avatar, setAvatar] = useState('');
  const [saved, setSaved] = useState(false);

  const currentLanguage = i18n.language;

  useEffect(() => {
    // Set page title
    document.title = `${t('settings.title')} - ${t('app.title')}`;
  }, [t]);

  useEffect(() => {
    const profile = getUserProfile();
    if (profile) {
      setName(profile.name);
      setQQNumber(profile.qqNumber || '');
      setAvatar(profile.avatar || '');
    }
  }, []);

  const handleLanguageChange = (lang: string) => {
    changeLanguage(lang);
  };

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

    const profile = getUserProfile();
    if (!profile) return;

    const finalAvatar = avatar && avatar.trim() ? avatar.trim() : undefined;

    const updatedProfile: UserProfile = {
      ...profile,
      name: name.trim(),
      avatar: finalAvatar,
      qqNumber: qqNumber || undefined,
    };

    saveUserProfile(updatedProfile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            {t('settings.title')}
          </h1>

          <div className="space-y-8">
            {/* User Profile Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('profile.title')}
                </h2>
              </div>
              <div className="space-y-4">
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

                {/* QQ Number */}
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
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  disabled={saved}
                >
                  <Save className="w-5 h-5" />
                  {saved ? '✓ ' + t('common.saved') : t('common.save')}
                </button>
              </div>
            </div>

            {/* Language Settings */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('settings.language')}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    currentLanguage === 'en'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <p className="font-semibold text-gray-900 dark:text-white">English</p>
                </button>
                <button
                  onClick={() => handleLanguageChange('zh')}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    currentLanguage === 'zh'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <p className="font-semibold text-gray-900 dark:text-white">中文</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
