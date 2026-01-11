import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { JwtPayload } from '../types/JwtPayload';
import { LibraryService } from '../services/LibraryService'; // ДОДАНО

interface AuthContextType {
    user: JwtPayload | null;
    login: (token: string) => void;
    logout: () => void;
    isLoading: boolean;
    // Додаємо методи авторизації для прямого виклику з компонентів
    authenticate: (contactInfo: string, password: string) => Promise<void>;
    registerUser: (fullName: string, contactInfo: string, password: string, dateOfBirth: string, role?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<JwtPayload | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode<JwtPayload>(token);
                setUser(decoded);
            } catch (e) {
                localStorage.removeItem('token');
            }
        }
        setIsLoading(false);
    }, []);

    const loginUser = (token: string) => {
        localStorage.setItem('token', token);
        const decoded = jwtDecode<JwtPayload>(token);
        setUser(decoded);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    // Новий метод для входу
    const authenticate = async (contactInfo: string, password: string) => {
      const response = await LibraryService.login(contactInfo, password);
      // ВИПРАВЛЕНО: відповідь сервера тепер { ..., data: "Bearer <token>" }
      if (response.data && response.data.data) {
        const token = response.data.data.split(' ')[1]; // Відрізаємо "Bearer "
        loginUser(token);
      } else {
        throw new Error('Login failed: No token received.');
      }
    };

    // Новий метод для реєстрації
    const registerUser = async (fullName: string, contactInfo: string, password: string, dateOfBirth: string, role?: string) => {
      await LibraryService.register(fullName, contactInfo, password, dateOfBirth, role);
    };

    return (
        <AuthContext.Provider value={{ user, login: loginUser, logout, isLoading, authenticate, registerUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);