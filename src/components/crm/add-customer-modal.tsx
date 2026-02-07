'use client';

import { useState, useEffect } from 'react';
import { X, UserPlus, Loader2, MapPin, Mail, Phone, User as UserIcon, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AddCustomerModalProps {
    onClose: () => void;
    onSuccess: () => void;
    customerToEdit?: {
        id: string;
        name: string;
        phone: string;
        email: string;
        address?: string;
        tags: string[];
    } | null;
}

export function AddCustomerModal({ onClose, onSuccess, customerToEdit }: AddCustomerModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        tags: ''
    });

    useEffect(() => {
        if (customerToEdit) {
            setFormData({
                name: customerToEdit.name,
                phone: customerToEdit.phone,
                email: customerToEdit.email || '',
                address: customerToEdit.address || '',
                tags: customerToEdit.tags ? customerToEdit.tags.join(', ') : ''
            });
        }
    }, [customerToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const tagsArray = formData.tags
                .split(',')
                .map(t => t.trim())
                .filter(t => t.length > 0);

            const payload = {
                name: formData.name,
                phone: formData.phone,
                email: formData.email || null,
                address: formData.address || null,
                tags: tagsArray
            };

            let error;
            if (customerToEdit) {
                const result = await supabase
                    .from('customers')
                    .update(payload)
                    .eq('id', customerToEdit.id);
                error = result.error;
            } else {
                const result = await supabase
                    .from('customers')
                    .insert(payload);
                error = result.error;
            }

            if (error) throw error;

            toast.success(customerToEdit ? 'تم تحديث بيانات العميل! ✏️' : 'تم إضافة العميل بنجاح! ✅');
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'حدث خطأ أثناء إضافة العميل');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-48 bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-cairo">
            <div className="bg-white w-full max-w-[400px] rounded-3xl shadow-2xl border-4 border-white overflow-hidden animate-in zoom-in-95 duration-300 mb-10">
                {/* Header */}
                <div className="bg-brand-blue p-5 flex items-center justify-between text-white relative overflow-hidden h-20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl" />
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                            {customerToEdit ? <Pencil className="h-5 w-5 text-brand-green" /> : <UserPlus className="h-5 w-5 text-brand-green" />}
                        </div>
                        <div>
                            <h2 className="font-black text-xl">{customerToEdit ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</h2>
                            <p className="text-white/60 text-xs font-bold">{customerToEdit ? 'تحديث المعلومات المسجلة' : 'أدخل بيانات العميل للتسجيل'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors relative z-10"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-5 space-y-3">
                    {/* Name */}
                    <div className="space-y-1">
                        <label className="text-xs font-black text-brand-blue flex items-center gap-1.5">
                            <UserIcon className="h-3.5 w-3.5 text-brand-blue-alt/40" />
                            الاسم الكامل
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full h-10 px-3 bg-brand-off-white/50 border border-brand-beige rounded-xl text-sm font-bold text-brand-blue focus:border-brand-green/50 focus:bg-white outline-none transition-all placeholder:text-brand-blue-alt/30"
                            placeholder="مثال: محمد أحمد"
                        />
                    </div>

                    {/* Phone & Email Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-black text-brand-blue flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-brand-blue-alt/40" />
                                رقم الهاتف
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full h-10 px-3 bg-brand-off-white/50 border border-brand-beige rounded-xl text-sm font-bold font-number text-brand-blue focus:border-brand-green/50 focus:bg-white outline-none transition-all placeholder:text-brand-blue-alt/30 ltr-text"
                                placeholder="01xxxxxxxxx"
                                dir="ltr"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-black text-brand-blue flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-brand-blue-alt/40" />
                                البريد الإلكتروني
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full h-10 px-3 bg-brand-off-white/50 border border-brand-beige rounded-xl text-sm font-bold text-brand-blue focus:border-brand-green/50 focus:bg-white outline-none transition-all placeholder:text-brand-blue-alt/30 ltr-text"
                                placeholder="example@email.com"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-1">
                        <label className="text-xs font-black text-brand-blue flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-brand-blue-alt/40" />
                            العنوان
                        </label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full h-10 px-3 bg-brand-off-white/50 border border-brand-beige rounded-xl text-sm font-bold text-brand-blue focus:border-brand-green/50 focus:bg-white outline-none transition-all placeholder:text-brand-blue-alt/30"
                            placeholder="المدينة، المنطقة، اسم الشارع..."
                        />
                    </div>

                    {/* Tags */}
                    <div className="space-y-1">
                        <label className="text-xs font-black text-brand-blue flex items-center gap-1.5">
                            التصنيفات (Tags)
                        </label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            className="w-full h-10 px-3 bg-brand-off-white/50 border border-brand-beige rounded-xl text-sm font-bold text-brand-blue focus:border-brand-green/50 focus:bg-white outline-none transition-all placeholder:text-brand-blue-alt/30"
                            placeholder="VIP, عميل جديد, ..."
                        />
                        <p className="text-[10px] text-brand-blue-alt/40 font-bold px-1">
                            يمكنك إضافة أكثر من تصنيف عن طريق الفصل بفاصلة (,)
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-3 border-t border-brand-beige/50 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 h-10 rounded-xl font-black border-brand-beige text-brand-blue hover:bg-brand-off-white hover:text-brand-blue-alt"
                            disabled={isSubmitting}
                        >
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            className="flex-[2] h-10 rounded-xl font-black gap-2 bg-brand-green hover:bg-brand-green-alt text-white shadow-lg shadow-brand-green/20"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    {customerToEdit ? <Pencil className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                                    {customerToEdit ? 'حفظ التعديلات' : 'إضافة العميل'}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
