import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ValidationScreen() {
  const [code, setCode] = useState('');

  const handleConfirm = async () => {
    await AsyncStorage.setItem('register_code', code);
    router.push('/registerstep2');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Validar Código</Text>

        <TextInput
          style={styles.input}
          placeholder="Ingrese el código de validación"
          keyboardType="numeric"
          value={code}
          onChangeText={setCode}
        />

        <TouchableOpacity style={styles.button} onPress={handleConfirm}>
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
