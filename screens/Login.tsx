import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/authContext'; // Asegurate que esta ruta es correcta

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth(); // 👈 usamos el contexto

  const handleLogin = () => {
    const validEmail = 'test@email.com';
    const validPassword = '1234';

    if (email === validEmail && password === validPassword) {
      setError('');

      // Simular usuario con datos
      const userData = {
        displayName: 'Juan Pérez',
        photoURL: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        email: validEmail,
        nombre: 'Juan',
        apellido: 'Pérez',
      };

      Alert.alert(
        '¿Guardar datos?',
        '¿Deseás guardar tus datos para próximos ingresos?',
        [
          {
            text: 'No',
            onPress: () => {
              login(userData); // 👈 actualiza el contexto
              router.replace('/drawer/(tabs)');
            },
          },
          {
            text: 'Sí',
            onPress: () => {
              // Acá podrías guardar en SecureStore o AsyncStorage
              login(userData); // 👈 actualiza el contexto
              router.replace('/drawer/(tabs)');
            },
          },
        ]
      );
    } else {
      setError('Email o contraseña incorrectos');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Email / Alias"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Iniciar sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/recover')}>
        <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={[styles.link, { marginTop: 16 }]}>
          ¿No tenés cuenta? Registrate
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/drawer')}>
        <Text style={styles.link}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.cc}>Saberes y Sabores</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2B5399',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#ffffff',
  },
  input: {
    width: '100%',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: 'white',
  },
  error: {
    color: 'red',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  button: {
    width: '100%',
    backgroundColor: '#EDE5D8',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 16,
    marginTop: 15,
  },
  buttonText: {
    color: '#413E3E',
    textAlign: 'center',
    fontWeight: '600',
  },
  link: {
    fontSize: 14,
    color: '#ffffff',
    textDecorationLine: 'underline',
    marginTop: 5,
  },
  cc: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 25,
    fontFamily: 'aesthetic moments',
    fontStyle: 'italic',
  },
});
