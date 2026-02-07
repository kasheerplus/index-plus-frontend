'use client';

import { XCircle, RefreshCw, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function CheckoutFailurePage() {
    const router = useRouter();

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6 text-right font-cairo" dir="rtl">
            <div className="max-w-md w-full bg-white rounded-[40px] p-10 border-2 border-brand-beige shadow-2xl text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-red-500/10 rounded-full" />
                    <div className="relative bg-red-500 rounded-full h-24 w-24 flex items-center justify-center shadow-xl shadow-red-500/40">
                        <XCircle className="h-12 w-12 text-white" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-black text-brand-blue">عذراً، فشلت عملية الدفع</h1>
                    <p className="text-brand-blue-alt/50 font-bold leading-relaxed">لم نتمكن من إتمام العملية حالياً. قد يكون السبب مشكلة في بيانات البطاقة أو رفض من البنك المصدر.</p>
                </div>

                <div className="bg-red-50 rounded-[24px] p-6 border-2 border-red-100 space-y-2">
                    <p className="text-xs font-black text-red-900/60 uppercase tracking-widest">توصيات سريعة</p>
                    <ul className="text-sm text-red-900/80 font-bold space-y-2 text-right">
                        <li>• تأكد من صحة رقم البطاقة وتاريخ الانتهاء.</li>
                        <li>• تأكد من وجود رصيد كافٍ في الحساب.</li>
                        <li>• جرب استخدام وسيلة دفع أخرى (مثلاً محفظة إلكترونية).</li>
                    </ul>
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        onClick={() => router.push('/dashboard/settings/billing/checkout')}
                        className="h-14 rounded-2xl bg-brand-blue hover:bg-brand-blue-alt text-white font-black shadow-xl transition-all active:scale-95"
                    >
                        المحاولة مرة أخرى
                        <RefreshCw className="h-5 w-5 mr-2" />
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => window.open('https://t.me/your_support', '_blank')}
                        className="h-14 rounded-2xl text-brand-blue-alt/60 font-black hover:bg-brand-off-white"
                    >
                        التواصل مع الدعم الفني
                        <MessageCircle className="h-5 w-5 mr-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
