'use client';

import { useEffect, useState } from 'react';
import { Facebook, Instagram, ShieldCheck, Lock, CheckCircle2, Loader2, AlertCircle, Info, ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SocialAuthPage() {
    const [platform, setPlatform] = useState<'facebook' | 'instagram' | 'meta'>('facebook');
    const [isApproving, setIsApproving] = useState(false);
    const [step, setStep] = useState<'login' | 'approve'>('login');
    const [email, setEmail] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const p = params.get('platform') as any;
        if (p === 'instagram') setPlatform('instagram');
        else setPlatform('facebook');
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsApproving(true);
        setTimeout(() => {
            setIsApproving(false);
            setStep('approve');
        }, 1200);
    };

    const handleApprove = async () => {
        setIsApproving(true);
        const authData = {
            platform_id: `${platform.toUpperCase()}-${Math.floor(Math.random() * 1000000000)}`,
            token: `EAAbp_${Math.random().toString(36).substring(7)}_${Date.now()}`,
            status: 'success'
        };

        setTimeout(() => {
            if (window.opener) {
                window.opener.postMessage(authData, '*');
                window.close();
            }
        }, 800);
    };

    const isInstagram = platform === 'instagram';

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 font-cairo transition-colors duration-500 ${isInstagram ? 'bg-white' : 'bg-[#F0F2F5]'}`}>
            <div className={`w-full max-w-[500px] overflow-hidden ${isInstagram ? 'border border-[#DBDBDB] rounded-none md:rounded-lg' : 'bg-white shadow-xl rounded-lg'}`}>

                {/* Header Section */}
                {!isInstagram ? (
                    <div className="bg-[#1877F2] p-4 flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                            <Facebook className="h-6 w-6 fill-white" />
                            <span className="font-bold text-sm">Log in with Facebook</span>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 pb-4 text-center border-b border-[#DBDBDB]">
                        <div className="flex justify-center mb-6">
                            <div className="h-20 w-20 bg-gradient-to-tr from-[#FFDC80] via-[#FD1D1D] to-[#C13584] p-[2px] rounded-[22px]">
                                <div className="bg-white h-full w-full rounded-[20px] flex items-center justify-center">
                                    <Instagram className="h-12 w-12 text-[#262626]" />
                                </div>
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-[#262626]">Instagram Login</h2>
                    </div>
                )}

                <div className={`p-10 ${isInstagram ? 'pt-6' : ''}`}>
                    {step === 'login' ? (
                        <div className="space-y-6">
                            {!isInstagram && (
                                <div className="text-center space-y-2">
                                    <div className="h-16 w-16 bg-[#F0F2F5] rounded-full mx-auto flex items-center justify-center">
                                        <ShieldCheck className="h-8 w-8 text-[#1877F2]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1C1E21]">تسجيل الدخول إلى فيسبوك</h2>
                                    <p className="text-sm text-[#606770]">يطلب تطبيق <span className="font-bold">Index Plus</span> الوصول لحسابك</p>
                                </div>
                            )}

                            <form onSubmit={handleLogin} className="space-y-3">
                                <input
                                    type="text"
                                    placeholder={isInstagram ? "اسم المستخدم أو البريد الإلكتروني" : "البريد الإلكتروني أو رقم الهاتف"}
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full p-4 border rounded-md outline-none text-right transition-all ${isInstagram ? 'bg-[#FAFAFA] border-[#DBDBDB] focus:border-[#A8A8A8]' : 'bg-white border-[#DDDFE2] focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2]'}`}
                                />
                                <input
                                    type="password"
                                    placeholder="كلمة السر"
                                    required
                                    className={`w-full p-4 border rounded-md outline-none text-right transition-all ${isInstagram ? 'bg-[#FAFAFA] border-[#DBDBDB] focus:border-[#A8A8A8]' : 'bg-white border-[#DDDFE2] focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2]'}`}
                                />
                                <Button
                                    type="submit"
                                    disabled={isApproving}
                                    className={`w-full font-bold h-12 text-lg rounded-md mt-4 ${isInstagram ? 'bg-[#4CB5F9] hover:bg-[#1877F2] text-white' : 'bg-[#1877F2] hover:bg-[#166FE5] text-white'}`}
                                >
                                    {isApproving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : (isInstagram ? 'Log in' : 'تسجيل الدخول')}
                                </Button>
                            </form>

                            <div className="text-center pt-4 flex flex-col gap-2">
                                <a href="#" className={`text-sm font-bold hover:underline ${isInstagram ? 'text-[#00376B]' : 'text-[#1877F2]'}`}>نسيت كلمة السر؟</a>
                                {isInstagram && (
                                    <p className="text-sm text-[#8E8E8E] mt-4">
                                        ليس لديك حساب؟ <a href="#" className="text-[#0095F6] font-bold">سجل الآن</a>
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Permission Card */}
                            <div className="flex items-start gap-4 text-right">
                                <div className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${isInstagram ? 'bg-pink-50' : 'bg-blue-50'}`}>
                                    {isInstagram ? <User className="h-6 w-6 text-[#C13584]" /> : <Lock className="h-6 w-6 text-[#1877F2]" />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-[#1C1E21] mb-1">منح الصلاحية لتطبيق Index Plus</h3>
                                    <p className="text-xs text-[#606770] leading-relaxed">
                                        سوف يتمكن التطبيق من إدارة {isInstagram ? 'الرسائل المباشرة والردود' : 'رسائل الصفحة والمنشورات'} بشكل آلي.
                                    </p>
                                </div>
                            </div>

                            <div className={`p-5 rounded-lg space-y-4 ${isInstagram ? 'bg-[#FAFAFA] border border-[#DBDBDB]' : 'bg-[#F0F2F5]'}`}>
                                <div className="flex items-center justify-between text-xs font-bold text-[#606770]">
                                    <ChevronRight className="h-4 w-4" />
                                    <span>الصلاحيات المطلوبة</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 justify-end">
                                        <span className="text-xs text-[#1C1E21] font-bold">قراءة وإرسال الرسائل</span>
                                        <CheckCircle2 className={`h-4 w-4 ${isInstagram ? 'text-[#C13584]' : 'text-[#1877F2]'}`} />
                                    </div>
                                    <div className="flex items-center gap-3 justify-end">
                                        <span className="text-xs text-[#1C1E21] font-bold">إدارة المحتوى والتحليلات</span>
                                        <CheckCircle2 className={`h-4 w-4 ${isInstagram ? 'text-[#C13584]' : 'text-[#1877F2]'}`} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={handleApprove}
                                    disabled={isApproving}
                                    className={`w-full font-bold h-12 text-lg rounded-md ${isInstagram ? 'bg-gradient-to-r from-[#FFDC80] to-[#C13584] hover:opacity-90 text-white' : 'bg-[#1877F2] hover:bg-[#166FE5] text-white'}`}
                                >
                                    {isApproving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : `المتابعة باسم ${email.split('@')[0]}`}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => window.close()}
                                    className="w-full h-12 text-[#606770] font-bold hover:bg-[#FAFAFA]"
                                >
                                    إلغاء العملية
                                </Button>
                            </div>

                            <div className="flex items-center gap-2 justify-center text-[10px] text-[#90949C]">
                                <Info className="h-3 w-3" />
                                <span>يخضع استخدامك لسياسة خصوصية Index Plus وشروط خدمة {isInstagram ? 'Instagram' : 'Facebook'}.</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer decoration (Facebook style) */}
            {!isInstagram && (
                <div className="fixed bottom-10 text-[11px] text-[#737373] flex flex-wrap justify-center gap-4 max-w-[600px] text-center">
                    <span>العربية</span>
                    <span>English (US)</span>
                    <span>Français (France)</span>
                    <span>Español</span>
                    <span>Português (Brasil)</span>
                    <span className="font-bold border px-1 rounded-sm">+</span>
                </div>
            )}
        </div>
    );
}
