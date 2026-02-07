'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    MessageSquare,
    Users,
    Package,
    ShoppingBag,
    BarChart3,
    Zap,
    Settings,
    LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const navItems = [
    { label: 'الرئيسية', href: '/dashboard', icon: LayoutDashboard },
    { label: 'صندوق الوارد', href: '/dashboard/inbox', icon: MessageSquare },
    { label: 'العملاء', href: '/dashboard/crm', icon: Users },
    { label: 'المخازن', href: '/dashboard/inventory', icon: Package },
    { label: 'المبيعات', href: '/dashboard/sales', icon: ShoppingBag },
    { label: 'الفريق', href: '/dashboard/team', icon: Users },
    { label: 'الأتمتة', href: '/dashboard/settings/automation', icon: Zap },
    { label: 'الإعدادات', href: '/dashboard/settings', icon: Settings },
];

export function GlobalNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [userRole, setUserRole] = useState<string | null>(null);

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
        };
        fetchRole();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/auth/login');
    };

    // Filter nav items based on role
    const filteredNavItems = navItems.filter(item => {
        if (userRole === 'agent') {
            return ['صندوق الوارد', 'الإعدادات'].includes(item.label);
        }
        return true;
    });

    return (
        <div className="sticky top-[72px] sm:top-[88px] z-40 bg-brand-off-white/80 backdrop-blur-md border-b border-brand-beige py-3 px-4 sm:px-8 mb-6 overflow-x-auto scrollbar-hide">
            <div className="flex items-center justify-center gap-2 min-w-max mx-auto max-w-7xl">
                {filteredNavItems.map((item) => {
                    let href = item.href;
                    if (item.label === 'الإعدادات' && userRole === 'agent') {
                        href = '/dashboard/settings/profile';
                    }

                    // Match exactly or start with href/
                    const isExactMatch = pathname === href;
                    const isSubPathMatch = href !== '/dashboard' && pathname.startsWith(href + '/');

                    // If this is a sub-path match, make sure there isn't a more specific match in the nav
                    const hasMoreSpecificMatch = isSubPathMatch && filteredNavItems.some(otherItem => {
                        if (otherItem.href === href) return false;
                        return pathname.startsWith(otherItem.href);
                    });

                    const isActive = isExactMatch || (isSubPathMatch && !hasMoreSpecificMatch);

                    return (
                        <Link
                            key={item.href}
                            href={href}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-sm transition-all whitespace-nowrap",
                                isActive
                                    ? "bg-brand-green text-white shadow-lg shadow-brand-green/20"
                                    : "text-brand-blue-alt/50 hover:bg-brand-beige/50 hover:text-brand-blue"
                            )}
                        >
                            <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-brand-blue-alt/50")} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}

                {/* Separator for Logout */}
                <div className="h-8 w-[2px] bg-brand-beige mx-2 hidden sm:block" />

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-sm transition-all whitespace-nowrap text-red-500 hover:bg-red-50"
                >
                    <LogOut className="h-4 w-4" />
                    <span>خروج</span>
                </button>
            </div>
        </div>
    );
}
