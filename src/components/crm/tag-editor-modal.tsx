'use client';

import { useState } from 'react';
import { X, Tag as TagIcon, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface TagEditorModalProps {
    customer: {
        id: string;
        name: string;
        tags: string[];
    };
    onClose: () => void;
    onSuccess: () => void;
}

export function TagEditorModal({ customer, onClose, onSuccess }: TagEditorModalProps) {
    const [tags, setTags] = useState<string[]>(customer.tags || []);
    const [newTag, setNewTag] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addTag = () => {
        const trimmedTag = newTag.trim();
        if (trimmedTag && !tags.includes(trimmedTag)) {
            setTags([...tags, trimmedTag]);
            setNewTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('customers')
                .update({ tags })
                .eq('id', customer.id);

            if (error) throw error;

            toast.success('تم تحديث التصنيفات بنجاح! 🏷️');
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'حدث خطأ أثناء تحديث التصنيفات');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-48 bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-cairo">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-4 border-white overflow-hidden animate-in zoom-in-95 duration-300 mb-10">
                {/* Header */}
                <div className="bg-brand-blue p-6 flex items-center justify-between text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl" />
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                            <TagIcon className="h-5 w-5 text-brand-green" />
                        </div>
                        <div>
                            <h2 className="font-black text-xl">إدارة التصنيفات</h2>
                            <p className="text-white/60 text-xs font-bold">{customer.name}</p>
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
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Add New Tag */}
                    <div className="space-y-2">
                        <label htmlFor="new-tag" className="text-xs font-black text-brand-blue flex items-center gap-1.5">
                            إضافة تصنيف جديد
                        </label>
                        <div className="flex gap-2">
                            <input
                                id="new-tag"
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                className="flex-1 h-11 px-4 bg-brand-off-white/50 border border-brand-beige rounded-xl text-sm font-bold text-brand-blue focus:border-brand-green/50 focus:bg-white outline-none transition-all placeholder:text-brand-blue-alt/30"
                                placeholder="VIP, عميل مميز..."
                            />
                            <Button
                                type="button"
                                onClick={addTag}
                                className="h-11 w-11 p-0 rounded-xl bg-brand-green hover:bg-brand-green-alt text-white shadow-lg shadow-brand-green/20 box-content"
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Current Tags */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-brand-blue flex items-center gap-1.5">
                            التصنيفات الحالية
                        </label>
                        <div className="flex flex-wrap gap-2 min-h-[100px] content-start p-4 bg-brand-off-white/30 border border-brand-beige rounded-xl">
                            {tags.length === 0 ? (
                                <div className="w-full h-full flex flex-col items-center justify-center py-4 opacity-50">
                                    <TagIcon className="h-8 w-8 text-brand-blue-alt/30 mb-2" />
                                    <p className="text-xs text-brand-blue-alt font-bold">لا توجد تصنيفات لهذا العميل</p>
                                </div>
                            ) : (
                                tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="pl-1 pr-3 py-1.5 rounded-lg text-[11px] font-black bg-white border border-brand-beige text-brand-blue shadow-sm flex items-center gap-2 group hover:border-brand-green/30 transition-all"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="h-5 w-5 bg-brand-off-white hover:bg-red-50 hover:text-red-500 rounded-md flex items-center justify-center transition-colors"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 h-12 rounded-xl font-black border-brand-beige text-brand-blue hover:bg-brand-off-white hover:text-brand-blue-alt"
                            disabled={isSubmitting}
                        >
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            className="flex-[2] h-12 rounded-xl font-black gap-2 bg-brand-blue hover:bg-brand-blue-alt text-white shadow-lg shadow-brand-blue/20"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    <TagIcon className="h-4 w-4" />
                                    حفظ التغييرات
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
