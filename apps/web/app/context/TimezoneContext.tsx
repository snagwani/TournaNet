"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TOURNAMENT_TIMEZONE } from '@/lib/timeUtils';

interface TimezoneContextType {
    timezone: string;
    setTimezone: (tz: string) => void;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

export function TimezoneProvider({ children }: { children: ReactNode }) {
    const [timezone, setTimezoneState] = useState(TOURNAMENT_TIMEZONE);

    useEffect(() => {
        const saved = localStorage.getItem('tournanet_timezone');
        if (saved) {
            setTimezoneState(saved);
        }
    }, []);

    const setTimezone = (tz: string) => {
        setTimezoneState(tz);
        localStorage.setItem('tournanet_timezone', tz);
    };

    return (
        <TimezoneContext.Provider value={{ timezone, setTimezone }}>
            {children}
        </TimezoneContext.Provider>
    );
}

export function useTimezone() {
    const context = useContext(TimezoneContext);
    if (context === undefined) {
        throw new Error('useTimezone must be used within a TimezoneProvider');
    }
    return context;
}
