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
    {
        id: 'sudais',
        name: 'Abdurrahman al-Sudais',
        nameAr: 'عبد الرحمن السديس',
        baseUrl: 'https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps',
        format: 'mp3',
    },
    {
        id: 'shuraim',
        name: 'Saud al-Shuraim',
        nameAr: 'سعود الشريم',
        baseUrl: 'https://everyayah.com/data/Saood_ash-Shuraym_128kbps',
        format: 'mp3',
    },
    {
        id: 'maher',
        name: 'Maher al-Muaiqly',
        nameAr: 'ماهر المعيقلي',
        baseUrl: 'https://everyayah.com/data/MaherAlMuaiqly128kbps',
        format: 'mp3',
    },
    {
        id: 'shatri',
        name: 'Abu Bakr al-Shatri',
        nameAr: 'أبو بكر الشاطري',
        baseUrl: 'https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_128kbps',
        format: 'mp3',
    },
    {
        id: 'qatami',
        name: 'Nasser al-Qatami',
        nameAr: 'ناصر القطامي',
        baseUrl: 'https://everyayah.com/data/Nasser_Alqatami_128kbps',
        format: 'mp3',
    },
    {
        id: 'minshawi',
        name: 'Muhammad Siddiq al-Minshawi',
        nameAr: 'محمد صديق المنشاوي (مرتل)',
        baseUrl: 'https://everyayah.com/data/Minshawy_Murattal_128kbps',
        format: 'mp3',
    },
];

// Primary Hafs audio source (EveryAyah style URL building)
// URL pattern: {baseUrl}/{surah3digit}{ayah3digit}.mp3
export const PRIMARY_AUDIO_BASE = 'https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps';
