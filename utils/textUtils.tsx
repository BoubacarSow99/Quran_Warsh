import React from 'react';
import { Text } from 'react-native';

const ALLAH_WORDS = ['ٱللَّهُ', 'ٱللَّهَ', 'ٱللَّهِ', 'اللَّهُ', 'اللَّهَ', 'اللَّهِ', 'لِلَّهِ', 'اللَّهُمَّ', 'ٱللَّهۚ'];
const ALLAH_REGEX = /(ٱللَّهُ|ٱللَّهَ|ٱللَّهِ|اللَّهُ|اللَّهَ|اللَّهِ|لِلَّهِ|اللَّهُمَّ|ٱللَّهۚ)/g;

export function renderColoredText(text: string): (string | React.ReactNode)[] {
    if (!text) return [];

    // All-in-one cleaner: strips tajweed markup AND removes Kashida
    const cleanText = (t: string): string => {
        let last;
        let stripped = t;
        do {
            last = stripped;
            stripped = stripped.replace(/\[([^\[\]]+)\[([^\]]+)\]/g, '$2');
        } while (stripped !== last);
        return stripped.replace(/\u0640/g, ''); 
    };

    const cleaned = cleanText(text);
    const parts = cleaned.split(ALLAH_REGEX);
    
    return parts.map((part, i) => {
        if (ALLAH_WORDS.includes(part)) {
            return (
                <Text key={`allah-${i}`} style={{ color: '#9E2A2B', fontWeight: 'bold' }}>
                    {part}
                </Text>
            );
        }
        return part;
    });
}
