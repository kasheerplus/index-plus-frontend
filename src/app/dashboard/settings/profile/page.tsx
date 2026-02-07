'use client';

import { useState, useEffect } from 'react';
import { User, Key, Save, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [userData, setUserData] = useState({
        full_name: '',
        email: '',
        id: ''
    });
    const [passwords, setPasswords] = useState({
        new: '',
        confirm: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('full_name, id')
                    .eq('id', user.id)
                    .single();

                setUserData({
                    full_name: profile?.full_name || '',
                    email: user.email || '',
                    id: user.id
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ full_name: userData.full_name })
                .eq('id', userData.id);

            if (error) throw error;

            // Also update auth metadata
            await supabase.auth.updateUser({
                data: { full_name: userData.full_name }
            });

            toast.success('تم تحديث البيانات الشخصية بنجاح');
        } catch (error: any) {
            toast.error(error.message || 'حدث خطأ أثناء التحديث');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            toast.error('كلمات المرور غير متطابقة');
            return;
        }
        if (passwords.new.length < 6) {
            toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwords.new
            });
            if (error) throw error;
            toast.success('تم تغيير كلمة المرور بنجاح');
            setPasswords({ new: '', confirm: '' });
        } catch (error: any) {
            toast.error(error.message || 'حدث خطأ أثناء تغيير كلمة المرور');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 text-brand-green animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 font-cairo text-right" dir="rtl">
            <div className="bg-white rounded-[32px] p-8 border-2 border-brand-beige shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-brand-blue text-white flex items-center justify-center shadow-lg shadow-brand-blue/20">
                        <User className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-brand-blue">الملف الشخصي</h1>
                        <p className="text-sm text-brand-blue-alt/60 font-bold mt-1">تعديل بيانات حسابك الشخصي</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Personal Info */}
                <form onSubmit={handleUpdateProfile} className="bg-white rounded-[32px] p-8 border-2 border-brand-beige shadow-sm space-y-6">
                    <h2 className="text-xl font-black text-brand-blue flex items-center gap-3">
                        <User className="h-5 w-5 text-brand-green" />
                        البيانات الأساسية
                    </h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-brand-blue mr-1">الاسم الكامل</label>
                            <input
                                type="text"
                                value={userData.full_name}
                                onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
                                className="w-full h-12 px-4 bg-brand-off-white/50 border border-brand-beige rounded-xl text-sm font-bold text-brand-blue focus:border-brand-green/50 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2 opacity-60">
                            <label className="text-sm font-black text-brand-blue mr-1">البريد الإلكتروني (لا يمكن تغييره)</label>
                            <div className="w-full h-12 px-4 bg-gray-100 border border-brand-beige rounded-xl text-sm font-bold text-brand-blue flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {userData.email}
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="w-full h-12 bg-brand-blue hover:bg-brand-blue-alt text-white font-black rounded-xl shadow-lg shadow-brand-blue/20 gap-2"
                    >
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        حفظ التعديلات
                    </Button>
                </form>

                {/* Password Change */}
                <form onSubmit={handleUpdatePassword} className="bg-white rounded-[32px] p-8 border-2 border-brand-beige shadow-sm space-y-6">
                    <h2 className="text-xl font-black text-brand-blue flex items-center gap-3">
                        <Key className="h-5 w-5 text-amber-500" />
                        تغيير كلمة المرور
                    </h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-brand-blue mr-1">كلمة المرور الجديدة</label>
                            <input
                                type="password"
                                value={passwords.new}
                                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                className="w-full h-12 px-4 bg-brand-off-white/50 border border-brand-beige rounded-xl text-sm font-bold text-brand-blue focus:border-brand-green/50 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-brand-blue mr-1">تأكيد كلمة المرور</label>
                            <input
                                type="password"
                                value={passwords.confirm}
                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                className="w-full h-12 px-4 bg-brand-off-white/50 border border-brand-beige rounded-xl text-sm font-bold text-brand-blue focus:border-brand-green/50 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="w-full h-12 bg-brand-green hover:bg-brand-green-alt text-white font-black rounded-xl shadow-lg shadow-brand-green/20 gap-2"
                    >
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Key className="h-5 w-5" />}
                        تحديث كلمة المرور
                    </Button>
                </form>
            </div>
        </div>
    );
}
