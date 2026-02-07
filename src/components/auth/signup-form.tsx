'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { User, Mail, Lock, Building, ArrowLeft } from 'lucide-react';

export function SignupForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // 1. Sign up user
        const { data, error: signupError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    company_name: companyName,
                    role: 'owner', // Default role for account creator
                }
            }
        });

        if (signupError) {
            setError(signupError.message);
            setIsLoading(false);
            return;
        }

        if (data.user) {
            alert('تم إنشاء الحساب بنجاح! يرجى مراجعة بريدك الإلكتروني لتفعيل الحساب.');
            router.push('/auth/login');
        }
    };

    return (
        <form onSubmit={handleSignup} className="space-y-4 w-full">
            <div className="text-center mb-8">
                <Image
                    src="/logo.png"
                    alt="Index Plus"
                    width={200}
                    height={200}
                    className="h-20 mx-auto -mb-6 -mt-8 scale-[3.2] object-contain"
                />
                <p className="text-brand-blue-alt font-medium">ابدأ رحلتك مع إندكس بلس اليوم</p>
            </div>

            <div className="space-y-4">
                <Input
                    type="text"
                    placeholder="الاسم الكامل"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    icon={<User className="h-5 w-5" />}
                    className="bg-brand-off-white border-2 border-brand-off-white rounded-xl focus:ring-brand-green focus:border-brand-green h-14"
                />
                <Input
                    type="text"
                    placeholder="اسم الشركة"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    icon={<Building className="h-5 w-5" />}
                    className="bg-brand-off-white border-2 border-brand-off-white rounded-xl focus:ring-brand-green focus:border-brand-green h-14"
                />
                <Input
                    type="email"
                    placeholder="البريد الإلكتروني"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    icon={<Mail className="h-5 w-5" />}
                    className="bg-brand-off-white border-2 border-brand-off-white rounded-xl focus:ring-brand-green focus:border-brand-green h-14"
                />
                <Input
                    type="password"
                    placeholder="كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    icon={<Lock className="h-5 w-5" />}
                    className="bg-brand-off-white border-2 border-brand-off-white rounded-xl focus:ring-brand-green focus:border-brand-green h-14"
                />

                {error && (
                    <p className="text-sm font-bold text-red-500 text-center animate-shake">{error}</p>
                )}

                <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full bg-brand-green hover:bg-brand-green-alt text-white font-black py-4 h-14 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 border-none mt-2"
                >
                    <span>إنشاء الحساب</span>
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <p className="text-center text-sm font-bold text-brand-blue-alt mt-6">
                    لديك حساب بالفعل؟{' '}
                    <button
                        type="button"
                        className="text-brand-green hover:underline"
                        onClick={() => router.push('/auth/login')}
                    >
                        تسجيل الدخول
                    </button>
                </p>
            </div>
        </form>
    );
}
