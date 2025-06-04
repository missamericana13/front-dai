// app/_layout.tsx
import { Slot } from 'expo-router';
import { AuthProvider } from '../context/authContext'; // asegúrate que este path sea correcto
import React from 'react';
import { RecipeProvider } from '../context/recipeContext';

export default function RootLayout() {
  return (
    <RecipeProvider>
    <AuthProvider>
      <Slot />
    </AuthProvider>
    </RecipeProvider>
  );
}
