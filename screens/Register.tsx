import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Register() {
  const [email, setEmail] = useState('');
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);

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

  const checkEmailExists = async (email: string) => {
    try {
      const res = await fetch(`http://192.168.1.31:8080/api/usuarios/existe-email?email=${encodeURIComponent(email)}`);
      if (!res.ok) return false;
      const data = await res.json();
      return data?.registrado === true;
    } catch {
      return false;
    }
  };

  const checkAliasExists = async (alias: string) => {
    try {
      const res = await fetch(`http://192.168.1.31:8080/api/usuarios/sugerir-alias?alias=${encodeURIComponent(alias)}`);
      if (!res.ok) return false;
      const sugerencias = await res.json();
      return sugerencias.includes(alias);
    } catch {
      return false;
    }
  };

  const generateAvailableAliases = async (alias: string) => {
    try {
      const res = await fetch(`http://192.168.1.31:8080/api/usuarios/sugerir-alias?alias=${encodeURIComponent(alias)}`);
      if (!res.ok) return [];
      let sugerencias = await res.json();
      sugerencias = sugerencias.filter((s: string) => s !== alias);
      for (let i = sugerencias.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sugerencias[i], sugerencias[j]] = [sugerencias[j], sugerencias[i]];
      }
      return sugerencias.slice(0, 5);
    } catch {
      return [];
    }
  };

  const handleRegister = async () => {
    if (!email || !alias) {
      Alert.alert('Campos incompletos', 'Por favor completá todos los campos.');
      return;
    }

    setLoading(true);

    if (await checkEmailExists(email)) {
      setLoading(false);
      Alert.alert(
        'Email en uso',
        'Ese email ya está registrado. Si olvidaste tu clave podés recuperarla desde la pantalla de inicio de sesión.'
      );
      return;
    }

    if (await checkAliasExists(alias)) {
      setLoading(false);
      const suggestions = await generateAvailableAliases(alias);
      Alert.alert(
        'Alias en uso',
        suggestions.length > 0
          ? 'Ese alias ya está registrado. Probá con alguno de estos:'
          : 'Ese alias ya está registrado. Probá con otro.',
        [
          ...suggestions.map((s: string) => ({
            text: s,
            onPress: () => setAlias(s),
          })),
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
      return;
    }

    try {
      const res = await fetch(
        `http://192.168.1.31:8080/api/usuarios/registro/iniciar?email=${encodeURIComponent(email)}&alias=${encodeURIComponent(alias)}`,
        { method: 'POST' }
      );
      if (!res.ok) {
        const error = await res.text();
        setLoading(false);
        Alert.alert('Error', error);
        return;
      }
      await AsyncStorage.setItem('register_email', email);
      await AsyncStorage.setItem('register_alias', alias);
      setLoading(false);
      router.push('/verificationcode');
    } catch {
      setLoading(false);
      Alert.alert('Error', 'No se pudo conectar al servidor.');
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
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Alias"
          value={alias}
          onChangeText={setAlias}
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Procesando...' : 'Confirmar'}</Text>
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