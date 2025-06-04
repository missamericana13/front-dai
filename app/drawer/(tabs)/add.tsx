import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../../context/authContext'; // Ajustá el path si es diferente
import AccessRequired from '../../../screens/AccessRequired';
import Add from '../../../screens/Add';
import { useNavigation } from 'expo-router';


export const screenOptions = {
  headerShown: false,
  tabBarStyle: { display: 'none' },
};

export default function AddTab() {
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  

  useEffect(() => {
    // Simulamos chequeo inicial
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2B5399" />
      </View>
    );
  }

  // Si hay usuario, mostramos pantalla para agregar receta
  if (user) {
    return <Add />;
  }

  // Si no hay sesión, mostramos pantalla de acceso requerido
  return <AccessRequired />;
}
