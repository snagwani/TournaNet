"use client";

import { AuthProvider } from "@/app/context/AuthContext";
import { TimezoneProvider } from "@/app/context/TimezoneContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <TimezoneProvider>
                {children}
            </TimezoneProvider>
        </AuthProvider>
    );
}
