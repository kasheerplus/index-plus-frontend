'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    MessageSquare,
    Package,
    Users,
    FileText,
    BarChart3,
    Settings,
    LogOut,
    User,
    CreditCard,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/use-permissions';
import { useKasheerConnection } from '@/hooks/use-kasheer-connection';

const navigation = [
    { name: 'لوحة التحكم', href: '/dashboard', icon: Home },
    { name: 'صندوق الرسائل', href: '/dashboard/inbox', icon: MessageSquare },
    { name: 'المخزن', href: '/dashboard/inventory', icon: Package },
    { name: 'العملاء', href: '/dashboard/crm', icon: Users },
    { name: 'المبيعات', href: '/dashboard/sales', icon: FileText },
    { name: 'التقارير', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'الاشتراك', href: '/dashboard/billing', icon: CreditCard },
    { name: 'الإعدادات', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { can, isLoading: isRoleLoading } = usePermissions();
    const { isConnected: isKasheerConnected, isLoading: isKasheerLoading } = useKasheerConnection();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/auth/login');
    };

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(href);
    };

    return (
        <>
            <div className={cn(
                "fixed inset-y-0 right-0 z-40 w-64 bg-brand-blue transform transition-transform duration-300 ease-in-out lg:translate-x-0 border-l border-white/10",
                !sidebarOpen && "translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo Section */}
                    <div className="flex items-center justify-between h-20 px-6 border-b border-white/10 bg-brand-blue-alt/30">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            <Image
                                src="/logo.png"
                                alt="KasheerPlus"
                                width={120}
                                height={40}
                                className="h-10 w-auto brightness-0 invert"
                            />
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-white/70 hover:text-white"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
                        {isRoleLoading ? (
                            <div className="space-y-4 pt-4">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            navigation.map((item) => {
                                // Hide inventory and sales if Kasheer Plus is not connected
                                if (item.href === '/dashboard/inventory' && !isKasheerConnected) return null;
                                if (item.href === '/dashboard/sales' && !isKasheerConnected) return null;

                                if (item.href === '/dashboard/settings' && !can('manage_settings') && !can('view_audit_logs')) return null;
                                if (item.href === '/dashboard/billing' && !can('manage_settings')) return null;

                                const active = isActive(item.href);
                                let href = item.href;
                                if (href === '/dashboard/settings') href = '/dashboard/settings/team';
                                if (href === '/dashboard/billing') href = '/dashboard/settings/billing';

                                return (
                                    <Link
                                        key={item.name}
                                        href={href}
                                        className={cn(
                                            'sidebar-item group flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all',
                                            active
                                                ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20'
                                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "h-5 w-5 ml-3 transition-colors",
                                            active ? "text-white" : "text-white/50 group-hover:text-white"
                                        )} />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })
                        )}
                    </nav>

                    {/* User Profile Section - Exact Kasheer Plus Style */}
                    <div className="p-4 border-t border-white/10 bg-brand-blue-alt/20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-green rounded-full flex items-center justify-center shadow-lg border-2 border-white/10">
                                <User className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-white truncate">أحمد محمد</p>
                                <p className="text-[10px] text-white/50 uppercase font-black">مدير المؤسسة</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-red-400 hover:text-red-300 transition-colors bg-white/5 p-2 rounded-lg"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu button */}
            {!sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-brand-blue text-white rounded-lg shadow-lg"
                >
                    <Home className="h-6 w-6" />
                </button>
            )}
        </>
    );
}
