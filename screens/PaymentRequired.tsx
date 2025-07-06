import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

export default function PaymentRequired() {
  const router = useRouter();

  const [cardNumber, setCardNumber] = useState('');
  const [dniFrente, setDniFrente] = useState<string | null>(null);
  const [dniFondo, setDniFondo] = useState<string | null>(null);
  const [tramite, setTramite] = useState('');

  const cleanBase64 = (dataUrl: string | null) => {
    if (!dataUrl) return null;
    return dataUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
  };

  const pickImage = async (setter: (img: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      setter(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleNext = async () => {
    if (!cardNumber || !dniFrente || !dniFondo || !tramite) {
      Alert.alert('Faltan datos', 'Por favor completá todos los campos.');
      return;
    }
    await AsyncStorage.setItem('alumno_numeroTarjeta', cardNumber);
    await AsyncStorage.setItem('alumno_dniFrente', cleanBase64(dniFrente) ?? '');
    await AsyncStorage.setItem('alumno_dniFondo', cleanBase64(dniFondo) ?? '');
    await AsyncStorage.setItem('alumno_tramite', tramite);

    const isFromProfile = await AsyncStorage.getItem('fromProfile');
  if (isFromProfile === 'true') {
    await AsyncStorage.removeItem('fromProfile');
    router.replace('/drawer/myprofile');
  } else {
    router.push('/registerstep2');
  }
};

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Datos de Alumno</Text>

        <TextInput
          style={styles.input}
          placeholder="Número de tarjeta"
          keyboardType="numeric"
          value={cardNumber}
          onChangeText={setCardNumber}
        />

        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => pickImage((img) => setDniFrente(img))}
        >
          <Text style={styles.buttonText}>
            {dniFrente ? 'DNI Frente seleccionado' : 'Seleccionar foto DNI Frente'}
          </Text>
        </TouchableOpacity>
        {dniFrente && (
          <Image
            source={{ uri: dniFrente }}
            style={{ width: 120, height: 80, alignSelf: 'center', marginBottom: 10, borderRadius: 8 }}
          />
        )}

        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => pickImage((img) => setDniFondo(img))}
        >
          <Text style={styles.buttonText}>
            {dniFondo ? 'DNI Dorso seleccionado' : 'Seleccionar foto DNI Dorso'}
          </Text>
        </TouchableOpacity>
        {dniFondo && (
          <Image
            source={{ uri: dniFondo }}
            style={{ width: 120, height: 80, alignSelf: 'center', marginBottom: 10, borderRadius: 8 }}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="N° de trámite"
          keyboardType="numeric"
          value={tramite}
          onChangeText={setTramite}
        />

        <TouchableOpacity style={styles.button} onPress={handleNext}>
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
    padding: 20,
    backgroundColor: '#2B5399',
    flexGrow: 1,
  },
  container: {
    paddingBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#EDE5D8',
    marginBottom: 24,
    textAlign: 'center',
    marginTop: 24,
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
    marginBottom: 10,
  },
  imageButton: {
    backgroundColor: '#EDE5D8',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 5,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#EDE5D8',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#413E3E',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    color: '#EDE5D8',
    textAlign: 'center',
    marginTop: 15,
    textDecorationLine: 'underline',
  },
  cc: {
    color: '#EDE5D8',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 18,
    fontStyle: 'italic',
  },
});