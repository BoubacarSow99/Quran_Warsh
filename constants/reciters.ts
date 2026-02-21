export interface Reciter {
    id: string;
    name: string;
    nameAr: string;
    baseUrl: string;
    format: string; // e.g. '000001.mp3' pattern
}

export const RECITERS: Reciter[] = [
    {
        id: 'hussary_warsh',
        name: 'Mahmoud Khalil Al-Hussary (Warsh)',
        nameAr: 'محمود خليل الحصري (ورش)',
        baseUrl: 'https://www.islamicnetwork.com/audio/recitations/Warsh',
        format: 'mp3',
    },
    {
        id: 'yassin_jazaery',
        name: 'Sheikh Yassin Al-Jazaery',
        nameAr: 'ياسين الجزائري',
        baseUrl: 'https://everyayah.com/data/Warsh_Qaloon_by_Hussary_128kbps',
        format: 'mp3',
    },
    {
        id: 'dossary_warsh',
        name: 'Ibrahim Ad-Dossary (Warsh)',
        nameAr: 'إبراهيم الدوسري (ورش)',
        baseUrl: 'https://everyayah.com/data/warsh/dossary',
        format: 'mp3',
    },
];

// Primary Warsh audio source (EveryAyah style URL building)
// URL pattern: {baseUrl}/{surah3digit}{ayah3digit}.mp3
export const PRIMARY_AUDIO_BASE = 'https://everyayah.com/data/Warsh_Qaloon_by_Hussary_128kbps';
