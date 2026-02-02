"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
    id: string;
    email: string;
    role: string;
}

interface AuthContextType {
    accessToken: string | null;
    user: User | null;
    login: (token: string) => Promise<User | null>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const login = async (token: string): Promise<User | null> => {
        setIsLoading(true);
        setAccessToken(token);

        try {
            const response = await fetch('http://localhost:3001/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                return userData;
            } else {
                setAccessToken(null);
                return null;
            }
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            setAccessToken(null);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setAccessToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ accessToken, user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
