'use client';

import { useEffect, useState } from 'react';
import {
    MessageCircle,
    Instagram,
    Facebook,
    Plus,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
    ShieldCheck,
    Package,
    Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SettingsHeader } from '@/components/settings/settings-header';
import { ConnectChannelModal } from '@/components/settings/connect-channel-modal';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const platforms = [
    {
        id: 'kasheer_plus',
        name: 'Kasheer Plus Bridge',
        icon: Package,
        color: 'bg-brand-blue',
        description: 'اربط برنامج الكاشير والمخازن الخاص بك لمزامنة المنتجات والمبيعات آلياً.',
        connected: false,
        status: 'active'
    },
    {
        id: 'whatsapp',
        name: 'WhatsApp Business',
        icon: MessageCircle,
        color: 'bg-green-500',
        description: 'تواصل مع عملائك مباشرة عبر تطبيق الدردشة الأكثر شهرة.',
        connected: true,
        status: 'active'
    },
    {
        id: 'facebook',
        name: 'Facebook Messenger',
        icon: Facebook,
        color: 'bg-blue-600',
        description: 'إدارة رسائل صفحتك التجارية على فيسبوك من مكان واحد.',
        connected: true,
        status: 'active'
    },
    {
        id: 'instagram',
        name: 'Instagram DM',
        icon: Instagram,
        color: 'bg-pink-600',
        description: 'قم بالرد على استفسارات المتابعين والدايركت مسج بسرعة.',
        connected: false,
        status: 'disconnected'
    },
    {
        id: 'tiktok',
        name: 'TikTok DM',
        icon: MessageCircle,
        color: 'bg-black',
        description: 'قريباً: تواصل مع جمهورك النشط على تيك توك.',
        connected: false,
        status: 'coming_soon'
    },
];

