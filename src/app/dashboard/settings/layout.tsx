'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    User,
    Building2,
    MessageSquare,
    Zap,
    CreditCard,
    FileText,
    ChevronLeft,
    Loader2,
    Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const settingsSections = [
    {
        id: 'profile',
        title: 'الملف الشخصي',
        icon: User,
        href: '/dashboard/settings/profile',
        roles: ['owner', 'admin', 'supervisor', 'agent']
    },
    {
        id: 'company',
        title: 'بيانات المؤسسة',
        icon: Building2,
        href: '/dashboard/settings/company',
        roles: ['owner', 'admin']
    },
    {
        id: 'channels',
        title: 'القنوات والاتصالات',
        icon: MessageSquare,
        href: '/dashboard/settings/channels',
        roles: ['owner', 'admin']
    },


    {
        id: 'billing',
        title: 'الاشتراك',
        icon: CreditCard,
        href: '/dashboard/settings/billing',
        roles: ['owner']
    },
    {
        id: 'logs',
        title: 'سجل النشاطات',
        icon: FileText,
        href: '/dashboard/settings/logs',
        roles: ['owner', 'admin']
    }
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                if (data) setUserRole(data.role);
            }
            setIsLoading(false);
        };
        fetchRole();
    }, []);

    const filteredSections = settingsSections.filter(section =>
        !userRole || section.roles.includes(userRole as any)
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 text-brand-green animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-200px)] font-cairo" dir="rtl">
            {/* Sidebar */}
            <aside className="lg:w-80 shrink-0">
                <div className="sticky top-24 space-y-4">
                    <div className="bg-white rounded-[32px] p-6 border-2 border-brand-beige shadow-sm">
                        <div className="flex items-center gap-4 mb-6 px-2">
                            <div className="h-10 w-10 rounded-xl bg-brand-blue text-white flex items-center justify-center shadow-lg shadow-brand-blue/20">
                                <Shield className="h-5 w-5" />
                            </div>
                            <h2 className="text-xl font-black text-brand-blue">الإعدادات</h2>
                        </div>

                        <nav className="space-y-1">
                            {filteredSections.map((section) => {
                                const isActive = pathname === section.href || pathname.startsWith(section.href + '/');
                                return (
                                    <Link
                                        key={section.id}
                                        href={section.href}
                                        className={cn(
                                            "flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold transition-all group",
                                            isActive
                                                ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20"
                                                : "text-brand-blue-alt/60 hover:bg-brand-off-white hover:text-brand-blue"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <section.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-brand-blue-alt/30 group-hover:text-brand-blue")} />
                                            <span className="text-sm">{section.title}</span>
                                        </div>
                                        {isActive && <ChevronLeft className="h-4 w-4" />}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Quick Help Card */}
                    <div className="bg-gradient-to-br from-brand-green to-brand-green-alt rounded-[32px] p-6 text-white relative overflow-hidden shadow-xl hidden lg:block">
                        <div className="relative z-10 space-y-3">
                            <h4 className="font-black text-sm">أداء النظام</h4>
                            <p className="text-[10px] text-white/80 font-bold leading-relaxed">
                                جميع الإعدادات يتم حفظها تلقائياً وتطبق فوراً على المحادثات والاتصالات.
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl translate-x-8 -translate-y-8" />
                    </div>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 min-w-0">
                <div className="h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
