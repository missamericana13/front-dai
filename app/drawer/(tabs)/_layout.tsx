import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export const unstable_settings = {
  initialRouteName: 'explore',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        // Forzamos ocultar header y tabBar en 'add'
        if (route.name === 'add') {
          return {
            headerShown: false,
            tabBarStyle: { display: 'none' },
          };
        }
        return {
          //VERIFICAS ACA, ANTES ERA TRUE
          headerShown: false,
          tabBarStyle: { backgroundColor: '#2B5399', borderTopColor: '#2B5399' },
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#EDE5D8',
          headerStyle: { backgroundColor: '#2B5399' },
          headerTintColor: '#fff',
        };
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Agregar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          href: null, // ✅ oculta este tab pero permite usar el layout con la barra
        }}
      />
      <Tabs.Screen
    name="recipes"
    options={{
      href: null, // ✅ oculta este tab pero permite usar el layout con la barra
    }}
  />
  <Tabs.Screen
    name="recipedetail"
    options={{
      href: null, // ✅ oculta este tab pero permite usar el layout con la barra
    }}
  />
  <Tabs.Screen
    name="myprofile"
    options={{
      href: null, // ✅ oculta este tab pero permite usar el layout con la barra
    }}
  />
  <Tabs.Screen
    name="myrecipes"
    options={{
      href: null, // ✅ oculta este tab pero permite usar el layout con la barra
    }}
  />

    <Tabs.Screen
    name="mycourses"
    options={{
      href: null, // ✅ oculta este tab pero permite usar el layout con la barra
    }}
  />

  <Tabs.Screen
    name="coursesdetail"
    options={{
      href: null, // ✅ oculta este tab pero permite usar el layout con la barra
    }}
  />

  <Tabs.Screen
    name="favourites"
    options={{
      href: null, // ✅ oculta este tab pero permite usar el layout con la barra
    }}
  />

  <Tabs.Screen
    name="accessrequired"
    options={{
      href: null, // ✅ oculta este tab pero permite usar el layout con la barra
    }}
  />

    </Tabs>
  );
}