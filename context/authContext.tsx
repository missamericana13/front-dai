import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface User {
  id: number;
  alias: string;
  apellido: any;
  nombre: any;
  displayName: string;
  photoURL: string;
  email?: string;
}

type UserRole = 'usuario' | 'alumno';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  login: (userData: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('usuario');

  useEffect(() => {
    const loadUser = async () => {
      const json = await AsyncStorage.getItem('user');
      const savedRole = await AsyncStorage.getItem('userRole');

      console.log('📦 USER GUARDADO:', json);
      console.log('🎯 ROL GUARDADO:', savedRole);

      if (json) {
        const savedUser = JSON.parse(json);
        setUser(savedUser);
        setIsAuthenticated(true);
        setUserRole(savedRole === 'alumno' ? 'alumno' : 'usuario');
      }
    };

    loadUser();
  }, []);

  const login = async (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    setUserRole('usuario'); // valor por defecto
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await AsyncStorage.setItem('userRole', 'usuario');
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    setUserRole('usuario');
    await AsyncStorage.clear(); // 🧹 limpia todo
    console.log('🚪 Sesión cerrada y almacenamiento limpiado');
  };

  const handleSetUserRole = async (role: UserRole) => {
    setUserRole(role);
    await AsyncStorage.setItem('userRole', role);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        userRole,
        setUserRole: handleSetUserRole,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
