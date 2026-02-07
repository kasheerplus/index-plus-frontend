'use client';

import { useState, useEffect } from 'react';
import {
    CreditCard,
    CheckCircle2,
    Download,
    Package,
    ArrowRight,
    Loader2,
    Calendar,
    Wallet
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Invoice {
    id: string;
    amount: number;
    currency: string;
    status: 'pending' | 'paid' | 'failed';
    created_at: string;
    provider: string;
}

export default function BillingPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [subscription, setSubscription] = useState<any>(null);
    const [quota, setQuota] = useState<any>(null);
    const [userCount, setUserCount] = useState<number>(0);
    const [channelCount, setChannelCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            // 1. Get current user company
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const companyId = user.user_metadata?.company_id;
            if (!companyId) return;

            // 2. Fetch all data in parallel
            const [
                { data: invData },
                { data: subData },
                { data: quotaData },
                { count: uCount },
                { count: cCount }
            ] = await Promise.all([
                supabase.from('billing_invoices').select('*').order('created_at', { ascending: false }),
                supabase.from('subscriptions').select('*').eq('company_id', companyId).maybeSingle(),
                supabase.from('tenant_quotas').select('*').eq('company_id', companyId).maybeSingle(),
                supabase.from('users').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
                supabase.from('channels').select('*', { count: 'exact', head: true }).eq('company_id', companyId)
            ]);

            setInvoices(invData as any[] || []);
            setSubscription(subData);
            setQuota(quotaData);
            setUserCount(uCount || 0);
            setChannelCount(cCount || 0);
        } catch (err) {
            console.error('Error fetching billing data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getPlanName = (planId: string) => {
        switch (planId) {
            case 'free':
            case 'starter': return 'باقة البداية';
            case 'pro': return 'الباقة الاحترافية';
            case 'business': return 'باقة الأعمال';
            default: return 'باقة مخصصة';
        }
    };

    const getStatusInfo = () => {
        if (!subscription) return { label: 'مجهول', color: 'bg-brand-blue-alt/10 text-brand-blue-alt/40' };

        const now = new Date();
        const endsAt = subscription.ends_at ? new Date(subscription.ends_at) : null;

        if (subscription.status === 'suspended') return { label: 'معلق', color: 'bg-red-500 text-white shadow-lg shadow-red-500/20' };

        if (endsAt) {
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(now.getDate() + 3);

            if (now > endsAt) return { label: 'منتهي', color: 'bg-red-500 text-white' };
            if (endsAt < threeDaysFromNow) return { label: 'تنتهي قريباً', color: 'bg-amber-500 text-white animate-pulse' };
        }

        if (subscription.status === 'trial') return { label: 'تجريبي', color: 'bg-brand-green text-white shadow-lg shadow-brand-green/20' };

        return { label: 'نشط', color: 'bg-brand-green text-white' };
    };

    const statusInfo = getStatusInfo();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-right font-cairo" dir="rtl">
            {/* Header Card */}
            <div className="bg-white rounded-[32px] p-8 border-2 border-brand-beige shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-brand-off-white flex items-center justify-center border-2 border-brand-beige shadow-sm">
                        <CreditCard className="h-6 w-6 text-brand-blue" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-brand-blue">الاشتراك</h1>
                        <p className="text-sm text-brand-blue-alt/40 font-bold mt-1">إدارة خطة اشتراكك، طرق الدفع، ومراجعة سجل العمليات.</p>
                    </div>
                </div>
            </div>

            {/* Expiration Alerts */}
            {statusInfo.label === 'تنتهي قريباً' && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-[28px] p-6 flex items-center justify-between gap-6 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-amber-900 font-black">اشتراكك ينتهي خلال أقل من 3 أيام!</p>
                            <p className="text-amber-700/60 text-xs font-bold mt-0.5">يرجى تجديد الاشتراك لتجنب توقف الخدمة وتصفير عدادات الاستهلاك.</p>
                        </div>
                    </div>
                    <Button onClick={() => router.push('/dashboard/settings/billing/plans')} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black px-6">جدد الآن</Button>
                </div>
            )}

            {statusInfo.label === 'منتهي' || statusInfo.label === 'معلق' && (
                <div className="bg-red-50 border-2 border-red-200 rounded-[28px] p-6 flex items-center justify-between gap-6 animate-in shake duration-500">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                            <CheckCircle2 className="h-6 w-6 transform rotate-45" />
                        </div>
                        <div>
                            <p className="text-red-900 font-black">الخدمة متوقفة حالياً</p>
                            <p className="text-red-700/60 text-xs font-bold mt-0.5">انتهت صلاحية اشتراكك. قم بالتجديد فوراً لاستعادة الوصول لقنوات التواصل.</p>
                        </div>
                    </div>
                    <Button onClick={() => router.push('/dashboard/settings/billing/plans')} className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-black px-6">تفعيل الحساب</Button>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Current Plan Card */}
                <div className="xl:col-span-2 space-y-8">
                    <div className="bg-brand-blue rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl shadow-brand-blue/20">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/20 blur-[100px] pointer-events-none" />
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="px-5 py-2 bg-white/10 rounded-full text-[11px] font-black uppercase tracking-widest inline-block border border-white/10 shadow-sm text-brand-green">خطة العمل الحالية</span>
                                    {subscription && (
                                        <span className={cn(
                                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm",
                                            statusInfo.color
                                        )}>
                                            {statusInfo.label}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-4xl font-black mb-2 leading-tight">
                                    {isLoading ? '...' : getPlanName(subscription?.plan_id)}
                                    {subscription?.plan_id === 'pro' && <span className="text-brand-green italic tracking-tighter mr-2">(Premium)</span>}
                                </h2>
                                <p className="text-white/50 text-base font-bold">
                                    {subscription?.ends_at
                                        ? <>تاريخ التجديد القادم: <span className="font-number text-brand-green">{format(new Date(subscription.ends_at), 'yyyy-MM-dd')}</span></>
                                        : 'تفعيل الاشتراك الدائم'}
                                </p>
                            </div>
                            <Button
                                onClick={() => router.push('/dashboard/settings/billing/plans')}
                                className="h-16 px-10 rounded-2xl font-black gap-3 bg-brand-green hover:bg-brand-green-alt text-white whitespace-nowrap shadow-xl shadow-brand-green/20 transition-all active:scale-95 text-lg"
                            >
                                ترقية أو تغيير الخطة
                                <ArrowRight className="h-6 w-6" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12 bg-white/5 p-6 rounded-[24px] border border-white/10 backdrop-blur-sm">
                            {[
                                {
                                    label: 'الرسائل الشهرية',
                                    value: `${quota?.current_message_count || 0} / ${subscription?.plan_id === 'business' ? '∞' :
                                        subscription?.plan_id === 'pro' ? '2,500' :
                                            '500'
                                        }`,
                                    icon: Package
                                },
                                {
                                    label: 'عدد الموظفين',
                                    value: `${userCount} / ${subscription?.plan_id === 'business' ? '∞' :
                                        subscription?.plan_id === 'pro' ? '15' :
                                            '3'
                                        }`,
                                    icon: CreditCard
                                },
                                {
                                    label: 'سعة التخزين',
                                    value: `${subscription?.plan_id === 'business' ? '∞' : subscription?.plan_id === 'pro' ? '5GB' : '100MB'}`,
                                    icon: Wallet
                                },
                                {
                                    label: 'القنوات المتصلة',
                                    value: `${channelCount} / ${subscription?.plan_id === 'business' ? '∞' :
                                        subscription?.plan_id === 'pro' ? '3' :
                                            '1'
                                        }`,
                                    icon: CheckCircle2
                                },
                            ].map((stat, i) => (
                                <div key={i} className="flex flex-col border-l last:border-0 border-white/5 px-4 first:pr-0 last:pl-0">
                                    <stat.icon className="h-5 w-5 text-brand-green mb-3" />
                                    <p className="text-[10px] text-white/40 font-black mb-1 uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-sm font-black font-number text-white">{isLoading ? '...' : stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] border-2 border-brand-beige p-10 shadow-sm overflow-hidden">
                        <h3 className="text-2xl font-black text-brand-blue mb-8 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-brand-off-white flex items-center justify-center border-2 border-brand-beige shadow-sm">
                                <History size={24} className="text-brand-green" />
                            </div>
                            سجل الفواتير والدفعات
                        </h3>
                        <div className="space-y-4">
                            {isLoading ? (
                                [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
                            ) : invoices.length === 0 ? (
                                <div className="text-center py-20 bg-brand-off-white/50 rounded-[24px] border-2 border-dashed border-brand-beige">
                                    <p className="text-brand-blue-alt/40 font-black text-lg">لا يوجد فواتير سابقة في هذا النشاط بعد</p>
                                </div>
                            ) : (
                                invoices.map((invoice) => (
                                    <div key={invoice.id} className="flex items-center justify-between p-6 bg-brand-off-white/50 rounded-[24px] border-2 border-brand-beige hover:border-brand-green/30 hover:bg-white hover:shadow-xl transition-all group overflow-hidden relative">
                                        <div className="flex items-center gap-5 relative z-10 text-right" dir="rtl">
                                            <div className="h-14 w-14 rounded-2xl bg-white border-2 border-brand-beige flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                                <CreditCard className="h-7 w-7 text-brand-blue-alt/40" />
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-brand-blue font-number">{invoice.amount} {invoice.currency}</p>
                                                <p className="text-xs text-brand-blue-alt/40 font-black uppercase tracking-widest mt-1">{format(new Date(invoice.created_at), 'PPP', { locale: ar })}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 relative z-10">
                                            <span className={cn(
                                                "px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest shadow-sm border-2",
                                                invoice.status === 'paid' ? "bg-green-50 text-green-600 border-green-100" : "bg-amber-50 text-amber-600 border-amber-100"
                                            )}>
                                                {invoice.status === 'paid' ? 'مدفوعة بنجاح' : 'جاري المعالجة'}
                                            </span>
                                            <Button
                                                onClick={() => toast.success('جاري تحضير فاتورتك للتحميل...')}
                                                variant="ghost"
                                                className="h-12 w-12 p-0 bg-white border-2 border-brand-beige rounded-xl text-brand-blue-alt/30 hover:text-brand-green hover:border-brand-green/20 transition-all shadow-sm"
                                            >
                                                <Download className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Billing Details Sidebar */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[32px] border-2 border-brand-beige p-8 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-24 h-24 bg-brand-blue/5 rounded-full blur-3xl -translate-x-12 -translate-y-12" />
                        <h3 className="text-xl font-black text-brand-blue mb-6 relative z-10">بطاقة الدفع الأساسية</h3>

                        {!subscription?.payment_method_id ? (
                            <div className="p-8 bg-brand-off-white/80 rounded-[24px] border-2 border-dashed border-brand-beige mb-6 text-center relative z-10">
                                <CreditCard className="h-10 w-10 text-brand-blue-alt/20 mx-auto mb-4" />
                                <p className="text-sm font-black text-brand-blue-alt/40">لا يوجد وسيلة دفع مسجلة حالياً</p>
                                <Button
                                    onClick={() => router.push('/dashboard/settings/billing/checkout')}
                                    variant="ghost"
                                    className="text-brand-green font-black text-xs mt-2 underline decoration-brand-green/30 underline-offset-4 hover:bg-transparent"
                                >
                                    إضافة وسيلة دفع
                                </Button>
                            </div>
                        ) : (
                            <div className="p-6 bg-brand-off-white/80 rounded-[24px] border-2 border-brand-beige mb-6 shadow-sm relative z-10">
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="h-12 w-16 bg-brand-blue rounded-xl flex items-center justify-center font-black text-xs text-white shadow-lg border border-white/10 uppercase italic">VISA</div>
                                    <div>
                                        <p className="text-sm font-black text-brand-blue">تنتهي بـ <span className="font-number tracking-widest text-brand-green">****</span></p>
                                        <p className="text-[11px] text-brand-blue-alt/40 font-black uppercase tracking-widest mt-0.5">مسجلة عبر Paymob</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => router.push('/dashboard/settings/billing/checkout?action=update_card')}
                                    variant="ghost"
                                    className="w-full h-12 rounded-xl text-xs font-black text-brand-blue-alt/60 hover:text-brand-blue bg-white border-2 border-brand-beige hover:border-brand-blue/10 transition-all"
                                >
                                    تحديث بيانات البطاقة
                                </Button>
                            </div>
                        )}
                        <div className="flex gap-3 relative z-10">
                            <div className="h-6 w-6 rounded-lg bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="h-3 w-3 text-brand-green" />
                            </div>
                            <p className="text-[11px] text-brand-blue-alt/40 font-black leading-relaxed">
                                سيتم تحصيل الرسوم تلقائياً في دورة الفوترة التالية. يمكنك إلغاء أو تغيير خطتك في أي وقت بسهولة.
                            </p>
                        </div>
                    </div>

                    <div className="bg-brand-blue rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl group">
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-green/20 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 group-hover:bg-brand-green/30 transition-all" />
                        <Zap className="h-10 w-10 text-brand-green mb-6 relative z-10" />
                        <h3 className="text-xl font-black mb-3 relative z-10 leading-tight">هل تحتاج لحلول مخصصة لنشاطك؟</h3>
                        <p className="text-[13px] text-white/50 font-bold leading-relaxed mb-8 relative z-10">لمؤسسات الأعمال الكبيرة التي تحتاج لعدد غير محدود من الموظفين والقنوات وتخصيصات تكنولوجية خاصة.</p>
                        <Button className="w-full h-14 rounded-2xl bg-white text-brand-blue text-sm font-black hover:bg-brand-off-white shadow-xl transition-all active:scale-95 relative z-10">
                            التحدث مع مستشار المبيعات
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Global missing icons used in the slide
function Zap(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.71 14 3v8h6l-10 11.71V13H4Z" /></svg> }
function History(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg> }
