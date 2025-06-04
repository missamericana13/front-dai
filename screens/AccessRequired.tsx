// screens/AccessRequired.tsx
import { useNavigation } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AccessRequired() {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/images/saberesysabores.png')} // Asegúrate de tener tu logo aquí
                style={styles.logo}
                resizeMode="contain"
            />
            <Text style={styles.message}>Debes iniciar sesión para acceder a esta funcionalidad.</Text>

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('login' as never)}>
                <Text style={styles.buttonText}>Iniciar Sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('register' as never)}>
                <Text style={styles.buttonText}>Registrarse</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>Volver</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EDE5D8',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    logo: {
        width: 160,
        height: 160,
        marginBottom: 32,
    },
    message: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 24,
        color: '#333',
    },
    button: {
        backgroundColor: '#2B5399',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        marginVertical: 8,
        width: '80%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#EDE5D8',
        textAlign: 'center',
        fontWeight: '600',
    },
    backButton: {
        marginTop: 24,
        color:'#EDE5D8,' // boton volver
    },
    backText: {
        fontSize: 14,
        color: '#ffffff',
        textDecorationLine: 'underline',
    },
});
