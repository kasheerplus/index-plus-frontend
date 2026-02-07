'use client';

import { useState } from 'react';
import { X, UserPlus, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { createTeamMember } from '@/app/actions/team';
import { supabase } from '@/lib/supabase';

interface InviteMemberModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function InviteMemberModal({ onClose, onSuccess }: InviteMemberModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [creationMethod, setCreationMethod] = useState<'link' | 'manual'>('manual');
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'agent' as 'admin' | 'agent' | 'supervisor'
    });
    const [inviteLink, setInviteLink] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (creationMethod === 'manual') {
                if (!formData.password) throw new Error('يرجى إدخال كلمة المرور');

                // Get current user and session for token
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (userError || sessionError || !user || !session) {
                    throw new Error('يجب تسجيل الدخول أولاً');
                }

                // Call server action with auth token
                const result = await createTeamMember(
                    session.access_token,
                    {
                        email: formData.email,
                        password: formData.password,
                        full_name: formData.full_name,
                        role: formData.role
                    }
                );

                if (!result.success) {
                    throw new Error(result.error);
                }

                toast.success(`تم إنشاء حساب ${formData.full_name} بنجاح! 🎉`);
                onSuccess();
                onClose();
            } else {
                // Generate Invitation Link (Logic for generating a unique code if needed)
                // For now, we can just show a success message as a placeholder if no sophisticated invite system exists
                toast.success('تم إنشاء رابط الدعوة بنجاح! (قيد التطوير)');
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'حدث خطأ أثناء العملية');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-start justify-center pt-40 p-4 font-cairo animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-4 border-white overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
            >
                {/* Header */}
                <div className="bg-brand-blue p-5 flex items-center justify-between text-white relative overflow-hidden h-16">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl" />
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                            <UserPlus className="h-5 w-5 text-brand-green" />
                        </div>
                        <div>
                            <h2 className="font-black text-xl">إضافة عضو للفريق</h2>
                            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1.5">قم بضم موظف جديد لشركتك بلمسة ذكية</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors relative z-10"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-5">
                    {/* Tabs */}
                    <div className="flex bg-brand-off-white/50 p-1 rounded-2xl mb-4 border border-brand-beige">
                        <button
                            className={cn(
                                "flex-1 py-3 rounded-xl text-sm font-black transition-all",
                                creationMethod === 'manual' ? "bg-white text-brand-blue shadow-sm border border-brand-beige" : "text-brand-blue-alt/40"
                            )}
                            onClick={() => setCreationMethod('manual')}
                        >
                            إنشاء حساب يدوي
                        </button>
                        <button
                            className={cn(
                                "flex-1 py-3 rounded-xl text-sm font-black transition-all",
                                creationMethod === 'link' ? "bg-white text-brand-blue shadow-sm border border-brand-beige" : "text-brand-blue-alt/40"
                            )}
                            onClick={() => setCreationMethod('link')}
                        >
                            رابط دعوة
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="block text-xs font-black text-brand-blue flex items-center gap-1.5 mb-2 px-1">الاسم الكامل</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full h-10 px-4 bg-brand-off-white/50 border border-brand-beige rounded-xl text-sm font-bold text-brand-blue focus:border-brand-green/50 focus:bg-white transition-all text-right outline-none shadow-sm"
                                    placeholder="مثال: أحمد محمد"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-black text-brand-blue flex items-center gap-1.5 mb-2 px-1">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full h-10 px-4 bg-brand-off-white/50 border border-brand-beige rounded-xl text-sm font-bold text-brand-blue focus:border-brand-green/50 focus:bg-white transition-all outline-none shadow-sm font-number"
                                    placeholder="name@company.com"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        {creationMethod === 'manual' && (
                            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-xs font-black text-brand-blue flex items-center gap-1.5 mb-2 px-1">كلمة المرور المؤقتة</label>
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full h-10 px-4 bg-brand-off-white/50 border border-brand-beige rounded-xl text-sm font-bold text-brand-blue focus:border-brand-green/50 focus:bg-white transition-all outline-none shadow-sm"
                                    placeholder="••••••••"
                                    dir="ltr"
                                />
                            </div>
                        )}

                        <div className="space-y-4">
                            <label className="block text-xs font-black text-brand-blue flex items-center gap-1.5 mb-2 px-1">صلاحيات العضو</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                                    className={cn(
                                        "p-4 border-2 rounded-[24px] transition-all flex flex-col items-center gap-2 relative overflow-hidden group",
                                        formData.role === 'admin'
                                            ? "border-brand-green bg-brand-green/10"
                                            : "border-brand-beige bg-brand-off-white/30 hover:border-brand-green/30"
                                    )}
                                >
                                    <Shield className={cn("h-5 w-5", formData.role === 'admin' ? "text-brand-green" : "text-brand-blue-alt/30")} />
                                    <div>
                                        <p className="text-xs font-black text-brand-blue text-center">مدير نظام</p>
                                        <p className="text-[8px] text-brand-blue-alt/40 font-black uppercase tracking-tighter text-center">تحكم كامل</p>
                                    </div>
                                    {formData.role === 'admin' && <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-brand-green" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'agent' })}
                                    className={cn(
                                        "p-4 border-2 rounded-[24px] transition-all flex flex-col items-center gap-2 relative overflow-hidden group",
                                        formData.role === 'agent'
                                            ? "border-brand-green bg-brand-green/10"
                                            : "border-brand-beige bg-brand-off-white/30 hover:border-brand-green/30"
                                    )}
                                >
                                    <UserPlus className={cn("h-5 w-5", formData.role === 'agent' ? "text-brand-green" : "text-brand-blue-alt/30")} />
                                    <div>
                                        <p className="text-xs font-black text-brand-blue text-center">موظف مبيعات</p>
                                        <p className="text-[8px] text-brand-blue-alt/40 font-black uppercase tracking-tighter text-center">صلاحيات محدودة</p>
                                    </div>
                                    {formData.role === 'agent' && <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-brand-green" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-6 border-t border-brand-beige/30 mt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 h-12 rounded-xl font-black border-brand-beige text-brand-blue hover:bg-brand-off-white"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                إلغاء
                            </Button>
                            <Button
                                type="submit"
                                className="flex-[2] h-12 bg-brand-green hover:bg-brand-green-alt text-white font-black rounded-xl shadow-lg shadow-brand-green/20 transition-all active:scale-95 text-base gap-2"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> :
                                    creationMethod === 'manual' ? 'إنشاء الحساب الآن' : 'توليد رابط الدعوة'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
