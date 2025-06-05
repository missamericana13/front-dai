import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterStep2() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [alias, setAlias] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [documento, setDocumento] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rol, setRol] = useState<'usuario' | 'alumno' | null>(null);
    const [codigo, setCodigo] = useState('');

    useEffect(() => {
        const loadData = async () => {
            setEmail((await AsyncStorage.getItem('register_email')) || '');
            setAlias((await AsyncStorage.getItem('register_alias')) || '');
            setCodigo((await AsyncStorage.getItem('register_code')) || '');
        };
        loadData();
    }, []);

    const handleSubmit = async () => {
        if (!email || !alias || !codigo) {
            Alert.alert('Error', 'Faltan datos de email, alias o código. Volvé a iniciar el registro.');
            return;
        }
        if (!nombre || !apellido || !documento || !password || !confirmPassword || !rol) {
            Alert.alert('Faltan datos', 'Por favor completá todos los campos.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden.');
            return;
        }

        const registroRequest = {
            email,
            codigo,
            esAlumno: rol === 'alumno',
            usuario: {
                mail: email,
                nickname: alias,
                nombre: `${nombre} ${apellido}`,
                contrasena: password,
                rol: rol.toUpperCase()
            },
            alumno: rol === 'alumno'
                ? {
                    numeroTarjeta: "123456789",
                    dniFrente: "base64img",
                    dniFondo: "base64img",
                    tramite: "123456"
                }
                : undefined
        };

        try {
            const res = await fetch('http://localhost:8080/api/usuarios/registro/completar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registroRequest)
            });
            const data = await res.text();
            if (!res.ok) {
                Alert.alert('Error', data);
                return;
            }
            await AsyncStorage.multiRemove(['register_email', 'register_alias', 'register_code']);
            Alert.alert(
            '¡Registro exitoso!',
            'Tu cuenta fue creada correctamente. Ahora podés iniciar sesión.',
            [
                {
                    text: 'OK',
                    onPress: () => {
                        router.replace('/');
                    },
                },
            ]
        );
        } catch (err) {
            Alert.alert('Error', 'No se pudo conectar al servidor.');
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