import React from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SinConexion({ onRetry, loading }: { onRetry: () => void; loading?: boolean }) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Image
          source={require('../assets/images/saberesysabores.png')}
          style={{ width: 150, height: 150, marginBottom: 20 }}
          resizeMode="contain"
        />
        <Text style={styles.text}>Sin conexión a internet</Text>

        <TouchableOpacity style={styles.button} onPress={onRetry} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#2B5399" />
          ) : (
            <Text style={styles.buttonText}>Reintentar</Text>
          )}
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
    justifyContent: 'space-between',
    padding: 20,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // hace que el contenido se centre verticalmente
  },
  text: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#EDE5D8',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  buttonText: {
    color: '#413E3E',
    fontWeight: 'bold',
    fontSize: 10,
  },
  cc: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 10,
    fontFamily: 'aesthetic moments',
    fontStyle: 'italic',
  },
});