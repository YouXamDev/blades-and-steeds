// Cookie-based user identification
const USER_ID_KEY = 'blade_steeds_user_id';
const USER_PROFILE_KEY = 'blade_steeds_user_profile';

export function getUserId(): string {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  qqNumber?: string;
}

export function getUserProfile(): UserProfile | null {
  const profile = localStorage.getItem(USER_PROFILE_KEY);
  if (!profile) return null;
  try {
    return JSON.parse(profile);
  } catch {
    return null;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}

export function getQQAvatar(qqNumber: string): string {
  return `https://q.qlogo.cn/g?b=qq&nk=${qqNumber}&s=100`;
}

export function clearUserData(): void {
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USER_PROFILE_KEY);
}
