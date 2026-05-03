import { createContext, useState, useEffect } from 'react';
import React from 'react';

import type { AuthContextType } from '../model/AuthContextModel';
import { buildApiUrl } from '../lib/api';

export const AuthContext = createContext<AuthContextType>({
    user: null,
    apiKey: null,
    login: undefined,
    logout: undefined,
    isLoading: false
});

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {

    const [user, setUser] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {

        const storedUser = localStorage.getItem("user");
        const storedApiKey = localStorage.getItem("apikey");
        if(storedUser && storedApiKey){
            setUser(storedUser);
            setApiKey(storedApiKey);
        }
        setIsLoading(false);

    }, []);
    console.log("AuthProvider rendered, user:", user, "isLoading:", isLoading);

    async function login(username: string, password: string) {

        setIsLoading(true);

        try {
            const response = await fetch(
                buildApiUrl("/login", { username, password }),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            const payload = await response.json() as { message?: string; apikey?: string };

            if (!response.ok || !payload.apikey) {
                throw new Error(payload.message || "Invalid credentials");
            }

            setUser(username);
            setApiKey(payload.apikey);
            localStorage.setItem("user", username);
            localStorage.setItem("apikey", payload.apikey);
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }

    }

    async function logout() {
        setUser(null);
        setApiKey(null);
        localStorage.removeItem("user");
        localStorage.removeItem("apikey");
    }

    return (
        <AuthContext.Provider value={{user, apiKey, login, logout, isLoading}}>
            {children}
        </AuthContext.Provider>
    );

};