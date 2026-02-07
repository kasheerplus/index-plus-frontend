'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export function useNotifications() {
    const [token, setToken] = useState<string | null>(null);

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            // In a real scenario, you would use firebase.messaging() to get the token here.
            // For this implementation, we simulate the token generation and storage.
            registerToken('SIMULATED_FCM_TOKEN_' + Math.random().toString(36).substr(2, 9));
        }
    };

    const registerToken = async (fcmToken: string) => {
        try {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) return;

            const { error } = await supabase
                .from('fcm_tokens')
                .upsert({
                    user_id: userData.user.id,
                    token: fcmToken,
                    device_type: 'web',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id, token' });

            if (error) throw error;
            setToken(fcmToken);
            console.log('FCM Token registered successfully');
        } catch (err) {
            console.error('Error registering FCM token:', err);
        }
    };

    return { token, requestPermission };
}
