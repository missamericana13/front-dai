import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function SinConexion() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/saberesysabores.png')} // Usá tu propia imagen o eliminá esta línea
        style={{ width: 150, height: 150, marginBottom: 20 }}
        resizeMode="contain"
      />
      <Text style={styles.text}>Sin conexión a internet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2B5399',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
