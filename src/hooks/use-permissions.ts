'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type UserRole = 'owner' | 'admin' | 'agent' | 'supervisor';

export function usePermissions() {
    const [role, setRole] = useState<UserRole | null>(null);
    const [customPermissions, setCustomPermissions] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchRole() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // 1. Prioritize App Metadata (it's server-side controlled)
                    const metadataRole = user.app_metadata?.role || user.user_metadata?.role;
                    if (metadataRole) {
                        setRole(metadataRole as UserRole);
                    }

                    // 2. Fetch from DB for latest custom permissions
                    try {
                        const { data } = await supabase
                            .from('users')
                            .select('role, permissions')
                            .eq('id', user.id)
                            .maybeSingle();

                        if (data?.role) {
                            setRole(data.role as UserRole);
                            setCustomPermissions(data.permissions || {});
                        }
                    } catch (dbError) {
                        // If users table doesn't exist, default to owner role
                        console.warn('Users table not found, defaulting to owner role:', dbError);
                        setRole('owner');
                    }
                }
            } catch (error) {
                console.error('Error fetching user role:', error);
                // Default to owner if there's any error
                setRole('owner');
            } finally {
                setIsLoading(false);
            }
        }
        fetchRole();
    }, []);

    const can = (action: string) => {
        if (!role) return false;
        if (role === 'owner' || customPermissions?.all) return true;

        // Custom permission override check
        if (customPermissions && customPermissions[action] !== undefined) {
            return customPermissions[action];
        }

        const roleDefaults: Record<UserRole, string[]> = {
            owner: ['*'],
            admin: [
                'manage_team',
                'manage_settings',
                'view_analytics',
                'manage_customers',
                'manage_sales',
                'manage_automation',
                'view_audit_logs'
            ],
            supervisor: [
                'view_analytics',
                'manage_customers',
                'manage_sales',
                'view_audit_logs'
            ],
            agent: [
                'view_analytics',
                'manage_customers',
                'manage_sales'
            ]
        };

        return (roleDefaults[role] || []).includes(action);
    };

    return { role, can, isLoading };
}
