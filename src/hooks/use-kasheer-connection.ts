import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface KasheerConnectionState {
    isConnected: boolean | null;
    isLoading: boolean;
    refetch: () => Promise<void>;
}

export function useKasheerConnection(): KasheerConnectionState {
    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkConnection = async () => {
        setIsLoading(true);
        try {
            const { data: channel, error } = await supabase
                .from('channels')
                .select('*')
                .eq('platform', 'kasheer_plus')
                .eq('status', 'connected')
                .maybeSingle();

            if (error) {
                console.error('Error checking Kasheer connection:', error);
                setIsConnected(false);
            } else {
                setIsConnected(!!channel);
            }
        } catch (err) {
            console.error('Error:', err);
            setIsConnected(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkConnection();
    }, []);

    return {
        isConnected,
        isLoading,
        refetch: checkConnection
    };
}
