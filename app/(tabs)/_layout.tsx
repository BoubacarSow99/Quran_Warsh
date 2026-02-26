import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
    return (
        <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
    );
}

export default function TabsLayout() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    // Base tab bar height + safe area inset for Android nav bar
    const tabBarHeight = 56 + insets.bottom;

    return (
        <Tabs
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: colors.tabBar,
                    borderTopColor: colors.tabBarBorder,
                    borderTopWidth: 1,
                    height: tabBarHeight,
                    paddingBottom: insets.bottom + 4,
                    paddingTop: 5,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontFamily: 'Inter',
                    marginTop: 0
                },
                headerStyle: { backgroundColor: colors.headerBg },
                headerTintColor: colors.headerText,
                headerTitleStyle: { fontSize: 22, fontFamily: 'AmiriBold' },
                headerShadowVisible: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Accueil',
                    tabBarLabel: 'Accueil',
                    tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
                    headerTitle: 'Saint Coran',
                }}
            />
            <Tabs.Screen
                name="surahs"
                options={{
                    title: 'Sourates',
                    tabBarLabel: 'Sourates',
                    tabBarIcon: ({ focused }) => <TabIcon icon="📖" focused={focused} />,
                    headerTitle: 'Liste des Sourates',
                }}
            />

            <Tabs.Screen
                name="favorites"
                options={{
                    title: 'Favoris',
                    tabBarLabel: 'Favoris',
                    tabBarIcon: ({ focused }) => <TabIcon icon="⭐" focused={focused} />,
                    headerTitle: 'Mes Favoris',
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Paramètres',
                    tabBarLabel: 'Paramètres',
                    tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />,
                    headerTitle: 'Paramètres',
                }}
            />
        </Tabs>
    );
}
