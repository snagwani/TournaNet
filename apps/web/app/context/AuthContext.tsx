"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
    id: string;
    email: string;
    role: string;
}

interface AuthContextType {
    accessToken: string | null; // Keep for legacy/internal consistency, will be null if only using cookies
    user: User | null;
    login: (token: string) => Promise<User | null>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/auth/me', {
                credentials: 'include'
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const login = async (token: string): Promise<User | null> => {
        // With cookies, the token is already set in the browser by the Redirect/Response
        // We just need to fetch the profile to sync the state
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/auth/me', {
                credentials: 'include'
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                return userData;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Login profile fetch failed:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await fetch('http://localhost:3001/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setUser(null);
            setAccessToken(null);
        }
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
