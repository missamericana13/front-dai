// screens/PaymentRequired.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/authContext';

export default function PaymentRequired() {
  const router = useRouter();
  const { setUserRole } = useAuth();

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [securityCode, setSecurityCode] = useState('');

  const handleNext = async () => {
    // Aquí se simula el guardado del método de pago
    await setUserRole('alumno');
    router.push('./verifyidentity');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Método de Pago</Text>

        <TextInput
          style={styles.input}
          placeholder="Número de tarjeta"
          keyboardType="numeric"
          value={cardNumber}
          onChangeText={setCardNumber}
        />

        <TextInput
          style={styles.input}
          placeholder="Nombre del titular"
          value={cardName}
          onChangeText={setCardName}
        />

        <TextInput
          style={styles.input}
          placeholder="Vencimiento (MM/AA)"
          value={expiry}
          onChangeText={setExpiry}
        />

        <TextInput
          style={styles.input}
          placeholder="Código de seguridad"
          keyboardType="numeric"
          secureTextEntry
          value={securityCode}
          onChangeText={setSecurityCode}
        />

        <TouchableOpacity style={styles.button} onPress={() => router.push('./verifyidentity')}>
          <Text style={styles.buttonText}>Siguiente</Text>
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
