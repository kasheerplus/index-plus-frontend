'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Share2, Building2, CreditCard, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const originalTabs = [
    { id: 'profile', label: 'الملف الشخصي', href: '/dashboard/settings/profile', icon: Users },
    { id: 'channels', label: 'القنوات', href: '/dashboard/settings/channels', icon: Share2 },
    { id: 'company', label: 'بيانات الشركة', href: '/dashboard/settings/company', icon: Building2 },
    { id: 'logs', label: 'سجلات الأمان', href: '/dashboard/settings/logs', icon: ShieldCheck },
    { id: 'billing', label: 'الاشتراك والفوترة', href: '/dashboard/settings/billing', icon: CreditCard },
];

export function SettingsHeader() {
    const pathname = usePathname();
    const [plan, setPlan] = useState<string>('جارِ التحميل...');
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const fetchPlanAndRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Fetch Plan
                const { data: sub } = await supabase.from('subscriptions').select('plan_id').single();
                if (sub?.plan_id) {
                    const planNames: Record<string, string> = {
                        basic: 'الباقة الأساسية',
                        pro: 'الباقة الاحترافية',
                        business: 'باقة الأعمال'
                    };
                    setPlan(planNames[sub.plan_id] || 'مخصصة');
                } else {
                    setPlan('تجريبي');
                }

                // Fetch Role
                const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
                if (profile) setUserRole(profile.role);
            }
        };
        fetchPlanAndRole();
    }, []);

    const tabs = originalTabs.filter(tab => {
        if (userRole === 'agent') return tab.id === 'profile';
        if (userRole === 'supervisor' && ['billing', 'logs'].includes(tab.id)) return false;
        return true;
    });

    const isAutomationPage = pathname?.includes('/automation');

    if (isAutomationPage) return null;

    return (
        <div className="bg-gradient-to-r from-brand-green via-brand-green-alt to-brand-green rounded-2xl shadow-xl p-6 mb-6 text-white font-cairo">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 text-right w-full md:w-auto">
                    <h2 className="text-2xl font-black" id="managementViewTitle">إعدادات النظام</h2>
                    <p className="text-brand-beige mt-1 text-sm font-bold flex items-center gap-2 justify-end md:justify-start">
                        <ShieldCheck className="h-4 w-4" />
                        أنت على <span className="text-white font-black">{plan}</span>
                    </p>
                </div>

                {/* Navigation Tabs - Exact Kasheer Plus Style */}
                <div className="flex bg-white/20 p-1.5 rounded-xl backdrop-blur-sm overflow-x-auto max-w-full scrollbar-hide gap-1">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href;
                        return (
                            <Link
                                key={tab.id}
                                href={tab.href}
                                className={cn(
                                    "mgmt-tab px-4 sm:px-5 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-2",
                                    isActive && "active bg-white text-brand-green shadow-lg"
                                )}
                            >
                                <tab.icon className="h-4 w-4" />
                                <span>{tab.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
