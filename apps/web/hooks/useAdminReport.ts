import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';

interface UseAdminReportOptions<T> {
    fetchFn: () => Promise<T>;
    autoFetch?: boolean;
}

export function useAdminReport<T>(options: UseAdminReportOptions<T>) {
    const { fetchFn, autoFetch = true } = options;
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const refresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await fetchFn();
            setData(result);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [fetchFn]);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        if (autoFetch) {
            refresh();
        }
    }, [user, refresh, autoFetch]);

    return {
        data,
        setData,
        isLoading,
        error,
        refresh
    };
}
