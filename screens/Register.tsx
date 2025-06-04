import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Register() {
  const [email, setEmail] = useState('');
  const [alias, setAlias] = useState('');

  const handleRegister = async () => {
    if (!email || !alias) {
      Alert.alert('Campos incompletos', 'Por favor completá todos los campos.');
      return;
    }

    const aliasExists = await checkAliasExists(alias);

    if (aliasExists) {
      const suggestions = await generateAvailableAliases(alias);

      Alert.alert(
        'Alias en uso',
        'Ese alias ya está registrado. Probá con alguno de estos:',
        [
          ...suggestions.map((s) => ({
            text: s,
            onPress: () => setAlias(s),
          })),
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
      return;
    }

    router.push({
      pathname: './verificationcode',
      params: { email, alias },
    });
  };

  // Simula una consulta a la API
  const checkAliasExists = async (alias: string) => {
    const takenAliases = ['juanito', 'maria123', 'cocinero']; // Simulados
    return takenAliases.includes(alias.toLowerCase());
  };

  // Genera sugerencias disponibles
  const generateAvailableAliases = async (alias: string) => {
    const candidates = [
      `${alias}123`,
      `${alias}_1`,
      `${alias}.ok`,
      `${alias}${Math.floor(Math.random() * 1000)}`,
    ];

    const taken = ['juanito123']; // Simulados
    return candidates.filter((a) => !taken.includes(a));
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
