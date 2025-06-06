import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Modal, Pressable, Alert
} from 'react-native';
import { useAuth } from '../context/authContext';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MyProfile() {
  const { user } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.displayName || '');
  const [alias, setAlias] = useState(user?.alias || '');
  const [role, setRole] = useState<'alumno' | 'usuario'>(user?.rol?.toLowerCase() || 'usuario');
  const [previousRole, setPreviousRole] = useState<'alumno' | 'usuario'>(user?.rol?.toLowerCase() || 'usuario');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Avatar
  const [avatar, setAvatar] = useState(user?.photoURL || '');
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);

  useEffect(() => {
    if (role === 'alumno') {
      setPaymentMethod('Visa **** 4242'); // Placeholder temporal, podés cargar el método real aquí
      setRole('alumno');
      setPreviousRole('alumno');
    } else {
      setPaymentMethod(null);
      setRole('usuario');
      setPreviousRole('usuario');
    }
  }, [role]);

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Debes iniciar sesión para ver tu perfil.</Text>
      </View>
    );
  }

  // Elegir nueva imagen de perfil
  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setAvatar(`data:image/jpeg;base64,${result.assets[0].base64}`);
      setAvatarBase64(result.assets[0].base64); // solo base64 puro
    }
  };

  const handleEdit = () => setIsEditing(true);

  // Guardar cambios en el backend
  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No hay token de sesión');
        return;
      }
      // Solo enviar los campos que cambiaron
      const updateData: any = {};
      if (name !== user.displayName) updateData.nombre = name;
      if (role !== user.rol?.toLowerCase()) updateData.rol = role;
      if (avatarBase64) updateData.avatar = avatarBase64;
      if (role === 'alumno' && paymentMethod) updateData.metodoPago = paymentMethod;

      // Si el usuario es alumno, agregar datos extra si existen en AsyncStorage
      if (role === 'alumno') {
        const numeroTarjeta = await AsyncStorage.getItem('alumno_numeroTarjeta');
        const dniFrente = await AsyncStorage.getItem('alumno_dniFrente');
        const dniFondo = await AsyncStorage.getItem('alumno_dniFondo');
        const tramite = await AsyncStorage.getItem('alumno_tramite');
        if (numeroTarjeta && dniFrente && dniFondo && tramite) {
          updateData.numeroTarjeta = numeroTarjeta;
          updateData.dniFrente = dniFrente;
          updateData.dniFondo = dniFondo;
          updateData.tramite = tramite;
        }
      }

      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        return;
      }

      const res = await fetch(`http://192.168.1.31:8080/api/usuarios/${user.id}/perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        // Limpia los datos temporales de alumno si existen
        await AsyncStorage.multiRemove([
          'alumno_numeroTarjeta',
          'alumno_dniFrente',
          'alumno_dniFondo',
          'alumno_tramite'
        ]);
        setIsEditing(false);
        setPreviousRole(role);
        setAvatarBase64(null);
        Alert.alert(
          'Cambios aplicados',
          'Tu perfil fue actualizado correctamente.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/'),
            },
          ]
        );
      } else {
        const msg = await res.text();
        Alert.alert('Error al actualizar', msg);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo conectar al servidor.');
    }
  };

  const toggleRoleModal = () => setShowRoleModal(!showRoleModal);

  const handleAlumnoPress = () => {
    Alert.alert(
      'Atención',
      'Luego de cambiar de Usuario a Alumno no podrás volver a ser Usuario. ¿Deseás continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: async () => {
            setRole('alumno');
            toggleRoleModal();
            // Si faltan datos de alumno, redirige a completar
            const numeroTarjeta = await AsyncStorage.getItem('alumno_numeroTarjeta');
            const dniFrente = await AsyncStorage.getItem('alumno_dniFrente');
            const dniFondo = await AsyncStorage.getItem('alumno_dniFondo');
            const tramite = await AsyncStorage.getItem('alumno_tramite');
            if (!numeroTarjeta || !dniFrente || !dniFondo || !tramite) {
              router.push('/paymentrequired');
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
            style={styles.avatar}
          />
          {isEditing && (
            <TouchableOpacity onPress={pickAvatar}>
              <Text style={styles.changePhoto}>Cambiar imagen</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={name}
            onChangeText={setName}
            editable={isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Alias</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={alias}
            onChangeText={setAlias}
            editable={false} // No editable por seguridad
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Rol</Text>
          <TouchableOpacity
            // Si el rol es alumno, no permite abrir el modal
            onPress={isEditing && role !== 'alumno' ? toggleRoleModal : undefined}
            style={[
              styles.input,
              styles.roleSelector,
              (!isEditing || role === 'alumno') && styles.disabledInput
            ]}
            activeOpacity={role === 'alumno' ? 1 : 0.2}
          >
            <Text style={{ color: isEditing && role !== 'alumno' ? '#000' : '#888' }}>
              {role === 'usuario' ? 'Usuario' : 'Alumno'}
            </Text>
          </TouchableOpacity>
        </View>

        {role === 'alumno' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Método de pago</Text>
            <TextInput
              style={[styles.input, isEditing ? null : styles.disabledInput]}
              value={paymentMethod || ''}
              onChangeText={setPaymentMethod}
              editable={isEditing}
              placeholder="Ingresá tu método de pago"
            />
          </View>
        )}

        <Modal visible={showRoleModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Selecciona un rol</Text>
              <Pressable onPress={() => {
                setRole('usuario');
                toggleRoleModal();
              }}>
                <Text style={styles.modalOption}>Usuario</Text>
              </Pressable>
              <Pressable onPress={handleAlumnoPress}>
                <Text style={styles.modalOption}>Alumno</Text>
              </Pressable>
              <Pressable onPress={toggleRoleModal}>
                <Text style={[styles.modalOption, { color: 'red' }]}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {!isEditing ? (
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Text style={styles.buttonText}>Editar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.buttonText}>Guardar cambios</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE5D8',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EDE5D8',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 8,
  },
  changePhoto: {
    color: '#2B5399',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    color: '#2B5399',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  roleSelector: {
    justifyContent: 'center',
  },
  disabledInput: {
    backgroundColor: '#ccc',
    color: '#888',
  },
  editButton: {
    marginTop: 20,
    backgroundColor: '#2B5399',
    padding: 14,
    borderRadius: 10,
    width: '100%',
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 10,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 40,
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalOption: {
    fontSize: 18,
    padding: 10,
  },
});