'use client';

import { useState } from 'react';
import { X, Save, Loader2, Shield, Key, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { updateTeamMember, updateTeamMemberPassword, deleteTeamMember } from '@/app/actions/team';
import { supabase } from '@/lib/supabase';

interface EditMemberModalProps {
    member: {
        id: string;
        full_name: string;
        role: 'owner' | 'admin' | 'agent' | 'supervisor';
        status: 'active' | 'suspended';
    };
    onClose: () => void;
    onSuccess: () => void;
}

export function EditMemberModal({ member, onClose, onSuccess }: EditMemberModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mode, setMode] = useState<'edit' | 'password' | 'delete'>('edit');
    const [formData, setFormData] = useState({
        full_name: member.full_name,
        role: member.role,
        status: member.status
    });
    const [newPassword, setNewPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('يجب تسجيل الدخول أولاً');

            if (mode === 'edit') {
                const result = await updateTeamMember(session.access_token, member.id, {
                    full_name: formData.full_name,
                    role: formData.role as 'admin' | 'agent' | 'supervisor',
                    status: formData.status
                });
                if (!result.success) throw new Error(result.error);
                toast.success('تم تحديث بيانات العضو بنجاح');
            } else if (mode === 'password') {
                if (!newPassword) throw new Error('يرجى إدخال كلمة المرور الجديدة');
                const result = await updateTeamMemberPassword(session.access_token, member.id, newPassword);
                if (!result.success) throw new Error(result.error);
                toast.success('تم تغيير كلمة المرور بنجاح');
            } else if (mode === 'delete') {
                const result = await deleteTeamMember(session.access_token, member.id);
                if (!result.success) throw new Error(result.error);
                toast.success('تم حذف العضو بنجاح');
            }

            onSuccess();
            onClose();
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
                <div className={cn(
                    "p-5 flex items-center justify-between text-white relative overflow-hidden h-16 transition-colors duration-500",
                    mode === 'delete' ? "bg-red-500" : "bg-brand-blue"
                )}>
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                            {mode === 'edit' && <Shield className="h-5 w-5 text-brand-green" />}
                            {mode === 'password' && <Key className="h-5 w-5 text-amber-400" />}
                            {mode === 'delete' && <Trash2 className="h-5 w-5 text-white" />}
                        </div>
                        <div>
                            <h2 className="font-black text-xl">
                                {mode === 'edit' && 'تعديل بيانات العضو'}
                                {mode === 'password' && 'تغيير كلمة المرور'}
                                {mode === 'delete' && 'حذف العضو'}
                            </h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors relative z-10">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-5">
                    {/* Navigation Tabs */}
                    <div className="flex bg-brand-off-white/50 p-1 rounded-2xl mb-6 border border-brand-beige">
                        <button
                            onClick={() => setMode('edit')}
                            className={cn(
                                "flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2",
                                mode === 'edit' ? "bg-white text-brand-blue shadow-sm border border-brand-beige" : "text-brand-blue-alt/40"
                            )}>
                            <Shield className="h-4 w-4" /> البيانات
                        </button>
                        <button
                            onClick={() => setMode('password')}
                            className={cn(
                                "flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2",
                                mode === 'password' ? "bg-white text-brand-blue shadow-sm border border-brand-beige" : "text-brand-blue-alt/40"
                            )}>
                            <Key className="h-4 w-4" /> كلمة المرور
                        </button>
                        <button
                            onClick={() => setMode('delete')}
                            className={cn(
                                "flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2",
                                mode === 'delete' ? "bg-red-500 text-white shadow-sm" : "text-red-400/50"
                            )}>
                            <Trash2 className="h-4 w-4" /> حذف
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {mode === 'edit' && (
                            <>
                                <div className="space-y-1">
                                    <label className="block text-xs font-black text-brand-blue mb-2 px-1">الاسم الكامل</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full h-12 px-4 bg-brand-off-white/50 border border-brand-beige rounded-xl text-sm font-bold text-brand-blue focus:border-brand-green/50 focus:bg-white transition-all text-right outline-none shadow-sm"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-xs font-black text-brand-blue mb-2 px-1">صلاحيات العضو</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {(['admin', 'agent', 'supervisor'] as const).map((r) => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, role: r })}
                                                className={cn(
                                                    "p-4 border-2 rounded-[24px] transition-all flex flex-col items-center gap-2 relative overflow-hidden",
                                                    formData.role === r
                                                        ? "border-brand-green bg-brand-green/10"
                                                        : "border-brand-beige bg-brand-off-white/30 hover:border-brand-green/30"
                                                )}
                                            >
                                                <span className="text-xs font-black text-brand-blue">
                                                    {r === 'admin' ? 'مدير نظام' : r === 'agent' ? 'موظف مبيعات' : 'مشرف'}
                                                </span>
                                                {formData.role === r && <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-brand-green" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {mode === 'password' && (
                            <div className="space-y-1">
                                <label className="block text-xs font-black text-brand-blue mb-2 px-1">كلمة المرور الجديدة</label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full h-12 px-4 bg-brand-off-white/50 border border-brand-beige rounded-xl text-sm font-bold text-brand-blue focus:border-brand-green/50 focus:bg-white transition-all outline-none shadow-sm"
                                    placeholder="••••••••"
                                    dir="ltr"
                                />
                                <p className="text-[10px] text-brand-blue-alt/50 font-bold mt-2 mr-1">سيتم تغيير كلمة المرور للموظف فوراً. تأكد من إبلاغه بالكلمة الجديدة.</p>
                            </div>
                        )}

                        {mode === 'delete' && (
                            <div className="text-center space-y-4 py-4">
                                <div className="h-20 w-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
                                    <Trash2 className="h-10 w-10" />
                                </div>
                                <h3 className="text-xl font-black text-brand-blue">هل أنت متأكد من حذف هذا العضو؟</h3>
                                <p className="text-sm text-brand-blue-alt/60 font-bold px-8">سيتم حذف حساب {member.full_name} نهائياً من النظام. لا يمكن التراجع عن هذا الإجراء.</p>
                            </div>
                        )}

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
                                className={cn(
                                    "flex-[2] h-12 text-white font-black rounded-xl transition-all active:scale-95 text-base gap-2 shadow-lg",
                                    mode === 'delete' ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : "bg-brand-blue hover:bg-brand-blue-alt shadow-brand-blue/20"
                                )}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                    <>
                                        {mode === 'edit' && <Save className="h-5 w-5" />}
                                        {mode === 'edit' && 'حفظ التعديلات'}
                                        {mode === 'password' && 'تحديث كلمة المرور'}
                                        {mode === 'delete' && 'تأكيد الحذف النهائي'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
