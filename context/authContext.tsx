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
  rol?: string;
}

type UserRole = 'visitante' | 'usuario' | 'alumno' | 'instructor';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  userId: number | null; 
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  login: (userData: User) => void;
  logout: () => void;
  refreshUserRole: () => Promise<void>; 
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('visitante');

  const checkUserRole = async (userId: number): Promise<UserRole> => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      try {
        const alumnoRes = await fetch(`http://192.168.1.31:8080/api/alumnos/por-usuario/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (alumnoRes.ok) {
          return 'alumno';
        }
      } catch (error) {
        console.log('No es alumno');
      }

      try {
        const instructorRes = await fetch(`http://192.168.1.31:8080/api/instructores/por-usuario/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (instructorRes.ok) {
          return 'instructor';
        }
      } catch (error) {
        console.log('No es instructor');
      }

      return 'usuario';
    } catch (error) {
      console.error('Error verificando rol del usuario:', error);
      return 'usuario';
    }
  };

  const refreshUserRole = async () => {
    if (user?.id) {
      const role = await checkUserRole(user.id);
      setUserRole(role);
      await AsyncStorage.setItem('userRole', role);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const json = await AsyncStorage.getItem('user');
        const savedRole = await AsyncStorage.getItem('userRole');

        if (json) {
          const savedUser = JSON.parse(json);
          setUser(savedUser);
          setIsAuthenticated(true);
          
          if (savedRole && ['alumno', 'instructor', 'usuario'].includes(savedRole)) {
            setUserRole(savedRole as UserRole);
          }
          
          const realRole = await checkUserRole(savedUser.id);
          setUserRole(realRole);
          await AsyncStorage.setItem('userRole', realRole);
        } else {
          setUserRole('visitante');
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setUserRole('visitante');
      }
    };

    loadUser();
  }, []);

  const login = async (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    
    const realRole = await checkUserRole(userData.id);
    setUserRole(realRole);
    
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await AsyncStorage.setItem('userRole', realRole);
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    setUserRole('visitante');
    await AsyncStorage.clear();
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
        userId: user?.id || null, 
        userRole,
        setUserRole: handleSetUserRole,
        login,
        logout,
        refreshUserRole,
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