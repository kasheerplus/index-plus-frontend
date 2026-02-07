'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { Mail, Lock, ArrowLeft } from 'lucide-react';

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                if (error.message.includes('Email not confirmed')) {
                    setError('يرجى تفعيل البريد الإلكتروني أولاً');
                } else {
                    setError('خطأ في البريد الإلكتروني أو كلمة المرور');
                }
                setIsLoading(false);
                return;
            }

            window.location.href = '/dashboard';
        } catch (err) {
            console.error(err);
            setError('حدث خطأ غير متوقع');
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin} className="space-y-4 w-full">
            <div className="text-center mb-8">
                <Image
                    src="/logo.png"
                    alt="Index Plus"
                    width={200}
                    height={200}
                    className="h-20 mx-auto -mb-6 -mt-8 scale-[3.2] object-contain"
                />
                <p className="text-brand-blue-alt font-medium">سجل دخولك لإدارة حسابك</p>
            </div>

            <div id="section-login" className="space-y-4">
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

                <div className="flex justify-between items-center text-sm font-bold">
                    <label className="flex items-center gap-2 cursor-pointer text-brand-blue-alt select-none">
                        <input type="checkbox" id="rememberMe"
                            className="w-5 h-5 border-2 border-brand-beige rounded-lg text-brand-green focus:ring-brand-green transition-all" />
                        <span>تذكرني</span>
                    </label>
                    <button
                        type="button"
                        className="text-brand-green hover:underline"
                    >
                        نسيت كلمة المرور؟
                    </button>
                </div>

                {error && (
                    <p className="text-sm font-bold text-red-500 text-center animate-shake">{error}</p>
                )}

                <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full bg-brand-green hover:bg-brand-green-alt text-white font-black py-4 h-14 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 border-none"
                >
                    <span>دخول</span>
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <p className="text-center text-sm font-bold text-brand-blue-alt mt-6">
                    ليس لديك حساب؟{' '}
                    <button
                        type="button"
                        className="text-brand-green hover:underline"
                        onClick={() => router.push('/auth/signup')}
                    >
                        سجل حساباً جديداً
                    </button>
                </p>
            </div>
        </form>
    );
}
