'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Settings,
    Users,
    Building2,
    MessageSquare,
    CreditCard,
    FileText,
    Zap,
    ChevronLeft,
    Shield,
    Bell,
    Palette,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const settingsSections = [
    {
        id: 'profile',
        title: 'الملف الشخصي',
        description: 'تعديل بياناتك الشخصية وكلمة المرور',
        icon: Users,
        color: 'bg-green-500',
        href: '/dashboard/settings/profile',
        roles: ['owner', 'admin', 'supervisor', 'agent']
    },
    {
        id: 'company',
        title: 'بيانات المؤسسة',
        description: 'إدارة معلومات الشركة والعلامة التجارية',
        icon: Building2,
        color: 'bg-brand-blue',
        href: '/dashboard/settings/company',
        roles: ['owner', 'admin']
    },
    {
        id: 'channels',
        title: 'القنوات والاتصالات',
        description: 'ربط فيسبوك، إنستجرام، واتساب، وكاشير بلس',
        icon: MessageSquare,
        color: 'bg-blue-500',
        href: '/dashboard/settings/channels',
        roles: ['owner', 'admin']
    },
    {
        id: 'automation',
        title: 'الأتمتة والردود الذكية',
        description: 'بناء سيناريوهات المحادثات التلقائية',
        icon: Zap,
        color: 'bg-amber-500',
        href: '/dashboard/settings/automation',
        roles: ['owner', 'admin', 'supervisor']
    },
    {
        id: 'billing',
        title: 'الفواتير والاشتراكات',
        description: 'إدارة الباقة والمدفوعات',
        icon: CreditCard,
        color: 'bg-purple-500',
        href: '/dashboard/settings/billing',
        roles: ['owner']
    },
    {
        id: 'logs',
        title: 'سجل النشاطات',
        description: 'تتبع جميع العمليات والتغييرات',
        icon: FileText,
        color: 'bg-gray-500',
        href: '/dashboard/settings/logs',
        roles: ['owner', 'admin']
    }
];

export default function SettingsPage() {
    const router = useRouter();

    useEffect(() => {
        const fetchRoleAndRedirect = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    // Redirect to first appropriate section
                    if (data.role === 'agent') {
                        router.push('/dashboard/settings/profile');
                    } else if (data.role === 'owner' || data.role === 'admin') {
                        router.push('/dashboard/settings/company');
                    } else {
                        router.push('/dashboard/settings/profile');
                    }
                }
            }
        };
        fetchRoleAndRedirect();
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-10 w-10 text-brand-green animate-spin" />
        </div>
    );
}
