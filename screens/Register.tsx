import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Register() {
  const [email, setEmail] = useState('');
  const [alias, setAlias] = useState('');

  // Limpiar datos temporales de registro al entrar a la pantalla
  useEffect(() => {
    AsyncStorage.multiRemove([
      'register_email',
      'register_alias',
      'register_code',
      'register_nombre',
      'register_apellido',
      'register_documento',
      'register_password',
      'register_confirmPassword',
      'register_rol',
      'alumno_numeroTarjeta',
      'alumno_dniFrente',
      'alumno_dniFondo',
      'alumno_tramite'
    ]);
    setEmail('');
    setAlias('');
  }, []);

  // Consulta real al backend si el alias existe
  const checkAliasExists = async (alias: string) => {
    try {
      const res = await fetch(`http://192.168.1.31:8080/api/usuarios/sugerir-alias?alias=${encodeURIComponent(alias)}`);
      if (!res.ok) return false;
      const sugerencias = await res.json();
      // Si el alias original está en sugerencias, está en uso
      return sugerencias.includes(alias);
    } catch {
      return false; // Si hay error, asumimos que no existe
    }
  };

  // Obtiene sugerencias reales del backend
  const generateAvailableAliases = async (alias: string) => {
    try {
      const res = await fetch(`http://192.168.1.31:8080/api/usuarios/sugerir-alias?alias=${encodeURIComponent(alias)}`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  };

  const handleRegister = async () => {
    if (!email || !alias) {
      Alert.alert('Campos incompletos', 'Por favor completá todos los campos.');
      return;
    }

    const aliasExists = await checkAliasExists(alias);

    if (!aliasExists) {
      // Navega inmediatamente
      router.push('/verificationcode');
      try {
        const res = await fetch(`http://192.168.1.31:8080/api/usuarios/registro/iniciar?email=${encodeURIComponent(email)}&alias=${encodeURIComponent(alias)}`, {
          method: 'POST'
        });
        if (!res.ok) {
          const error = await res.text();
          Alert.alert('Error', error);
          return;
        }
        // Guarda email y alias para el segundo paso
        await AsyncStorage.setItem('register_email', email);
        await AsyncStorage.setItem('register_alias', alias);
      } catch {
        Alert.alert('Error', 'No se pudo conectar al servidor.');
      }
    } else {
      // Alias en uso, muestra sugerencias
      const suggestions = await generateAvailableAliases(alias);

      Alert.alert(
        'Alias en uso',
        'Ese alias ya está registrado. Probá con alguno de estos:',
        [
          ...suggestions.map((s: string) => ({
            text: s,
            onPress: () => setAlias(s),
          })),
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Registrarse</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Alias"
          value={alias}
          onChangeText={setAlias}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Confirmar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/drawer')}>
          <Text style={styles.link}>Volver</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.cc}>Saberes y Sabores</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    backgroundColor: '#2B5399',
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 64,
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