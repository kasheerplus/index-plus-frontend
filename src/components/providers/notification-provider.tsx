'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Bell } from 'lucide-react';

interface NotificationContextType {
    requestPermission: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Subscribe to new messages
        const channel = supabase
            .channel('realtime_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                async (payload) => {
                    const newMessage = payload.new as any;

                    // Only notify if it's from a customer (agent-sent messages shouldn't trigger local notifications)
                    if (newMessage.sender_type === 'customer') {
                        // Fetch sender name for better notification
                        const { data: conversation } = await supabase
                            .from('conversations')
                            .select('customers(name)')
                            .eq('id', newMessage.conversation_id)
                            .single();

                        const senderName = (conversation as any)?.customers?.name || 'عميل جديد';

                        // 1. Toast Notification
                        toast(
                            (t) => (
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <Bell className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-black text-xs text-gray-400">رسالة جديدة من {senderName}</p>
                                        <p className="text-sm font-bold truncate max-w-[200px]">{newMessage.content}</p>
                                    </div>
                                </div>
                            ),
                            {
                                duration: 5000,
                                position: 'top-left',
                            }
                        );

                        // 2. Browser Notification (if supported and permitted)
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification(`رسالة من ${senderName}`, {
                                body: newMessage.content,
                                icon: '/logo.png', // Fallback to logo
                            });
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const requestPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                toast.success('تم تفعيل إشعارات المتصفح بنجاح! 🔔');
            }
        }
    };

    return (
        <NotificationContext.Provider value={{ requestPermission }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
