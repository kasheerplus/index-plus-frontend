'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus,
    MessageSquare,
    Trash2,
    Edit2,
    Search,
    Zap,
    Loader2,
    Command,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { SettingsHeader } from '@/components/settings/settings-header';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-permissions';
import toast from 'react-hot-toast';

interface QuickReply {
    id: string;
    shortcut: string;
    content: string;
}

export default function AutomationPage() {
    const { can, isLoading: isRoleLoading } = usePermissions();
    const [replies, setReplies] = useState<QuickReply[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingReply, setEditingReply] = useState<QuickReply | null>(null);
    const [formData, setFormData] = useState({ shortcut: '', content: '' });

    useEffect(() => {
        if (!isRoleLoading && can('manage_automation')) {
            fetchReplies();
        }
    }, [isRoleLoading]);

    if (!isRoleLoading && !can('manage_automation')) {
        return (
            <div className="p-8 space-y-8 bg-brand-off-white min-h-full font-cairo flex flex-col items-center justify-center text-center">
                <div className="h-24 w-24 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-6 shadow-xl shadow-red-100/50">
                    <Zap className="h-12 w-12" />
                </div>
                <h2 className="text-3xl font-black text-brand-blue mb-2">عذراً، لا تملك صلاحية الوصول</h2>
                <p className="text-brand-blue-alt/50 font-bold max-w-sm text-sm">
                    هذه الصفحة مخصصة للمديرين فقط. يرجى التواصل مع مسؤول النظام إذا كنت تعتقد أن هذا خطأ.
                </p>
                <Button
                    className="mt-8 px-12 h-14 rounded-2xl bg-brand-blue hover:bg-brand-blue-alt text-white font-black shadow-xl shadow-brand-blue/20 transition-all active:scale-95"
                    onClick={() => window.location.href = '/dashboard'}
                >
                    العودة للرئيسية
                </Button>
            </div>
        );
    }

    const fetchReplies = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('quick_replies')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) toast.error('فشل تحميل الردود');
        else setReplies(data || []);
        setIsLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.shortcut || !formData.content) return;

        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const companyId = user?.app_metadata?.company_id || user?.user_metadata?.company_id;

            if (editingReply) {
                const { error } = await supabase
                    .from('quick_replies')
                    .update({
                        shortcut: formData.shortcut.replace('/', ''),
                        content: formData.content
                    })
                    .eq('id', editingReply.id);
                if (error) throw error;
                toast.success('تم تحديث الرد بنجاح');
            } else {
                const { error } = await supabase
                    .from('quick_replies')
                    .insert({
                        shortcut: formData.shortcut.replace('/', ''),
                        content: formData.content,
                        company_id: companyId
                    });
                if (error) throw error;
                toast.success('تم إضافة الرد بنجاح');
            }
            setShowModal(false);
            fetchReplies();
        } catch (err) {
            toast.error('حدث خطأ أثناء الحفظ');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الرد؟')) return;

        const { error } = await supabase
            .from('quick_replies')
            .delete()
            .eq('id', id);

        if (error) toast.error('فشل حذف الرد');
        else {
            toast.success('تم الحذف بنجاح');
            fetchReplies();
        }
    };

    const openModal = (reply: QuickReply | null = null) => {
        setEditingReply(reply);
        setFormData(reply ? { shortcut: reply.shortcut, content: reply.content } : { shortcut: '', content: '' });
        setShowModal(true);
    };

    const filteredReplies = replies.filter(r =>
        r.shortcut.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 bg-brand-off-white min-h-full font-cairo text-right" dir="rtl">
            <SettingsHeader />

            {/* Sub Nav */}
            <div className="flex gap-8 border-b-2 border-brand-beige">
                <Link href="/dashboard/settings/automation" className="pb-4 px-2 text-sm font-black text-brand-green border-b-4 border-brand-green transition-all uppercase tracking-tight">الردود السريعة</Link>
                <Link href="/dashboard/settings/automation/rules" className="pb-4 px-2 text-sm font-bold text-brand-blue-alt/40 hover:text-brand-blue transition-all uppercase tracking-tight">محرك الرد الآلي</Link>
                <Link href="/dashboard/settings/automation/menus" className="pb-4 px-2 text-sm font-bold text-brand-blue-alt/40 hover:text-brand-blue transition-all uppercase tracking-tight">القوائم التفاعلية</Link>
            </div>

            <div className="bg-white rounded-[32px] border-2 border-brand-beige shadow-sm overflow-hidden mt-8">
                <div className="p-8 border-b-2 border-brand-off-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-brand-green text-white flex items-center justify-center shadow-lg shadow-brand-green/20">
                            <Zap className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-brand-blue">الردود السريعة</h2>
                            <p className="text-xs text-brand-blue-alt/40 font-black uppercase tracking-widest">أضف اختصارات للرد على العملاء بضغطة واحدة</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                        <div className="relative">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-blue-alt/30" />
                            <input
                                type="text"
                                placeholder="بحث عن رد..."
                                className="pr-12 pl-4 py-3 bg-brand-off-white/80 border-2 border-brand-beige rounded-2xl text-sm font-bold text-brand-blue focus:border-brand-green transition-all w-full md:w-72 outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            className="bg-gradient-to-r from-brand-green to-brand-green-alt hover:shadow-brand-green/20 text-white font-black gap-2 h-14 px-8 rounded-2xl shadow-xl transition-all active:scale-95"
                            onClick={() => openModal()}
                        >
                            <Plus className="h-5 w-5" />
                            إضافة رد جديد
                        </Button>
                    </div>
                </div>

                <div className="p-6">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                            ))}
                        </div>
                    ) : filteredReplies.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <MessageSquare className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-black text-navy mb-1">لا توجد ردود سريعة</h3>
                            <p className="text-sm text-gray-400 font-bold">ابدأ بإضافة أول رد سريع لتسريع عملك</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredReplies.map((reply) => (
                                <div key={reply.id} className="group p-6 bg-brand-off-white/50 rounded-[24px] border-2 border-brand-beige hover:border-brand-green/30 hover:bg-white hover:shadow-xl transition-all relative">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-brand-beige shadow-sm">
                                            <Command className="h-4 w-4 text-brand-green" />
                                            <span className="text-sm font-black text-brand-blue font-number">/{reply.shortcut}</span>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openModal(reply)}
                                                className="h-9 w-9 flex items-center justify-center bg-white rounded-lg text-brand-blue-alt/40 hover:text-brand-green hover:border-brand-green/20 border border-transparent shadow-sm transition-all"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(reply.id)}
                                                className="h-9 w-9 flex items-center justify-center bg-white rounded-lg text-brand-blue-alt/40 hover:text-red-500 hover:border-red-100 border border-transparent shadow-sm transition-all"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm font-bold text-brand-blue-alt/70 line-clamp-3 text-right leading-relaxed h-[66px] overflow-hidden">
                                        {reply.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-start justify-center pt-40 p-4 font-cairo animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-4 border-white overflow-hidden animate-in zoom-in-95 duration-300" dir="rtl">
                        {/* Header */}
                        <div className="bg-brand-blue p-5 flex items-center justify-between text-white relative overflow-hidden h-16">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl" />
                            <div className="relative z-10 flex items-center gap-3">
                                <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                                    {editingReply ? <Edit2 className="h-5 w-5 text-brand-green" /> : <Plus className="h-5 w-5 text-brand-green" />}
                                </div>
                                <div>
                                    <h2 className="font-black text-xl">{editingReply ? 'تعديل رد سريع' : 'إضافة رد جديد'}</h2>
                                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1.5">تحكم في الردود السريعة بذكاء</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="h-8 w-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors relative z-10"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-5">
                            <form onSubmit={handleSave} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-black text-brand-blue flex items-center gap-1.5 mb-2 px-1">
                                        <Command className="h-3.5 w-3.5 text-brand-blue-alt/40" />
                                        اختصار الرد
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-blue/20 font-black text-xl">/</div>
                                        <input
                                            type="text"
                                            placeholder="welcome"
                                            className="w-full pl-10 pr-6 h-12 bg-brand-off-white/50 border border-brand-beige rounded-xl text-sm font-black text-brand-blue focus:border-brand-green/50 focus:bg-white transition-all outline-none font-number"
                                            value={formData.shortcut}
                                            onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                                            dir="ltr"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-brand-blue flex items-center gap-1.5 mb-2 px-1">
                                        <MessageSquare className="h-3.5 w-3.5 text-brand-blue-alt/40" />
                                        محتوى الرد
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="اكتب محتوى الرد هنا..."
                                        className="w-full px-6 py-4 bg-brand-off-white/50 border border-brand-beige rounded-xl text-sm font-bold text-brand-blue focus:border-brand-green/50 focus:bg-white transition-all resize-none outline-none leading-relaxed"
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t border-brand-beige/50 mt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 h-12 rounded-xl font-black border-brand-beige text-brand-blue hover:bg-brand-off-white"
                                        onClick={() => setShowModal(false)}
                                    >
                                        إلغاء
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-[2] h-12 bg-brand-green hover:bg-brand-green-alt text-white font-black rounded-xl shadow-lg shadow-brand-green/20 transition-all active:scale-95 text-base"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'حفظ الرد الآن'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
