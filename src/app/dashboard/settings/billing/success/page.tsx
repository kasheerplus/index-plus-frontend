'use client';

import { CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function CheckoutSuccessPage() {
    const router = useRouter();

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6 text-right font-cairo" dir="rtl">
            <div className="max-w-md w-full bg-white rounded-[40px] p-10 border-2 border-brand-beige shadow-2xl text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-brand-green/20 rounded-full animate-ping" />
                    <div className="relative bg-brand-green rounded-full h-24 w-24 flex items-center justify-center shadow-xl shadow-brand-green/40">
                        <CheckCircle2 className="h-12 w-12 text-white" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-black text-brand-blue">تم تفعيل اشتراكك بنجاح!</h1>
                    <p className="text-brand-blue-alt/50 font-bold leading-relaxed">أهلاً بك في باقتك الجديدة. جميع المميزات والحدود المحدثة أصبحت متاحة الآن في حسابك.</p>
                </div>

                <div className="bg-brand-off-white rounded-[24px] p-6 border-2 border-brand-beige space-y-4">
                    <div className="flex justify-between items-center text-sm font-black">
                        <span className="text-brand-blue-alt/40">رقم العملية</span>
                        <span className="text-brand-blue font-number">#TRX-{Math.floor(Math.random() * 90000) + 10000}</span>
                    </div>
                    <div className="h-px bg-brand-beige w-full" />
                    <div className="flex justify-between items-center text-sm font-black">
                        <span className="text-brand-blue-alt/40">حالة الدفع</span>
                        <span className="text-brand-green">مكتمل بالنجاح</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        onClick={() => router.push('/dashboard')}
                        className="h-14 rounded-2xl bg-brand-blue hover:bg-brand-blue-alt text-white font-black shadow-xl transition-all active:scale-95"
                    >
                        الذهاب للوحة التحكم
                        <ArrowLeft className="h-5 w-5 mr-2" />
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/dashboard/settings/billing')}
                        className="h-14 rounded-2xl text-brand-blue-alt/60 font-black hover:bg-brand-off-white"
                    >
                        عرض تفاصيل الفاتورة
                    </Button>
                </div>
            </div>
        </div>
    );
}
