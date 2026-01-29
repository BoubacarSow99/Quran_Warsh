export const QURAN_API_BASE = 'https://api.alquran.cloud/v1';
export const AUDIO_BASE_URL = 'https://cdn.islamic.network/quran/audio/128';

export const RECITATEURS = [
  {
    id: 'warsh_hussary',
    name: 'Sheikh Mahmoud Khalil Al-Hussary',
    nameAr: 'الشيخ محمود خليل الحصري',
    identifier: 'ar.alafasy',
    edition: 'warsh'
  },
  {
    id: 'warsh_jazaery',
    name: 'Sheikh Yassin Al-Jazaery',
    nameAr: 'الشيخ ياسين الجزائري',
    identifier: 'ar.abdulbasitmurattal',
    edition: 'warsh'
  }
];

export const STORAGE_KEYS = {
  FAVORITES: '@quran_warsh_favorites',
  LAST_READ: '@quran_warsh_last_read',
  SETTINGS: '@quran_warsh_settings',
  DOWNLOADED_SOURATES: '@quran_warsh_downloads'
};