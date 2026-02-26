export interface Reciter {
    id: string;
    name: string;
    nameAr: string;
    baseUrl: string;
    format: string; // e.g. '000001.mp3' pattern
}

export const RECITERS: Reciter[] = [
    {
        id: 'alafasy',
        name: 'Mishary Rashid Alafasy',
        nameAr: 'مشاري راشد العفاسي',
        baseUrl: 'https://everyayah.com/data/Alafasy_128kbps',
        format: 'mp3',
    },
    {
        id: 'husary',
        name: 'Mahmoud Khalil Al-Hussary',
        nameAr: 'محمود خليل الحصري',
        baseUrl: 'https://everyayah.com/data/Husary_128kbps',
        format: 'mp3',
    },
    {
        id: 'abdul_basit',
        name: 'Abdul Basit (Murattal)',
        nameAr: 'عبد الباسط عبد الصمد (مرتل)',
        baseUrl: 'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps',
        format: 'mp3',
    },
];

// Primary Hafs audio source (EveryAyah style URL building)
// URL pattern: {baseUrl}/{surah3digit}{ayah3digit}.mp3
export const PRIMARY_AUDIO_BASE = 'https://everyayah.com/data/Alafasy_128kbps';
