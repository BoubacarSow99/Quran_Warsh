import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Book, List, Search, Heart, Settings } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

// Screens
import AccueilScreen from '../screens/AcceuilScreen';
import SouratesScreen from '../screens/SouratesScreen';
import SourateDetailScreen from '../screens/SourateDetailScreen';
import RechercheScreen from '../screens/RechercheScreen';
import FavorisScreen from '../screens/FavorisScreen';
import ParametresScreen from '../screens/ParametresScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator pour les Sourates
function SouratesStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen 
        name="SouratesList" 
        component={SouratesScreen}
        options={{ title: 'Sourates' }}
      />
      <Stack.Screen 
        name="SourateDetail" 
        component={SourateDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Stack Navigator pour l'Accueil
function AccueilStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen 
        name="AccueilHome" 
        component={AccueilScreen}
        options={{ title: 'Quran Warsh' }}
      />
      <Stack.Screen 
        name="SourateDetail" 
        component={SourateDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Stack Navigator pour la Recherche
function RechercheStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen 
        name="RechercheHome" 
        component={RechercheScreen}
        options={{ title: 'Recherche' }}
      />
      <Stack.Screen 
        name="SourateDetail" 
        component={SourateDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Stack Navigator pour les Favoris
function FavorisStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen 
        name="FavorisHome" 
        component={FavorisScreen}
        options={{ title: 'Favoris' }}
      />
      <Stack.Screen 
        name="SourateDetail" 
        component={SourateDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Bottom Tab Navigator Principal
export default function AppNavigator() {
  const { colors, isDarkMode } = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: isDarkMode,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
      }}
    >
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let IconComponent;

            switch (route.name) {
              case 'Accueil':
                IconComponent = Book;
                break;
              case 'Sourates':
                IconComponent = List;
                break;
              case 'Recherche':
                IconComponent = Search;
                break;
              case 'Favoris':
                IconComponent = Heart;
                break;
              case 'Parametres':
                IconComponent = Settings;
                break;
              default:
                IconComponent = Book;
            }

            return <IconComponent size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingBottom: Platform.OS === 'ios' ? 20 : 8,
            paddingTop: 8,
            height: Platform.OS === 'ios' ? 85 : 65,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="Accueil" 
          component={AccueilStack}
          options={{ tabBarLabel: 'Accueil' }}
        />
        <Tab.Screen 
          name="Sourates" 
          component={SouratesStack}
          options={{ tabBarLabel: 'Sourates' }}
        />
        <Tab.Screen 
          name="Recherche" 
          component={RechercheStack}
          options={{ tabBarLabel: 'Recherche' }}
        />
        <Tab.Screen 
          name="Favoris" 
          component={FavorisStack}
          options={{ tabBarLabel: 'Favoris' }}
        />
        <Tab.Screen 
          name="Parametres" 
          component={ParametresScreen}
          options={{ 
            tabBarLabel: 'Paramètres',
            headerShown: true,
            headerStyle: {
              backgroundColor: colors.card,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: colors.text,
            headerTitleStyle: {
              fontWeight: '600',
              fontSize: 18,
            },
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}