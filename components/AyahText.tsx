import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface AyahTextProps {
    text: string;
    number: number;
    isHighlighted?: boolean;
    onPress?: () => void;
    onLongPress?: () => void;
}

export default function AyahText({
    text,
    number,
    isHighlighted,
    onPress,
    onLongPress,
}: AyahTextProps) {
    const { colors, settings } = useTheme();

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[styles.container, isHighlighted && { backgroundColor: colors.primary + '15' }]}
        >
            <View style={styles.content}>
                <Text
                    style={[
                        styles.text,
                        {
                            color: colors.arabicText,
                            fontSize: settings.fontSize,
                            lineHeight: settings.fontSize * 1.8
                        },
                    ]}
                >
                    {text} <Text style={[styles.number, { color: colors.primary }]}>﴿{number}﴾</Text>
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    text: {
        fontFamily: 'Amiri',
        textAlign: 'right',
        writingDirection: 'rtl',
    },
    number: {
        fontFamily: 'Amiri',
    },
});
