import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Modal, Pressable
} from 'react-native';
import { useAuth } from '../context/authContext';
import { useRouter } from 'expo-router';

export default function MyProfile() {
  const { user } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.displayName || '');
  const [alias, setAlias] = useState('');
  const [extra, setExtra] = useState('');
  const [role, setRole] = useState<'alumno' | 'usuario'>('usuario');
  const [previousRole, setPreviousRole] = useState<'alumno' | 'usuario'>('usuario');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
  // Usamos el rol real del contexto para inicializar el estado
  if (role === 'alumno') {
    setPaymentMethod('Visa **** 4242'); // Placeholder temporal
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

  const handleEdit = () => setIsEditing(true);

  const handleSave = () => {
    setIsEditing(false);
    setPreviousRole(role);
  };

  const toggleRoleModal = () => setShowRoleModal(!showRoleModal);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: user.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
            style={styles.avatar}
          />
          {isEditing && (
            <TouchableOpacity>
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
            editable={isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Información adicional</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={extra}
            onChangeText={setExtra}
            editable={isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Rol</Text>
          <TouchableOpacity
            onPress={isEditing ? toggleRoleModal : undefined}
            style={[styles.input, styles.roleSelector, !isEditing && styles.disabledInput]}
          >
            <Text style={{ color: isEditing ? '#000' : '#888' }}>
              {role === 'usuario' ? 'Usuario' : 'Alumno'}
            </Text>
          </TouchableOpacity>
        </View>

        {role === 'alumno' && paymentMethod && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Método de pago</Text>
            <View style={[styles.input, styles.disabledInput]}>
              <Text>{paymentMethod}</Text>
            </View>
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
              <Pressable onPress={() => {
                setRole('alumno');
                toggleRoleModal();
                if (!paymentMethod && previousRole === 'usuario') {
                  router.push('/paymentrequired'); // ✅ redirección inmediata al seleccionar 'alumno'
                }
              }}>
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
