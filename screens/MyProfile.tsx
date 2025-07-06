import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Modal, Alert, SafeAreaView
} from 'react-native';
import { useAuth } from '../context/authContext';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function MyProfile() {
  const { user, refreshUserRole } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.displayName || '');
  const [alias, setAlias] = useState(user?.alias || '');
  const [role, setRole] = useState<'alumno' | 'usuario'>(user?.rol?.toLowerCase() as 'alumno' | 'usuario' || 'usuario');
  const [previousRole, setPreviousRole] = useState<'alumno' | 'usuario'>(user?.rol?.toLowerCase() as 'alumno' | 'usuario' || 'usuario');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAlumnoData, setShowAlumnoData] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [dniFrente, setDniFrente] = useState('');
  const [dniFondo, setDniFondo] = useState('');
  const [tramite, setTramite] = useState('');
  const [avatar, setAvatar] = useState(user?.photoURL || '');
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);

  useEffect(() => {
    if (role === 'alumno') {
      loadAlumnoData();
    }
  }, [role]);

  const loadAlumnoData = async () => {
    try {
      const savedCardNumber = await AsyncStorage.getItem('alumno_numeroTarjeta') || '';
      const savedDniFrente = await AsyncStorage.getItem('alumno_dniFrente') || '';
      const savedDniFondo = await AsyncStorage.getItem('alumno_dniFondo') || '';
      const savedTramite = await AsyncStorage.getItem('alumno_tramite') || '';
      
      setCardNumber(savedCardNumber);
      setDniFrente(savedDniFrente);
      setDniFondo(savedDniFondo);
      setTramite(savedTramite);

      if (!savedCardNumber && user?.rol?.toLowerCase() === 'alumno') {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          try {
            const response = await fetch(`http://192.168.1.31:8080/api/alumnos/por-usuario/${user.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            if (response.ok) {
              const alumnoData = await response.json();
              setCardNumber(alumnoData.numeroTarjeta || '');
              setTramite(alumnoData.tramite || '');
            }
          } catch (error) {
            console.log('No se pudieron cargar datos de alumno desde el backend');
          }
        }
      }
    } catch (error) {
      console.error('Error loading alumno data:', error);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="person-circle-outline" size={64} color="#ccc" />
          <Text style={styles.message}>Debes iniciar sesión para ver tu perfil.</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setAvatar(`data:image/jpeg;base64,${result.assets[0].base64}`);
      setAvatarBase64(result.assets[0].base64);
    }
  };

  const pickImage = async (setter: (value: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.base64) {
      setter(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const cleanBase64 = (base64String: string): string => {
    return base64String.replace(/^data:image\/[a-z]+;base64,/, '');
  };

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setIsEditing(false);
    setName(user?.displayName || '');
    setRole(previousRole);
    setAvatar(user?.photoURL || '');
    setAvatarBase64(null);
    setShowAlumnoData(false);
    
    if (previousRole === 'alumno') {
      loadAlumnoData();
    }
  };

  const handleSave = async () => {
    if (role === 'alumno' && (!cardNumber || !dniFrente || !dniFondo || !tramite)) {
      Alert.alert('Faltan datos', 'Por favor completá todos los datos de alumno.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No hay token de sesión');
        return;
      }

      const updateData: any = {};
      if (name !== user.displayName) updateData.nombre = name;
      if (role !== user.rol?.toLowerCase()) updateData.rol = role;
      if (avatarBase64) updateData.avatar = avatarBase64;

      if (role === 'alumno') {
        updateData.numeroTarjeta = cardNumber;
        updateData.dniFrente = cleanBase64(dniFrente);
        updateData.dniFondo = cleanBase64(dniFondo);
        updateData.tramite = tramite;
      }

      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        return;
      }

      console.log('Enviando datos al backend:', updateData);

      const res = await fetch(`http://192.168.1.31:8080/api/usuarios/${user.id}/perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        if (role === 'alumno') {
          await AsyncStorage.setItem('alumno_numeroTarjeta', cardNumber);
          await AsyncStorage.setItem('alumno_dniFrente', cleanBase64(dniFrente));
          await AsyncStorage.setItem('alumno_dniFondo', cleanBase64(dniFondo));
          await AsyncStorage.setItem('alumno_tramite', tramite);
        }

        if (role !== user.rol?.toLowerCase() && refreshUserRole) {
          await refreshUserRole();
        }

        setIsEditing(false);
        setPreviousRole(role);
        setAvatarBase64(null);
        setShowAlumnoData(false);
        
        Alert.alert(
          '¡Perfil actualizado!',
          role === 'alumno' ? '¡Felicitaciones! Ya eres alumno y tienes acceso a contenido premium.' : 'Tu perfil fue actualizado correctamente.',
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
      console.error('Error saving profile:', err);
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
          onPress: () => {
            setRole('alumno');
            setShowAlumnoData(true); 
            toggleRoleModal();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#2B5399" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ 
                  uri: avatar || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=2B5399&color=ffffff&size=200`
                }}
                style={styles.avatar}
              />
              {isEditing && (
                <TouchableOpacity style={styles.cameraButton} onPress={pickAvatar}>
                  <Ionicons name="camera" size={20} color="white" />
                </TouchableOpacity>
              )}
            </View>
            
            <Text style={styles.userName}>{user?.displayName}</Text>
            <View style={styles.roleBadge}>
              <Ionicons 
                name={role === 'alumno' ? 'school' : 'person'} 
                size={16} 
                color="#2B5399" 
              />
              <Text style={styles.roleText}>
                {role === 'usuario' ? 'Usuario' : 'Alumno'}
              </Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="person-outline" size={16} color="#2B5399" /> Nombre completo
              </Text>
              <TextInput
                style={[styles.input, !isEditing && styles.disabledInput]}
                value={name}
                onChangeText={setName}
                editable={isEditing}
                placeholder="Tu nombre completo"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="at-outline" size={16} color="#2B5399" /> Alias de usuario
              </Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={alias}
                  onChangeText={setAlias}
                  editable={false}
                  placeholder="Tu alias único"
                  placeholderTextColor="#999"
                />
                <Ionicons name="lock-closed" size={16} color="#999" style={styles.lockIcon} />
              </View>
              <Text style={styles.helpText}>El alias no se puede modificar por seguridad</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="shield-outline" size={16} color="#2B5399" /> Tipo de cuenta
              </Text>
              <TouchableOpacity
                onPress={isEditing && role !== 'alumno' ? toggleRoleModal : undefined}
                style={[
                  styles.input,
                  styles.roleSelector,
                  (!isEditing || role === 'alumno') && styles.disabledInput
                ]}
                activeOpacity={role === 'alumno' ? 1 : 0.7}
              >
                <View style={styles.roleSelectorContent}>
                  <Text style={[
                    styles.roleSelectorText,
                    (!isEditing || role === 'alumno') && styles.disabledText
                  ]}>
                    {role === 'usuario' ? 'Usuario' : 'Alumno'}
                  </Text>
                  {isEditing && role !== 'alumno' && (
                    <Ionicons name="chevron-down" size={20} color="#2B5399" />
                  )}
                  {role === 'alumno' && (
                    <Ionicons name="lock-closed" size={16} color="#999" />
                  )}
                </View>
              </TouchableOpacity>
              {role === 'alumno' && !showAlumnoData && (
                <Text style={styles.helpText}>Los alumnos no pueden cambiar su tipo de cuenta</Text>
              )}
            </View>

            {/* ✅ Datos de Alumno - Se muestran cuando se selecciona alumno */}
            {(showAlumnoData || (role === 'alumno' && isEditing)) && (
              <View style={styles.alumnoDataSection}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="school-outline" size={18} color="#2B5399" /> Datos de Alumno
                </Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Número de tarjeta de crédito</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>DNI - Frente</Text>
                  <TouchableOpacity 
                    style={styles.imageButton}
                    onPress={() => pickImage(setDniFrente)}
                  >
                    {dniFrente ? (
                      <Image source={{ uri: dniFrente }} style={styles.imagePreview} />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons name="camera" size={32} color="#999" />
                        <Text style={styles.imagePlaceholderText}>Tocar para subir foto</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>DNI - Dorso</Text>
                  <TouchableOpacity 
                    style={styles.imageButton}
                    onPress={() => pickImage(setDniFondo)}
                  >
                    {dniFondo ? (
                      <Image source={{ uri: dniFondo }} style={styles.imagePreview} />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons name="camera" size={32} color="#999" />
                        <Text style={styles.imagePlaceholderText}>Tocar para subir foto</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Número de trámite del DNI</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="12345678901"
                    value={tramite}
                    onChangeText={setTramite}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            {!isEditing ? (
              <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                <Ionicons name="create-outline" size={20} color="white" />
                <Text style={styles.buttonText}>Editar perfil</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text style={styles.buttonText}>
                    {role === 'alumno' && showAlumnoData ? 'Confirmar cambio a Alumno' : 'Guardar'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal para seleccionar rol */}
      <Modal visible={showRoleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar tipo de cuenta</Text>
              <TouchableOpacity onPress={toggleRoleModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <TouchableOpacity 
                style={styles.modalOption}
                onPress={() => {
                  setRole('usuario');
                  setShowAlumnoData(false);
                  toggleRoleModal();
                }}
              >
                <Ionicons name="person" size={24} color="#2B5399" />
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Usuario</Text>
                  <Text style={styles.optionDescription}>Acceso básico a todas las funciones</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalOption}
                onPress={handleAlumnoPress}
              >
                <Ionicons name="school" size={24} color="#2B5399" />
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Alumno</Text>
                  <Text style={styles.optionDescription}>Acceso premium con beneficios exclusivos</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B5399',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  message: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#2B5399',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#2B5399',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2B5399',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  roleText: {
    color: '#2B5399',
    fontSize: 14,
    fontWeight: '600',
  },
  formSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B5399',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2B5399',
  },
  inputWithIcon: {
    position: 'relative',
  },
  lockIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  disabledInput: {
    backgroundColor: '#f1f3f4',
    color: '#999',
  },
  disabledText: {
    color: '#999',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  roleSelector: {
    justifyContent: 'center',
  },
  roleSelectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleSelectorText: {
    fontSize: 16,
    color: '#2B5399',
  },
  alumnoDataSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B5399',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  actionSection: {
    padding: 20,
  },
  editButton: {
    backgroundColor: '#2B5399',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B5399',
  },
  modalBody: {
    padding: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B5399',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
});