import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function Inicio() {
  const router = useRouter();

  useEffect(() => {
    const prepare = async () => {
      // Simulá una carga de recursos o datos aquí si es necesario
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Ocultá el splash screen y navegá a la pantalla principal
      await SplashScreen.hideAsync();
      router.replace('/drawer');
    };

    prepare();
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/saberesysabores.png')}
        style={{ width: 200, height: 200, marginBottom: 20 }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2B5399',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#2B5399',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
