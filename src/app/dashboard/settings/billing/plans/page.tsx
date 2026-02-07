'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Check,
    ArrowRight,
    Zap,
    Shield,
    Crown,
    MessageSquare,
    Users,
    Package,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const plans = [
    {
        id: 'starter',
        name: 'البداية',
        price: '499',
        priceYearly: '399',
        description: 'مثالية للمشاريع الناشئة لبدء أتمتة التواصل مع العملاء.',
        features: [
            '500 رسالة شهرياً',
            '3 موظفين كحد أقصى',
            'ربط قناة تواصل واحدة',
            'ربط كاشير بلس (مجاناً)',
            'دعم فني عبر الإيميل'
        ],
        icon: MessageSquare,
        color: 'brand-blue',
        popular: false
    },
    {
        id: 'pro',
        name: 'الاحترافية',
        price: '999',
        priceYearly: '799',
        description: 'الخيار الأفضل للشركات المتوسطة التي تبحث عن النمو السريع.',
        features: [
            '2,500 رسالة شهرياً',
            '15 موظف كحد أقصى',
            'ربط جميع قنوات التواصل (واتساب، فيسبوك، انستجرام)',
            'ربط كاشير بلس (مجاناً)',
            'دعم فني سريع 24/7',
            'تقارير متقدمة وذكاء اصطناعي'
        ],
        icon: Zap,
        color: 'brand-green',
        popular: true
    },
    {
        id: 'business',
        name: 'الأعمال',
        price: '2499',
        priceYearly: '1999',
        description: 'حلول متكاملة للمؤسسات الكبيرة مع تحكم كامل وصلاحيات متقدمة.',
        features: [
            'رسائل غير محدودة*',
            'موظفين غير محدودين',
            'قنوات تواصل غير محدودة',
            'ربط كاشير بلس (مجاناً)',
            'مدير حساب خاص',
            'تخصيص كامل للهوية',
            'ربط API مفتوح'
        ],
        icon: Crown,
        color: 'brand-blue-alt',
        popular: false
    }
];

export default function PlansPage() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const router = useRouter();

    const handleSelectPlan = (planId: string) => {
        router.push(`/dashboard/settings/billing/checkout?plan=${planId}&cycle=${billingCycle}`);
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 text-right font-cairo pb-20" dir="rtl">
            {/* Header */}
            <div className="text-center space-y-6 max-w-3xl mx-auto">
                <Link
                    href="/dashboard/settings/billing"
                    className="inline-flex items-center gap-2 text-brand-blue-alt/40 hover:text-brand-blue font-black text-sm mb-4 transition-all"
                >
                    <ArrowRight className="h-4 w-4" />
                    العودة للفوترة
                </Link>
                <h1 className="text-4xl md:text-5xl font-black text-brand-blue leading-tight">اختر الخطة المناسبة <span className="text-brand-green">لنمو أعمالك</span></h1>
                <p className="text-lg text-brand-blue-alt/60 font-bold">خطط مرنة مصممة لتناسب احتياجاتك في كل مرحلة من مراحل تطور شركتك.</p>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4 pt-4">
                    <span className={cn("text-sm font-black transition-all", billingCycle === 'monthly' ? "text-brand-blue" : "text-brand-blue-alt/40")}>شهرياً</span>
                    <button
                        onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                        className="w-20 h-10 bg-brand-blue/5 border-2 border-brand-blue/10 rounded-full relative p-1.5 transition-all hover:bg-brand-blue/10 group"
                    >
                        <div className={cn(
                            "w-6 h-6 rounded-full shadow-xl transition-all transform flex items-center justify-center",
                            billingCycle === 'yearly' ? "bg-brand-green -translate-x-10" : "bg-brand-blue translate-x-0"
                        )}>
                            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                        </div>
                    </button>
                    <span className={cn("text-sm font-black transition-all", billingCycle === 'yearly' ? "text-brand-blue" : "text-brand-blue-alt/40")}>
                        سنوياً <span className="text-brand-green text-[10px] bg-brand-green/10 px-3 py-1 rounded-full mr-2 font-black border border-brand-green/20">وفر 20%</span>
                    </span>
                </div>
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={cn(
                            "relative bg-white rounded-[40px] p-10 border-2 transition-all hover:scale-[1.02] duration-300",
                            plan.popular
                                ? "border-brand-green shadow-2xl shadow-brand-green/10 scale-105 z-10"
                                : "border-brand-beige shadow-sm hover:border-brand-blue/20"
                        )}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-green text-white px-6 py-1.5 rounded-full text-xs font-black shadow-lg">
                                الأكثر اختياراً
                            </div>
                        )}

                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className={cn(
                                    "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg",
                                    plan.id === 'pro' ? "bg-brand-green text-white" : "bg-brand-off-white text-brand-blue"
                                )}>
                                    <plan.icon className="h-7 w-7" />
                                </div>
                                <div className="text-left">
                                    <span className="text-3xl font-black text-brand-blue font-number">
                                        {billingCycle === 'monthly' ? plan.price : plan.priceYearly}
                                    </span>
                                    <span className="text-xs text-brand-blue-alt/40 font-bold block">جنية / شهرياً</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-2xl font-black text-brand-blue mb-2">{plan.name}</h3>
                                <p className="text-sm text-brand-blue-alt/50 font-bold leading-relaxed">{plan.description}</p>
                            </div>

                            <ul className="space-y-4">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="h-5 w-5 rounded-full bg-brand-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Check className="h-3 w-3 text-brand-green" />
                                        </div>
                                        <span className="text-sm font-bold text-brand-blue-alt/70">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                onClick={() => handleSelectPlan(plan.id)}
                                className={cn(
                                    "w-full h-14 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl",
                                    plan.popular
                                        ? "bg-brand-green hover:bg-brand-green-alt text-white shadow-brand-green/20"
                                        : "bg-brand-blue hover:bg-brand-blue-alt text-white shadow-brand-blue/20"
                                )}
                            >
                                اشترك الآن
                                <ArrowLeft className="h-4 w-4 mr-2" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Note */}
            <div className="bg-brand-off-white border-2 border-brand-beige rounded-[32px] p-8 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center border-2 border-brand-beige shadow-sm">
                        <Shield className="h-6 w-6 text-brand-green" />
                    </div>
                    <div>
                        <h4 className="font-black text-brand-blue text-lg">ضمان استرداد الأموال</h4>
                        <p className="text-xs text-brand-blue-alt/50 font-bold">يمكنك تجربة النظام لمدة 14 يوم واسترداد المبلغ بالكامل إذا لم يعجبك.</p>
                    </div>
                </div>
                <div className="flex -space-x-2 rtl:space-x-reverse">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-brand-beige" />
                    ))}
                    <div className="h-10 px-4 rounded-full border-2 border-white bg-brand-green text-white text-[10px] font-black flex items-center">
                        +500 شركة تثق بنا
                    </div>
                </div>
            </div>
        </div>
    );
}
