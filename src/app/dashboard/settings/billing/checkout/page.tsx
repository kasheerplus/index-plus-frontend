'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    CreditCard,
    Wallet,
    ShieldCheck,
    ArrowRight,
    Loader2,
    CheckCircle2,
    Lock,
    Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// Plan data to show summary
const planData: Record<string, { name: string, priceMonthly: string, priceYearly: string }> = {
    'starter': { name: 'باقة البداية', priceMonthly: '499', priceYearly: '399' },
    'pro': { name: 'الباقة الاحترافية', priceMonthly: '999', priceYearly: '799' },
    'business': { name: 'باقة الأعمال', priceMonthly: '2499', priceYearly: '1999' },
};

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const planId = searchParams.get('plan') || 'pro';
    const cycle = searchParams.get('cycle') || 'monthly';

    const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');

    const selectedPlan = planData[planId] || planData['pro'];
    const amount = cycle === 'monthly' ? selectedPlan.priceMonthly : selectedPlan.priceYearly;
    const totalAmount = cycle === 'monthly' ? amount : (parseInt(amount) * 12).toString();

    const handlePayNow = async () => {
        setIsProcessing(true);

        // --- PAYMOB INTEGRATION PLACEHOLDER ---
        // 1. Authenticate with Paymob API
        // 2. Register Order
        // 3. Create Payment Token
        // 4. Redirect to Paymob IFrame or Checkout Page

        console.log('Initiating Paymob Payment...', { planId, cycle, paymentMethod, totalAmount });

        // Simulating API Latency
        setTimeout(() => {
            setIsProcessing(false);
            setStep('success');
            toast.success('تمت عملية الدفع بنجاح (محاكاة التجربة)');
        }, 3000);
    };

    if (step === 'success') {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500 text-center space-y-8">
                <div className="h-24 w-24 rounded-full bg-brand-green/20 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-12 w-12 text-brand-green" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-brand-blue">مبروك! تم تفعيل اشتراكك</h2>
                    <p className="text-brand-blue-alt/60 font-bold max-w-sm">تم استلام الدفعة بنجاح وتحديث صلاحيات حسابك للوصول لكافة مميزات باقة {selectedPlan.name}.</p>
                </div>
                <div className="bg-brand-off-white border-2 border-brand-beige rounded-2xl p-6 w-full max-w-sm text-right">
                    <div className="flex justify-between items-center border-b-2 border-brand-beige pb-3 mb-3">
                        <span className="text-sm font-black text-brand-blue">رقم العملية</span>
                        <span className="text-sm font-number font-bold text-brand-blue-alt">#PM-88293-XP</span>
                    </div>
                    <div className="flex justify-between items-center font-black text-brand-blue">
                        <span className="text-sm">المبلغ الإجمالي</span>
                        <span className="font-number">{totalAmount} ج.م</span>
                    </div>
                </div>
                <Button
                    onClick={() => router.push('/dashboard/settings/billing')}
                    className="h-14 px-10 rounded-2xl bg-brand-blue hover:bg-brand-blue-alt text-white font-black"
                >
                    الذهاب للوحة التحكم
                    <ArrowRight className="h-4 w-4 mr-2" />
                </Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Left Column: Payment Details */}
            <div className="space-y-8">
                <div className="bg-white rounded-[32px] p-8 border-2 border-brand-beige shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 rounded-2xl bg-brand-off-white flex items-center justify-center border-2 border-brand-beige shadow-sm">
                            <CreditCard className="h-6 w-6 text-brand-blue" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-brand-blue">وسيلة الدفع</h2>
                            <p className="text-xs text-brand-blue-alt/40 font-bold mt-1">اختر طريقة الدفع المناسبة لك لإتمام عملية الاشتراك.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setPaymentMethod('card')}
                            className={cn(
                                "flex flex-col items-center justify-center p-6 rounded-[24px] border-2 transition-all gap-4 group",
                                paymentMethod === 'card'
                                    ? "border-brand-blue bg-brand-blue/5 shadow-lg shadow-brand-blue/5"
                                    : "border-brand-beige hover:border-brand-blue/20"
                            )}
                        >
                            <div className={cn(
                                "h-12 w-12 rounded-xl flex items-center justify-center transition-all",
                                paymentMethod === 'card' ? "bg-brand-blue text-white" : "bg-brand-off-white text-brand-blue-alt/40 group-hover:bg-brand-blue/10"
                            )}>
                                <CreditCard className="h-6 w-6" />
                            </div>
                            <span className={cn("text-xs font-black", paymentMethod === 'card' ? "text-brand-blue" : "text-brand-blue-alt/40")}>بطاقة ائتمان</span>
                        </button>

                        <button
                            onClick={() => setPaymentMethod('wallet')}
                            className={cn(
                                "flex flex-col items-center justify-center p-6 rounded-[24px] border-2 transition-all gap-4 group",
                                paymentMethod === 'wallet'
                                    ? "border-brand-blue bg-brand-blue/5 shadow-lg shadow-brand-blue/5"
                                    : "border-brand-beige hover:border-brand-blue/20"
                            )}
                        >
                            <div className={cn(
                                "h-12 w-12 rounded-xl flex items-center justify-center transition-all",
                                paymentMethod === 'wallet' ? "bg-brand-blue text-white" : "bg-brand-off-white text-brand-blue-alt/40 group-hover:bg-brand-blue/10"
                            )}>
                                <Wallet className="h-6 w-6" />
                            </div>
                            <span className={cn("text-xs font-black", paymentMethod === 'wallet' ? "text-brand-blue" : "text-brand-blue-alt/40")}>محفظة إلكترونية</span>
                        </button>
                    </div>

                    <div className="mt-8 p-6 bg-brand-off-white/50 rounded-2xl border-2 border-brand-beige border-dashed space-y-4">
                        <div className="flex flex-col items-center justify-center py-10 gap-3 border-2 border-brand-blue/10 border-dashed rounded-xl bg-white/50">
                            <Lock className="h-8 w-8 text-brand-blue/20" />
                            <p className="text-[10px] font-black text-brand-blue/30 uppercase tracking-widest text-center px-6">هنا سيظهر نموذج إدخال البطاقة الآمن الخاص بـ Paymob (IFrame)</p>
                        </div>
                        <p className="text-xs text-brand-blue-alt/50 font-bold leading-relaxed">
                            {paymentMethod === 'card'
                                ? "سيتم توجيهك بأمان إلى بوابة دفع Paymob لإدخال بيانات بطاقتك. جميع البيانات مشفرة بالكامل."
                                : "ادفع مباشرة عبر فودافون كاش، اتصالات كاش، أو أي محفظة إلكترونية تابعة للبنوك المصرية."
                            }
                        </p>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-brand-green" />
                            <span className="text-[10px] font-black text-brand-green uppercase">دفع آمن 100% مشفر بواسطة SSL</span>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handlePayNow}
                    disabled={isProcessing}
                    className="w-full h-16 rounded-[24px] bg-brand-green hover:bg-brand-green-alt text-white font-black text-lg shadow-2xl shadow-brand-green/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="h-6 w-6 animate-spin" />
                            جاري الاتصال بـ Paymob...
                        </>
                    ) : (
                        <>
                            إتمام الدفع الآن
                            <ArrowLeft className="h-5 w-5" />
                        </>
                    )}
                </Button>

                <div className="flex items-center justify-center gap-4 opacity-40">
                    <Lock className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">تأمين بوابة الدفع عبر Paymob</span>
                </div>
            </div>

            {/* Right Column: Summary */}
            <div className="lg:sticky lg:top-24 h-fit">
                <div className="bg-brand-blue rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-brand-green/10 rounded-full blur-3xl -translate-x-12 -translate-y-12" />

                    <h3 className="text-xl font-black mb-6 flex items-center gap-3 relative z-10">
                        <Receipt className="h-5 w-5 text-brand-green" />
                        ملخص طلب الاشتراك
                    </h3>

                    <div className="space-y-6 relative z-10">
                        <div className="flex justify-between items-start border-b border-white/10 pb-6 mb-6">
                            <div>
                                <h4 className="font-black text-lg">{selectedPlan.name}</h4>
                                <p className="text-xs text-white/50 font-bold mt-1">نظام فوترة {cycle === 'monthly' ? 'شهري' : 'سنوي'}</p>
                            </div>
                            <span className="font-number font-black text-xl">{amount} ج.م</span>
                        </div>

                        <div className="space-y-4 text-sm font-bold">
                            <div className="flex justify-between">
                                <span className="text-white/50">السعر الأساسي</span>
                                <span className="font-number">{amount} ج.م</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/50">مدة الاشتراك</span>
                                <span>{cycle === 'monthly' ? 'شهر واحد' : '12 شهر'}</span>
                            </div>
                            <div className="flex justify-between text-brand-green">
                                <span>الخصم المطبق</span>
                                <span className="font-number">0.00 ج.م</span>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/20 mt-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-white/50 font-black uppercase tracking-widest mb-1">المبلغ المطلوب دفعه</p>
                                    <p className="text-4xl font-black font-number">{totalAmount}</p>
                                </div>
                                <span className="text-xl font-black text-brand-green mb-1">جنية مصري</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 p-4 bg-white/5 rounded-2xl border border-white/10 text-[10px] font-bold text-white/40 text-center relative z-10 leading-relaxed">
                        بالضغط على إتمام الدفع، أنت توافق على شروط وأحكام منصة Index Plus وسيتم البدء في معالجة طلبك فوراً.
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-40">
                <Loader2 className="h-10 w-10 text-brand-green animate-spin" />
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}

// Global missing icons used in the slide
function ArrowLeft(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17-5-5 5-5" /><path d="M18 12H6" /></svg> }