export default function ChannelsPage() {
    const router = useRouter();
    const [selectedPlatform, setSelectedPlatform] = useState<any>(null);
    const [subscription, setSubscription] = useState<any>(null);
    const [dbChannels, setDbChannels] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            await Promise.all([
                fetchSubscription(),
                fetchChannels()
            ]);
        };
        init();
    }, []);

    const fetchSubscription = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const companyId = user.user_metadata?.company_id;
            const { data } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('company_id', companyId)
                .maybeSingle();

            setSubscription(data);
        } catch (err) {
            console.error('Error fetching subscription:', err);
        }
    };

    const fetchChannels = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const companyId = user.user_metadata?.company_id;
            const { data } = await supabase
                .from('channels')
                .select('*')
                .eq('company_id', companyId);

            setDbChannels(data || []);
        } catch (err) {
            console.error('Error fetching channels:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisconnect = async (channelId: string) => {
        if (!confirm('هل أنت متأكد من رغبتك في فصل هذه القناة؟ سيؤدي ذلك لتوقف استقبال الرسائل.')) return;

        try {
            const { error } = await supabase
                .from('channels')
                .delete()
                .eq('id', channelId);

            if (error) throw error;
            toast.success('تم فصل القناة بنجاح');
            fetchChannels();
        } catch (err) {
            console.error('Disconnect error:', err);
            toast.error('حدث خطأ أثناء محاولة فصل القناة');
        }
    };

    const isSuspended = subscription?.status === 'suspended' ||
        (subscription?.ends_at && new Date(subscription.ends_at) < new Date());

    const enrichedPlatforms = platforms.map(p => {
        const dbChannel = dbChannels.find(dbc => dbc.platform === p.id);
        return {
            ...p,
            connected: !!dbChannel,
            dbId: dbChannel?.id,
            platform_id: dbChannel?.platform_id,
        };
    });

    const handleConnect = (platform: any) => {
        if (isSuspended) {
            toast.error('حسابك معلق حالياً. يرجى تجديد الاشتراك للتمكن من ربط قنوات جديدة.', {
                duration: 5000,
                icon: '🚫'
            });
            router.push('/dashboard/settings/billing/plans');
            return;
        }
        setSelectedPlatform(platform);
    };

    return (
        <div className="space-y-12 pt-28 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700 font-cairo text-right min-h-screen bg-brand-off-white/30" dir="rtl">
            <div className="bg-white rounded-[32px] p-8 border-2 border-brand-beige shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-brand-blue text-white flex items-center justify-center shadow-lg shadow-brand-blue/20">
                        <MessageCircle className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-brand-blue">القنوات والاتصالات</h1>
                        <p className="text-sm text-brand-blue-alt/60 font-bold mt-1">ربط فيسبوك، إنستجرام، واتساب، وكاشير بلس</p>
                    </div>
                </div>
            </div>

            {selectedPlatform && (
                <ConnectChannelModal
                    platform={selectedPlatform}
                    onClose={() => setSelectedPlatform(null)}
                    onSuccess={() => {
                        fetchChannels();
                    }}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrichedPlatforms.map((platform) => (
                    <div
                        key={platform.id}
                        className={cn(
                            "bg-white rounded-[32px] p-8 border-2 border-brand-beige shadow-sm flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden",
                            platform.status === 'coming_soon' && "opacity-60 grayscale cursor-not-allowed"
                        )}
                    >
                        <div className="absolute top-0 left-0 w-24 h-24 bg-brand-off-white/50 rounded-full blur-[40px] -translate-x-10 -translate-y-10" />
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center text-white shadow-xl border-4 border-white/20", platform.color)}>
                                    <platform.icon className="h-8 w-8" />
                                </div>
                                {platform.connected ? (
                                    <div className="flex items-center gap-1.5 px-4 py-1.5 bg-green-50 text-green-600 rounded-full border-2 border-green-100 shadow-sm">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="text-[11px] font-black uppercase tracking-widest">تـم الربـط</span>
                                    </div>
                                ) : platform.status === 'coming_soon' ? (
                                    <div className="px-4 py-1.5 bg-brand-off-white text-brand-blue-alt/30 rounded-full border-2 border-brand-beige">
                                        <span className="text-[11px] font-black uppercase tracking-widest">قريـباً</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-4 py-1.5 bg-red-50 text-red-600 rounded-full border-2 border-red-100 shadow-sm">
                                        <AlertCircle className="h-4 w-4" />
                                        <span className="text-[11px] font-black uppercase tracking-widest">غير متـصل</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2">
                                <h3 className="text-2xl font-black text-brand-blue mb-2">{platform.name}</h3>
                                <p className="text-[13px] text-brand-blue-alt/50 font-bold leading-relaxed">{platform.description}</p>
                            </div>

                            {platform.connected && (
                                <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-xl border border-gray-50">
                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                    <span className="text-[10px] font-black text-navy">التحقق من الهوية مفعل</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t-2 border-brand-off-white flex items-center justify-between">
                            {platform.connected ? (
                                <Button
                                    onClick={() => handleDisconnect(platform.dbId)}
                                    variant="ghost"
                                    className="text-sm font-black text-red-500 hover:bg-red-50 hover:text-red-600 gap-3 px-6 h-12 rounded-xl border border-transparent hover:border-red-100 transition-all font-cairo"
                                >
                                    إلغاء الربط وفصل القناة
                                </Button>
                            ) : platform.status === 'coming_soon' ? (
                                <span className="text-xs font-black text-brand-blue-alt/20 tracking-widest uppercase">غير متاح حالياً</span>
                            ) : (
                                <Button
                                    className={cn(
                                        "w-full text-base font-black gap-3 h-14 bg-brand-blue hover:bg-brand-blue-alt shadow-xl shadow-brand-blue/10 rounded-2xl transition-all active:scale-95",
                                        isSuspended && "opacity-80 grayscale"
                                    )}
                                    onClick={() => handleConnect(platform)}
                                >
                                    {isSuspended ? (
                                        <>
                                            الحساب معلق
                                            <Lock className="h-4 w-4" />
                                        </>
                                    ) : (
                                        <>
                                            ربط القناة الآن
                                            <ExternalLink className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
