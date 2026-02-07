'use client';

import { useState, useEffect } from 'react';
import { X, Link2, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface ConnectChannelModalProps {
    platform: {
        id: string;
        name: string;
        icon: any;
        color: string;
    };
    onClose: () => void;
    onSuccess: () => void;
}

export function ConnectChannelModal({ platform, onClose, onSuccess }: ConnectChannelModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSimulatingLogin, setIsSimulatingLogin] = useState(false);
    const [step, setStep] = useState<'login' | 'select_pages'>('login');
    const [selectedPages, setSelectedPages] = useState<string[]>([]);
    const [popupCheckInterval, setPopupCheckInterval] = useState<NodeJS.Timeout | null>(null);
    const [metaPages, setMetaPages] = useState<any[]>([]);

    const handleFetchMetaPages = async (code: string) => {
        setIsSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('يرجى تسجيل الدخول أولاً');

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/messaging/meta/exchange`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ code })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'فشل جلب حسابات Meta');
            }

            const pages = await response.json();
            setMetaPages(pages);
            setStep('select_pages');
        } catch (err: any) {
            console.error('Meta Exchange Error:', err);
            toast.error(err.message || 'فشل التواصل مع مخدم Index Plus');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            console.log('Received message in modal:', event);

            if (event.data?.status === 'success') {
                if (event.data.code) {
                    // Logic for real Meta Integration
                    console.log('Authorization code received:', event.data.code);
                    toast.success('تم المصادقة مع فيسبوك بنجاح');

                    // Proceed to fetch real pages using the code
                    handleFetchMetaPages(event.data.code);
                } else {
                    // Logic for Kasheer Plus or legacy simulation
                    const { platform_id, token } = event.data;
                    toast.success('تم التحقق من الحساب بنجاح');
                    if (platform.id === 'kasheer_plus') {
                        handleSubmit({ platform_id, token });
                    } else {
                        setStep('select_pages');
                    }
                }

                setIsSimulatingLogin(false);
                if (popupCheckInterval) clearInterval(popupCheckInterval);
            } else if (event.data?.status === 'error') {
                toast.error(`خطأ في المصادقة: ${event.data.error || 'فشل الاتصال'}`);
                setIsSimulatingLogin(false);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
            if (popupCheckInterval) clearInterval(popupCheckInterval);
        };
    }, [platform.id, popupCheckInterval]);

    const openAuthPopup = (url: string) => {
        setIsSimulatingLogin(true);
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
            url,
            'ExternalAuth',
            `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
        );

        // Safety interval to detect if popup was closed manually
        const checkPopup = setInterval(() => {
            if (!popup || popup.closed) {
                clearInterval(checkPopup);
                setIsSimulatingLogin(false);
                setPopupCheckInterval(null); // Clear the state as well
            }
        }, 1000);
        setPopupCheckInterval(checkPopup);
    };

    const handleMetaLogin = async () => {
        const FACEBOOK_APP_ID = '1455649529514353';
        const SCOPES = [
            'pages_messaging',
            'pages_manage_metadata',
            'pages_show_list',
            'instagram_manage_messages',
            'business_management',
            'public_profile'
        ].join(',');

        // For Vercel deployment, we use the current origin as base for callback
        const redirectUri = `${window.location.origin}/auth/facebook/callback`;

        const fbAuthUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${SCOPES}&response_type=code,granted_scopes`;

        openAuthPopup(fbAuthUrl);
    };

    const handleConfirmPages = async () => {
        if (selectedPages.length === 0) {
            toast.error('يرجى اختيار صفحة واحدة على الأقل');
            return;
        }

        // Find the selected account details
        const selectedAccount = metaPages.find(p => p.id === selectedPages[0]);
        if (!selectedAccount) return;

        await handleSubmit({
            platform_id: selectedAccount.id,
            token: selectedAccount.token
        });
    };

    const handleKasheerLogin = async () => {
        // Redirecting to the actual Kasheer Plus domain for a professional experience
        openAuthPopup(`https://kasheerplus.free.nf/bridge.php`);
    };

    const handleSubmit = async (authData: { platform_id: string, token: string }) => {
        setIsSubmitting(true);

        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            const companyId = userData.user?.user_metadata?.company_id;
            if (!companyId) throw new Error('Company ID not found. Please log in again.');

            // 1. Check for Abuse
            const { data: isAbuse, error: abuseError } = await supabase.rpc('check_channel_trial_abuse', {
                identifier_type_param: platform.id,
                identifier_value_param: authData.platform_id
            });

            if (abuseError) {
                console.error('Abuse check error:', abuseError);
                // If the RPC is missing, we might want to continue or show a specific error
                if (abuseError.code === 'P0001' || abuseError.message?.includes('function does not exist')) {
                    throw new Error('Database functions missing. Please run the provided migration in Supabase SQL Editor.');
                }
                throw abuseError;
            }

            if (isAbuse) {
                toast.error('عذراً، هذه القناة (أو هذا الحساب) تم استخدامه مسبقاً في فترة تجريبية أخرى. يرجى الاشتراك لتفعيلها.', {
                    duration: 5000
                });
                setIsSubmitting(false);
                return;
            }

            // 2. Insert into Channels
            const { error: insertError } = await supabase
                .from('channels')
                .insert({
                    company_id: companyId,
                    platform: platform.id,
                    token: authData.token,
                    platform_id: authData.platform_id,
                    status: 'connected'
                });

            if (insertError) throw insertError;

            // 3. Log usage if in trial mode
            const { data: sub, error: subError } = await supabase.from('subscriptions').select('status').eq('company_id', companyId).maybeSingle();
            if (subError) console.warn('Subscription fetch error:', subError);

            if (sub?.status === 'trial') {
                const { error: logError } = await supabase.rpc('log_trial_identifier', {
                    company_id_param: companyId,
                    identifier_type_param: platform.id,
                    identifier_value_param: authData.platform_id
                });
                if (logError) console.warn('Trial identifier log error:', logError);
            }

            toast.success(`تم ربط ${platform.name} بنجاح! 🚀`);
            setIsSubmitting(false);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Full Connection Error:', err);
            toast.error(err.message || 'حدث خطأ غير متوقع');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-cairo backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl border-4 border-white"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="connect-channel-title"
            >
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${platform.color}`}>
                            <platform.icon className="h-7 w-7" />
                        </div>
                        <div>
                            <h2 id="connect-channel-title" className="text-2xl font-black text-navy leading-none">ربط {platform.name}</h2>
                            <p className="text-[10px] text-brand-blue-alt/40 font-bold mt-1 tracking-widest uppercase">Integration Hub</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-gray-100 rounded-2xl transition-all hover:rotate-90"
                        aria-label="إغلاق"
                    >
                        <X className="h-6 w-6 text-gray-400" />
                    </button>
                </div>

                <div className="mb-8 p-6 bg-brand-blue/5 rounded-3xl border-2 border-brand-blue/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-blue/5 rounded-full blur-2xl -translate-y-12 translate-x-12" />
                    <div className="flex items-start gap-4 relative z-10">
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                            <CheckCircle2 className="h-5 w-5 text-brand-blue" />
                        </div>
                        <div className="text-sm text-brand-blue font-bold leading-relaxed">
                            <p className="mb-2">لربط {platform.name}، يرجى اتباع التعليمات:</p>
                            {platform.id === 'kasheer_plus' ? (
                                <p className="text-xs text-brand-blue-alt/60">سيتم توجيهك لتسجيل الدخول بحسابك في كاشير بلس للموافقة على مزامنة البيانات.</p>
                            ) : (
                                <p className="text-xs text-brand-blue-alt/60">سيتم فتح نافذة Meta لتسجيل الدخول واختيار الصفحة المراد ربطها بـ Index Plus.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {step === 'login' ? (
                        <>
                            <Button
                                onClick={platform.id === 'kasheer_plus' ? handleKasheerLogin : handleMetaLogin}
                                className={cn(
                                    "w-full h-16 rounded-3xl font-black text-lg gap-4 shadow-2xl transition-all active:scale-95 group overflow-hidden relative",
                                    platform.id === 'kasheer_plus' ? "bg-brand-blue hover:bg-brand-blue-alt shadow-brand-blue/20" :
                                        platform.id === 'whatsapp' ? "bg-green-500 hover:bg-green-600 shadow-green-500/20" :
                                            platform.id === 'facebook' ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20" :
                                                "bg-pink-600 hover:bg-pink-700 shadow-pink-600/20"
                                )}
                                disabled={isSimulatingLogin || isSubmitting}
                            >
                                {isSimulatingLogin || isSubmitting ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                        <platform.icon className="h-6 w-6 relative z-10" />
                                    </>
                                )}
                                <span className="relative z-10">
                                    {isSimulatingLogin ? 'جاري فتح نافذة التأكيد...' :
                                        isSubmitting ? 'جاري الربط...' :
                                            platform.id === 'kasheer_plus' ? 'تسجيل الدخول بـ Kasheer Plus' :
                                                `متابعة باستخدام Facebook`}
                                </span>
                            </Button>

                            <div className="bg-brand-off-white p-5 rounded-3xl border-2 border-brand-beige border-dashed">
                                <p className="text-[10px] text-brand-blue-alt/40 font-bold text-center leading-relaxed">
                                    {platform.id === 'kasheer_plus'
                                        ? 'بالضغط على الزر، أنت تمنح إندكس بلس صلاحية الوصول للمنتجات والمبيعات والمخازن لمزامنتها آلياً.'
                                        : 'بالضغط على الزر، أنت توافق على منح إندكس بلس صلاحية الوصول لرسائل الصفحة والرد عليها نيابة عنك.'}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                            <h3 className="text-sm font-black text-navy mb-4">اختر الصفحات المراد ربطها:</h3>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {metaPages.map((page: any) => (
                                    <div
                                        key={page.id}
                                        onClick={() => {
                                            setSelectedPages(prev =>
                                                prev.includes(page.id)
                                                    ? prev.filter(id => id !== page.id)
                                                    : [...prev, page.id]
                                            );
                                        }}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer",
                                            selectedPages.includes(page.id)
                                                ? "border-brand-blue bg-brand-blue/5"
                                                : "border-brand-beige hover:border-brand-blue/30"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-brand-beige overflow-hidden flex items-center justify-center font-bold text-navy">
                                                {page.icon ? (
                                                    <img src={page.icon} alt={page.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{page.name[0]}</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-navy">{page.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-brand-blue-alt/40 font-bold capitalize">{page.platform}</span>
                                                    <span className="text-[10px] text-brand-blue-alt/20">•</span>
                                                    <p className="text-[10px] text-brand-blue-alt/40 font-bold">
                                                        {typeof page.fans === 'number' ? `${(page.fans / 1000).toFixed(1)}k متابع` : page.fans}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {selectedPages.includes(page.id) && (
                                            <CheckCircle2 className="h-5 w-5 text-brand-blue" />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <Button
                                onClick={handleConfirmPages}
                                className="w-full h-14 bg-brand-blue hover:bg-brand-blue-alt text-white rounded-2xl font-black mt-4 shadow-xl shadow-brand-blue/10"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'تأكيد الربط'}
                            </Button>
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-full h-14 font-black text-brand-blue-alt/40 hover:text-brand-blue hover:bg-brand-off-white rounded-2xl transition-all"
                        disabled={isSimulatingLogin || isSubmitting}
                    >
                        إلغاء العملية
                    </Button>
                </div>

            </div>
        </div>
    );
}
