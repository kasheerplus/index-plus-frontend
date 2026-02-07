'use client';

import { toast, Toaster } from 'react-hot-toast';
import { GlobalNav } from './global-nav';
import { NotificationProvider } from '@/components/providers/notification-provider';
import { Settings, Store, LogOut, Bell, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const syncFingerprintAndRedirect = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const companyId = user.user_metadata?.company_id;

                // 1. Handle Role-based Redirect
                const { data: userData } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (userData?.role === 'agent' && (pathname === '/dashboard' || pathname === '/dashboard/')) {
                    router.push('/dashboard/inbox');
                }

                // 2. Sync Fingerprint & Check for Abuse
                if (companyId) {
                    const { data: companyData } = await supabase
                        .from('companies')
                        .select('fingerprint')
                        .eq('id', companyId)
                        .single();

                    if (companyData) {
                        const { getBrowserFingerprint } = await import('@/lib/fingerprint');
                        const fingerprint = getBrowserFingerprint();

                        // Update fingerprint if missing
                        if (!companyData.fingerprint) {
                            await supabase
                                .from('companies')
                                .update({ fingerprint })
                                .eq('id', companyId);
                        }

                        // Check if this fingerprint is used by ANOTHER company that already had a trial
                        const { data: duplicateCompany } = await supabase
                            .from('companies')
                            .select('id')
                            .eq('fingerprint', fingerprint)
                            .neq('id', companyId)
                            .limit(1)
                            .maybeSingle();

                        if (duplicateCompany) {
                            // Duplicate detected! Suspend trial immediately
                            const { data: sub } = await supabase.from('subscriptions').select('status').eq('company_id', companyId).maybeSingle();
                            if (sub?.status === 'trial') {
                                await supabase
                                    .from('subscriptions')
                                    .update({ status: 'suspended' })
                                    .eq('company_id', companyId);

                                toast.error('تم اكتشاف محاولة إنشاء حساب تجريبي متعدد من نفس الجهاز. الحساب معلق حالياً.', {
                                    duration: 10000,
                                    icon: '🛡️'
                                });
                            }
                        }
                    }
                }
            }
        };
        syncFingerprintAndRedirect();
    }, [pathname, router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/auth/login');
    };

    return (
        <NotificationProvider>
            <div className="min-h-screen bg-brand-off-white font-cairo">
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            fontFamily: 'Cairo, sans-serif',
                            fontWeight: 'bold',
                            direction: 'rtl',
                            borderRadius: '12px',
                        }
                    }}
                />


                {/* Main Content Area */}
                <div className="relative z-30">
                    {/* Header - Exact Kasheer Plus Style */}
                    <header className="bg-white shadow-2xl sticky top-0 z-40 overflow-hidden" dir="rtl">
                        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center justify-between">
                                <div id="headerLogo" className="flex items-center gap-3 sm:gap-6">
                                    <div className="relative h-10 sm:h-14 w-32 sm:w-48 overflow-hidden flex items-center justify-center">
                                        <Image
                                            src="/logo.png"
                                            alt="إندكس بلس"
                                            fill
                                            priority
                                            sizes="(max-width: 640px) 128px, 192px"
                                            className="object-contain scale-[2.2]"
                                        />
                                    </div>
                                    <div className="border-r-2 border-brand-beige pr-2 sm:pr-4 hidden sm:block">
                                        <h1 className="text-lg sm:text-2xl font-bold tracking-wide text-brand-blue leading-tight">نظام إندكس بلس</h1>
                                        <p className="text-brand-blue-alt text-[10px] sm:text-sm font-medium">نظام إدارة المحادثات</p>
                                    </div>
                                </div>

                                {/* Header Actions Removed as they exist in GlobalNav */}
                                <div className="flex items-center gap-2 sm:gap-3">
                                    {/* Empty or can add user initials/avatar if needed later */}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Global Navigation Bar */}
                    <GlobalNav />

                    {/* Page Content */}
                    <main className="p-4 sm:p-6 lg:p-8 relative z-20">
                        {children}
                    </main>
                </div>
            </div>
        </NotificationProvider>
    );
}
