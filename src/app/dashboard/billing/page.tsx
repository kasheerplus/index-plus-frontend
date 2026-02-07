'use client';

import { useState, useEffect } from 'react';
import {
    Check,
    Upload,
    Info,
    AlertCircle,
    Smartphone,
    Copy,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { SettingsHeader } from '@/components/settings/settings-header';

const plans = [
    {
        id: 'free',
        name: 'باقة البداية (مجانية)',
        price: '٠',
        features: ['قناة واحدة (FB/Insta)', '٥٠ محادثة/شهر', '١٠٠ رد آلي', 'مستخدم واحد', 'بدون ربط كاشير'],
        recommended: false
    },
    {
        id: 'basic',
        name: 'باقة التاجر (Basic)',
        price: '٢٩٩',
        features: ['قناتين (FB + Insta)', '١٠٠٠ محادثة/شهر', 'ردود آلية متقدمة', 'CRM للعملاء', 'مستخدم واحد'],
        recommended: false
    },
    {
        id: 'business',
        name: 'باقة الأعمال (Business)',
        price: '٤٩٩',
        features: ['جميع القنوات (+WhatsApp)', 'ربط كاشير بلس (Sync)', 'فواتير تلقائية', 'مستخدمين اثنين', 'تحليلات متقدمة'],
        recommended: true
    },
    {
        id: 'pro',
        name: 'باقة المحترفين (Pro)',
        price: '٧٩٩',
        features: ['طلبات غير محدودة', 'تزامن لحظي (Priority)', '٤ مستخدمين', 'فريق مبيعات كامل', 'دعم فني خاص'],
        recommended: false
    },
];

export default function BillingPage() {
    const [subscription, setSubscription] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState('business');
    const [copied, setCopied] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [companyId, setCompanyId] = useState<string | null>(null);

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const cid = user.app_metadata?.company_id || user.user_metadata?.company_id;
                console.log('🔍 Current User Session:', { email: user.email, company_id: cid, role: user.app_metadata?.role });
                setCompanyId(cid);
            }

            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .single();

            if (error) {
                console.warn('Subscription Fetch Warning:', error.message);
            }
            if (data) setSubscription(data);
        } catch (err) {
            console.error('Fetch Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const copyNumber = (num: string) => {
        navigator.clipboard.writeText(num);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const normalizeArabicNumerals = (str: string) => {
        return str
            .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
            .replace(/[0-9]/g, (d) => d) // Keep Western digits
            .replace(/,/g, ''); // Remove commas
    };

    const submitProof = async () => {
        if (!file) {
            alert('يرجى اختيار صورة الإثبات أولاً');
            return;
        }

        if (!companyId) {
            console.error('❌ Error: companyId is null in state');
            alert('خطأ: لم يتم العثور على معرّف الشركة. يرجى تسجيل الخروج والدخول مرة أخرى.');
            return;
        }

        setIsUploading(true);
        try {
            const plan = plans.find(p => p.id === selectedPlan);
            const amountStr = plan?.price || '0';
            const normalizedAmount = parseFloat(normalizeArabicNumerals(amountStr));

            console.log('📝 Attempting Insert:', {
                amount: normalizedAmount,
                company_id: companyId,
                file: file.name
            });

            const { error } = await supabase
                .from('payment_proofs')
                .insert({
                    amount: normalizedAmount,
                    proof_image_url: 'pending_upload_' + file.name,
                    status: 'pending',
                    company_id: companyId
                });

            if (error) {
                console.error('❌ Supabase Error Details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }
            alert('تم إرسال إثبات الدفع بنجاح! سيتم مراجعته وتفعيل الحساب خلال ٢٤ ساعة.');
            setFile(null);
        } catch (err: any) {
            console.error('🔥 Caught Exception:', err);
            const errorMessage = err.message || err.error_description || 'خطأ غير معروف في الخدمة';
            alert(`حدث خطأ أثناء الإرسال: ${errorMessage}`);
        } finally {
            setIsUploading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center font-cairo">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 bg-brand-off-white min-h-full font-cairo text-right" dir="rtl">
            <SettingsHeader />

            {/* Current Status Banner (Exact Brand Style) */}
            <div className="bg-brand-blue rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-brand-green" />
                            <h2 className="text-3xl font-black">
                                الباقة الحالية: {plans.find(p => p.id === (subscription?.plan_id || 'pro'))?.name || 'مخصصة'}
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
                            <p className="text-white/60 font-black uppercase tracking-widest text-[11px]">
                                الحالة: {subscription?.status === 'active' ? 'نشط' : 'قيد المراجعة'}
                            </p>
                        </div>
                    </div>
                    <div className="px-8 py-5 bg-white/10 backdrop-blur-xl rounded-2xl border-2 border-white/10 text-center min-w-[200px]">
                        <span className="text-[11px] uppercase font-black tracking-widest block mb-1 text-white/50">الرصيد المتوفر</span>
                        <span className="text-3xl font-black text-brand-green font-number">0.00 <span className="text-sm">ج.م</span></span>
                    </div>
                </div>
                <div className="absolute top-0 left-0 w-96 h-96 bg-brand-green/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] translate-x-1/2 translate-y-1/2" />
            </div>

            {/* Plans Section */}
            <div className="space-y-8">
                <h3 className="text-2xl font-black text-brand-blue uppercase tracking-tight">اختر باقة التجديد</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            onClick={() => setSelectedPlan(plan.id)}
                            className={cn(
                                "bg-white rounded-[32px] p-8 border-2 transition-all cursor-pointer relative flex flex-col justify-between overflow-hidden group",
                                selectedPlan === plan.id
                                    ? "border-brand-green shadow-xl shadow-brand-green/10 scale-[1.02] bg-gradient-to-b from-white to-brand-green/5"
                                    : "border-brand-beige hover:border-brand-green/30 hover:bg-brand-off-white/50"
                            )}
                        >
                            {plan.recommended && (
                                <div className="absolute top-0 left-0 bg-brand-green text-white px-6 py-1.5 rounded-br-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                                    الأكثر طلباً
                                </div>
                            )}
                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-xl font-black text-brand-blue mb-3">{plan.name}</h4>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-brand-blue font-number tracking-tighter">{plan.price}</span>
                                        <span className="text-sm font-bold text-brand-blue-alt/60">ج.م / شهرياً</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {plan.features.map(f => (
                                        <div key={f} className="flex items-center gap-4 text-sm font-bold text-brand-blue-alt/80">
                                            <div className="h-6 w-6 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green flex-shrink-0 group-hover:scale-110 transition-transform">
                                                <Check className="h-3.5 w-3.5" />
                                            </div>
                                            <span>{f}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-10">
                                <div className={cn(
                                    "h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2 transition-all",
                                    selectedPlan === plan.id
                                        ? "bg-brand-green text-white border-brand-green shadow-lg shadow-brand-green/20"
                                        : "bg-brand-off-white text-brand-blue-alt/60 border-brand-beige group-hover:bg-white"
                                )}>
                                    {selectedPlan === plan.id ? 'تم اختيار الباقة' : 'اختر هذه الباقة'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Payment Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-[32px] p-8 border-2 border-brand-beige shadow-sm space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-brand-blue text-white flex items-center justify-center shadow-lg shadow-brand-blue/20">
                            <Info className="h-6 w-6" />
                        </div>
                        <h3 className="text-2xl font-black text-brand-blue">تعليمات الدفع</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="p-6 rounded-2xl bg-brand-off-white/80 border-2 border-brand-beige flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all">
                            <div className="flex items-center gap-5">
                                <div className="h-14 w-14 rounded-xl bg-white flex items-center justify-center shadow-md text-brand-green border border-brand-beige">
                                    <Smartphone className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-brand-blue-alt/50 uppercase tracking-widest mb-1">InstaPay / فودافون كاش</p>
                                    <p className="text-xl font-black text-brand-blue font-number">01012345678</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                className="h-12 w-12 rounded-xl hover:bg-brand-green/10 hover:text-brand-green transition-all"
                                onClick={() => copyNumber('01012345678')}
                            >
                                {copied ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <Copy className="h-6 w-6" />}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-8 border-2 border-brand-beige shadow-sm space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-brand-green text-white flex items-center justify-center shadow-lg shadow-brand-green/20">
                            <Upload className="h-6 w-6" />
                        </div>
                        <h3 className="text-2xl font-black text-brand-blue">رفع إثبات الدفع</h3>
                    </div>

                    <label className="aspect-[16/9] rounded-2xl border-4 border-dashed border-brand-beige bg-brand-off-white/50 flex flex-col items-center justify-center space-y-5 cursor-pointer hover:bg-white hover:border-brand-green/30 hover:shadow-xl transition-all p-10 text-center group">
                        <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                        <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-xl border-2 border-brand-beige group-hover:scale-110 transition-transform">
                            <Upload className={cn("h-10 w-10 transition-all", file ? "text-brand-green" : "text-brand-blue-alt/30")} />
                        </div>
                        <div>
                            <p className="text-base font-black text-brand-blue">
                                {file ? `تم اختيار: ${file.name}` : "اضغط هنا لرفع الصورة"}
                            </p>
                            <p className="text-[11px] text-brand-blue-alt/50 font-black uppercase tracking-widest mt-1">JPG, PNG (أقصى حجم ٥ ميجابايت)</p>
                        </div>
                    </label>

                    <Button
                        className="w-full h-14 text-xl font-black shadow-xl shadow-brand-green/20 bg-brand-green hover:bg-brand-green-alt rounded-2xl group"
                        onClick={submitProof}
                        isLoading={isUploading}
                        disabled={!file}
                    >
                        تأكيد إرسال الإثبات
                        <CheckCircle2 className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
