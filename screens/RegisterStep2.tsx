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
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const DEFAULT_AVATAR = require('../assets/images/default-avatar.png');

export default function RegisterStep2() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [alias, setAlias] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [documento, setDocumento] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rol, setRol] = useState('usuario');
    const [codigo, setCodigo] = useState('');
    const [avatar, setAvatar] = useState<string | null>(null);
    const [alumnoData, setAlumnoData] = useState({
        numeroTarjeta: '',
        dniFrente: '',
        dniFondo: '',
        tramite: ''
    });

    useEffect(() => {
        // PEDIR PERMISO PARA GALERÍA AL INICIAR
        (async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso requerido', 'Necesitás dar permiso para acceder a tus fotos.');
            }
        })();

        const loadData = async () => {
            setEmail((await AsyncStorage.getItem('register_email')) || '');
            setAlias((await AsyncStorage.getItem('register_alias')) || '');
            setCodigo((await AsyncStorage.getItem('register_code')) || '');
            setNombre((await AsyncStorage.getItem('register_nombre')) || '');
            setApellido((await AsyncStorage.getItem('register_apellido')) || '');
            setDocumento((await AsyncStorage.getItem('register_documento')) || '');
            setPassword((await AsyncStorage.getItem('register_password')) || '');
            setConfirmPassword((await AsyncStorage.getItem('register_confirmPassword')) || '');
            setRol((await AsyncStorage.getItem('register_rol')) || 'usuario');

            // Leer datos de alumno si existen
            const numeroTarjeta = await AsyncStorage.getItem('alumno_numeroTarjeta');
            const dniFrente = await AsyncStorage.getItem('alumno_dniFrente');
            const dniFondo = await AsyncStorage.getItem('alumno_dniFondo');
            const tramite = await AsyncStorage.getItem('alumno_tramite');
            setAlumnoData({
                numeroTarjeta: numeroTarjeta || '',
                dniFrente: dniFrente || '',
                dniFondo: dniFondo || '',
                tramite: tramite || ''
            });

            // Leer avatar si existe
            const avatarSaved = await AsyncStorage.getItem('register_avatar');
            setAvatar(avatarSaved || null);
        };
        loadData();
    }, []);

    const pickAvatar = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            base64: true,
            quality: 0.7,
        });
        console.log('RESULT PICKER:', result);
        if (!result.canceled && result.assets && result.assets[0].base64) {
            setAvatar(result.assets[0].base64);
            await AsyncStorage.setItem('register_avatar', result.assets[0].base64);
        } else {
            Alert.alert('Error', 'No se pudo obtener la imagen en base64.');
        }
    };

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

        if (
            rol === 'alumno' &&
            (!alumnoData.numeroTarjeta || !alumnoData.dniFrente || !alumnoData.dniFondo || !alumnoData.tramite)
        ) {
            await AsyncStorage.setItem('register_nombre', nombre);
            await AsyncStorage.setItem('register_apellido', apellido);
            await AsyncStorage.setItem('register_documento', documento);
            await AsyncStorage.setItem('register_password', password);
            await AsyncStorage.setItem('register_confirmPassword', confirmPassword);
            await AsyncStorage.setItem('register_rol', rol);
            if (avatar) await AsyncStorage.setItem('register_avatar', avatar);
            router.push('/paymentrequired');
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
                rol: rol.toUpperCase(),
                avatar: avatar // base64 puro o null
            },
            alumno: rol === 'alumno'
                ? {
                    numeroTarjeta: alumnoData.numeroTarjeta,
                    dniFrente: alumnoData.dniFrente,
                    dniFondo: alumnoData.dniFondo,
                    tramite: alumnoData.tramite
                }
                : undefined
        };

        // LOG para depuración
        console.log('RegistroRequest:', JSON.stringify(registroRequest, null, 2));

        try {
            const res = await fetch('http://192.168.1.31:8080/api/usuarios/registro/completar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registroRequest)
            });

            const data = await res.text();

            if (!res.ok) {
                Alert.alert('Error', data);
                return;
            }

            await AsyncStorage.multiRemove([
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
                'alumno_tramite',
                'register_avatar'
            ]);

            // Login automático
            const loginRes = await fetch('http://192.168.1.31:8080/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: email,
                    password
                })
            });

            if (!loginRes.ok) {
                const errorText = await loginRes.text();
                console.log('Login falló con status:', loginRes.status);
                console.log('Error:', errorText);

                Alert.alert('Registro exitoso', 'Te registraste correctamente.');
                router.replace('/login'); // redirigir a login manual
                return;
            }

            const loginData = await loginRes.json();

            await AsyncStorage.setItem('token', loginData.token);
            await AsyncStorage.setItem('user_email', email);
            await AsyncStorage.setItem('user_alias', alias);

            await new Promise((r) => setTimeout(r, 500));

            Alert.alert(
                '¡Registro exitoso!',
                'Tu cuenta fue creada correctamente. Ahora vas a ser redirigido al inicio.',
                [
                    {
                        text: 'OK',
                        onPress: async () => {
                            await AsyncStorage.setItem('registro_exitoso', '1');
                            router.replace('/');
                        }
                    }
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

                    <TouchableOpacity style={styles.avatarContainer} onPress={pickAvatar}>
                        <Image
                            source={avatar ? { uri: `data:image/jpeg;base64,${avatar}` } : DEFAULT_AVATAR}
                            style={styles.avatar}
                        />
                        <Text style={styles.avatarText}>
                            {avatar ? 'Cambiar avatar' : 'Elegir avatar'}
                        </Text>
                    </TouchableOpacity>

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
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#eee',
        marginBottom: 8,
    },
    avatarText: {
        color: '#2B5399',
        textDecorationLine: 'underline',
        fontSize: 14,
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