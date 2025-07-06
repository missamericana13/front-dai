import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function LiberarEmail() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Email en uso</Text>
      <Text style={styles.message}>
        Este correo ya fue utilizado en un intento de registro que no se completó. Para continuar, por favor contactanos a:
      </Text>
      <Text style={styles.email}>saberesysabores@gmail.com</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/register')}>
        <Text style={styles.buttonText}>Volver al registro</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE5D8',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    color: '#2B5399',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#2B5399',
    marginBottom: 12,
  },
  email: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B5399',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#2B5399',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
