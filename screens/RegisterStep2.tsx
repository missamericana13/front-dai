import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/authContext';

export default function RegisterStep2() {
    const router = useRouter();
    const { email, alias } = useLocalSearchParams<{ email: string; alias: string }>();
    const { login, setUserRole } = useAuth();

    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [documento, setDocumento] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rol, setRol] = useState<'usuario' | 'alumno' | null>(null);

    const handleSubmit = async () => {
        if (!nombre || !apellido || !documento || !fechaNacimiento || !password || !confirmPassword || !rol) {
            Alert.alert('Faltan datos', 'Por favor completá todos los campos.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden.');
            return;
        }

        const newUser = {
            displayName: alias,
            email,
            photoURL: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        };

        await login(newUser);
        await setUserRole(rol);

        if (rol === 'usuario') {
            Alert.alert('Registro exitoso', 'Tu cuenta fue creada correctamente.');
            router.replace('/');
        } else {
            router.replace('./paymentrequired');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.container}>
                    <Text style={styles.title}>Completá tu registro</Text>

                    <Text style={styles.label}>Email</Text>
                    <TextInput value={email} editable={false} style={styles.inputDisabled} />

                    <Text style={styles.label}>Alias</Text>
                    <TextInput value={alias} editable={false} style={styles.inputDisabled} />

                    <Text style={styles.label}>Nombre</Text>
                    <TextInput value={nombre} onChangeText={setNombre} style={styles.input} />

                    <Text style={styles.label}>Apellido</Text>
                    <TextInput value={apellido} onChangeText={setApellido} style={styles.input} />

                    <Text style={styles.label}>N° de documento</Text>
                    <TextInput value={documento} onChangeText={setDocumento} style={styles.input} />

                    <Text style={styles.label}>Fecha de nacimiento (DD/MM/AAAA)</Text>
                    <TextInput value={fechaNacimiento} onChangeText={setFechaNacimiento} style={styles.input} />

                    <Text style={styles.label}>Contraseña</Text>
                    <TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />

                    <Text style={styles.label}>Confirmar contraseña</Text>
                    <TextInput value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry style={styles.input} />

                    <Text style={styles.label}>Rol</Text>
                    <View style={styles.rolesContainer}>
                        <TouchableOpacity
                            style={[styles.roleButton, rol === 'usuario' && styles.roleSelected]}
                            onPress={() => setRol('usuario')}
                        >
                            <Text style={[styles.roleText, rol === 'usuario' && styles.roleTextSelected]}>Usuario</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.roleButton, rol === 'alumno' && styles.roleSelected]}
                            onPress={() => setRol('alumno')}
                        >
                            <Text style={[styles.roleText, rol === 'alumno' && styles.roleTextSelected]}>Alumno</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                        <Text style={styles.submitButtonText}>Confirmar registro</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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
    label: {
        fontSize: 16,
        color: '#EDE5D8',
        marginTop: 10,
    },
    input: {
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 8,
        marginTop: 5,
    },
    inputDisabled: {
        backgroundColor: '#ddd',
        padding: 10,
        borderRadius: 8,
        marginTop: 5,
        color: '#555',
    },
    rolesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 16,
    },
    roleButton: {
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2B5399',
        backgroundColor: 'white',
        width: '48%',
        alignItems: 'center',
    },
    roleSelected: {
        backgroundColor: '#ff0000',
    },
    roleText: {
        color: '#2B5399',
        fontWeight: 'bold',
    },
    roleTextSelected: {
        color: 'white',
    },
    submitButton: {
        backgroundColor: '#EDE5D8',
        paddingVertical: 14,
        borderRadius: 8,
        marginTop: 20,
    },
    submitButtonText: {
        color: '#413E3E',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
