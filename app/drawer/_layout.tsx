import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { useAuth } from '../../context/authContext';

import type { DrawerContentComponentProps } from '@react-navigation/drawer';

const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const { user, logout, userRole } = useAuth(); 

  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
  if (user?.id) {
    const fetchAvatar = async () => {
      try {
        const res = await fetch(`http://192.168.1.31:8080/api/usuarios/${user.id}/avatar`);
        if (res.ok) {
          const blob = await res.blob();
          if (Platform.OS === 'web') {
            const url = URL.createObjectURL(blob);
            setAvatarUrl(url);
            setAvatarBase64(null);
          } else {
            const base64 = await blobToBase64(blob);
            setAvatarBase64(base64);
            setAvatarUrl(null);
          }
        } else {
          setAvatarBase64(null);
          setAvatarUrl(null);
        }
      } catch {
        setAvatarBase64(null);
        setAvatarUrl(null);
      }
    };
    fetchAvatar();
  } else {
    setAvatarBase64(null);
    setAvatarUrl(null);
  }
}, [user?.id]);

  const [recetasOpen, setRecetasOpen] = useState(false);
  const [cursosOpen, setCursosOpen] = useState(false);

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1, backgroundColor: '#EDE5D8' }}
    >
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View>
          <View style={styles.profileRow}>
            <Image
              source={
                avatarBase64
                  ? { uri: `data:image/jpeg;base64,${avatarBase64}` }
                  : avatarUrl
                  ? { uri: avatarUrl }
                  : { uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }
              }
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.invited}>
                {user?.displayName || 'Invitado'}
              </Text>
              {user && userRole && (
                <Text style={styles.roleText}>
                  {userRole === 'alumno' ? '🎓 Alumno' : 
                   userRole === 'instructor' ? '👨‍🏫 Instructor' : 
                   '👤 Usuario'}
                </Text>
              )}
            </View>
          </View>

          {user ? (
            <>
              <DrawerItem
                label="Inicio"
                labelStyle={styles.menuText}
                icon={({ color, size }) => <Ionicons name="home" color={color} size={size ?? 24} />}
                onPress={() => router.push('/')}
              />

              {/* Recetas */}
              <TouchableOpacity onPress={() => setRecetasOpen(!recetasOpen)}>
                <View style={styles.expandableItem}>
                  <Ionicons name="restaurant" size={24} color="#2B5399" />
                  <Text style={styles.menuText}>Recetas</Text>
                  <Ionicons
                    name={recetasOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#2B5399"
                    style={{ marginLeft: 'auto' }}
                  />
                </View>
              </TouchableOpacity>
              {recetasOpen && (
                <>
                  <DrawerItem
                    label="Todas las recetas"
                    labelStyle={styles.subMenuText}
                    onPress={() => router.push('./recipes')}
                  />
                  <DrawerItem
                    label="Mis recetas"
                    labelStyle={styles.subMenuText}
                    onPress={() => router.push('./myrecipes')}
                  />
                </>
              )}

              {/* Cursos */}
              <TouchableOpacity onPress={() => setCursosOpen(!cursosOpen)}>
                <View style={styles.expandableItem}>
                  <Ionicons name="book" size={24} color="#2B5399" />
                  <Text style={styles.menuText}>Cursos</Text>
                  <Ionicons
                    name={cursosOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#2B5399"
                    style={{ marginLeft: 'auto' }}
                  />
                </View>
              </TouchableOpacity>
              {cursosOpen && (
                <>
                  <DrawerItem
                    label="Todos los cursos"
                    labelStyle={styles.subMenuText}
                    onPress={() => router.push('./courses')}
                  />
                  <DrawerItem
                    label="Mis cursos"
                    labelStyle={styles.subMenuText}
                    onPress={() => router.push('./mycourses')}
                  />
                </>
              )}

              {/* Mi Cuenta - Solo para alumnos */}
              {userRole === 'alumno' && (
                <DrawerItem
                  label="Mi Cuenta"
                  labelStyle={styles.menuText}
                  icon={({ color, size }) => <Ionicons name="wallet" color={color} size={size ?? 24} />}
                  onPress={() => router.push('./currentaccount')}
                />
              )}

              <DrawerItem
                label="Mi Perfil"
                labelStyle={styles.menuText}
                icon={({ color, size }) => <Ionicons name="person" color={color} size={size ?? 24} />}
                onPress={() => router.push('./myprofile')}
              />
            </>
          ) : (
            <>
              <DrawerItem
                label="Iniciar sesión"
                labelStyle={styles.menuText}
                icon={({ color, size }) => <Ionicons name="log-in" color={color} size={size ?? 24} />}
                onPress={() => router.push('/login')}
              />
              <DrawerItem
                label="Registrarse"
                labelStyle={styles.menuText}
                icon={({ color, size }) => <Ionicons name="person-add" color={color} size={size ?? 24} />}
                onPress={() => router.push('/register')}
              />
              {/* Público puede ver recetas y cursos generales */}
              <DrawerItem
                label="Recetas"
                labelStyle={styles.menuText}
                icon={({ color, size }) => <Ionicons name="restaurant" color={color} size={size ?? 24} />}
                onPress={() => router.push('./recipes')}
              />
              <DrawerItem
                label="Cursos"
                labelStyle={styles.menuText}
                icon={({ color, size }) => <Ionicons name="book" color={color} size={size ?? 24} />}
                onPress={() => router.push('./courses')}
              />
            </>
          )}
        </View>

        {user && (
          <DrawerItem
            label="Cerrar sesión"
            labelStyle={[styles.menuText, { color: 'red' }]}
            icon={({ color, size }) => <Ionicons name="log-out" color={'red'} size={size ?? 24} />}
            onPress={async () => {
              await logout();
            }}
          />
        )}
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  const router = useRouter();

  return (
    <Drawer
      screenOptions={{
        drawerActiveTintColor: '#2B5399',
        drawerInactiveTintColor: '#888',
        drawerStyle: { backgroundColor: '#EDE5D8' },
        headerStyle: { backgroundColor: '#2B5399' },
        headerTintColor: '#fff',
        headerTitle: '',
        headerRight: () => (
          <TouchableOpacity
            style={{ marginRight: 15 }}
            onPress={() => router.push('./favourites')}
          >
            <Ionicons name="bookmark" size={24} color="#fff" />
          </TouchableOpacity>
        ),
      }}
      drawerContent={props => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="/" options={{ drawerLabel: () => null, drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="/recipes" options={{ drawerLabel: () => null, drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="/myrecipes" options={{ drawerLabel: () => null, drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="/courses" options={{ drawerLabel: () => null, drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="/mycourses" options={{ drawerLabel: () => null, drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="/myprofile" options={{ drawerLabel: () => null, drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="/cuenta-corriente" options={{ drawerLabel: () => null, drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="/login" options={{ drawerLabel: () => null, drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="/register" options={{ drawerLabel: () => null, drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="/favourites" options={{ drawerLabel: () => null, drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  invited: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2B5399',
  },
  roleText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  menuText: {
    fontSize: 18,
    color: '#2B5399',
    fontWeight: 'bold',
  },
  subMenuText: {
    fontSize: 16,
    color: '#2B5399',
    paddingLeft: 32,
  },
  expandableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 17,
    paddingVertical: 12,
  },
});