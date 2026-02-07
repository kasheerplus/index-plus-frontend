'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Zap,
    Trash2,
    Edit2,
    Search,
    Loader2,
    CheckCircle2,
    XCircle,
    Settings,
    MessageSquare,
    ChevronDown,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { SettingsHeader } from '@/components/settings/settings-header';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-permissions';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface AutomationRule {
    id: string;
    name: string;
    trigger_type: 'exact' | 'contains' | 'starts_with';
    keywords: string[];
    response_content: string;
    is_active: boolean;
}

export default function AutomationRulesPage() {
    const { can, isLoading: isRoleLoading } = usePermissions();
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
    const [formData, setFormData] = useState<{
        name: string;
        trigger_type: 'exact' | 'contains' | 'starts_with';
        keywords: string;
        response_content: string;
        is_active: boolean;
    }>({
        name: '',
        trigger_type: 'exact',
        keywords: '',
        response_content: '',
        is_active: true
    });

    useEffect(() => {
        if (!isRoleLoading && can('manage_automation')) {
            fetchRules();
        }
    }, [isRoleLoading]);

    const fetchRules = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('automation_rules')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) toast.error('فشل تحميل القواعد');
        else setRules(data || []);
        setIsLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.keywords || !formData.response_content) return;

        setIsSaving(true);
        const keywordsArray = formData.keywords.split(',').map(k => k.trim()).filter(k => k);

        try {
            const payload = {
                name: formData.name,
                trigger_type: formData.trigger_type,
                keywords: keywordsArray,
                response_content: formData.response_content,
                is_active: formData.is_active
            };

            if (editingRule) {
                const { error } = await supabase
                    .from('automation_rules')
                    .update(payload)
                    .eq('id', editingRule.id);
                if (error) throw error;
                toast.success('تم تحديث القاعدة بنجاح');
            } else {
                const { error } = await supabase
                    .from('automation_rules')
                    .insert(payload);
                if (error) throw error;
                toast.success('تم إضافة القاعدة بنجاح');
            }
            setShowModal(false);
            fetchRules();
        } catch (err) {
            toast.error('حدث خطأ أثناء الحفظ');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleRuleStatus = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('automation_rules')
            .update({ is_active: !currentStatus })
            .eq('id', id);

        if (error) toast.error('فشل تحديث الحالة');
        else {
            setRules(rules.map(r => r.id === id ? { ...r, is_active: !currentStatus } : r));
            toast.success(currentStatus ? 'تم إيقاف القاعدة' : 'تم تفعيل القاعدة');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه القاعدة؟')) return;

        const { error } = await supabase
            .from('automation_rules')
            .delete()
            .eq('id', id);

        if (error) toast.error('فشل حذف القاعدة');
        else {
            toast.success('تم الحذف بنجاح');
            fetchRules();
        }
    };

    const openModal = (rule: AutomationRule | null = null) => {
        setEditingRule(rule);
        setFormData(rule ? {
            name: rule.name,
            trigger_type: rule.trigger_type,
            keywords: rule.keywords.join(', '),
            response_content: rule.response_content,
            is_active: rule.is_active
        } : {
            name: '',
            trigger_type: 'exact',
            keywords: '',
            response_content: '',
            is_active: true
        });
        setShowModal(true);
    };

    const triggerLabels = {
        exact: 'مطابقة تامة',
        contains: 'يحتوي على',
        starts_with: 'يبدأ بـ'
    };

    const filteredRules = rules.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
    );

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

    return (
        <div className="p-8 space-y-8 bg-brand-off-white min-h-full font-cairo text-right" dir="rtl">
            <SettingsHeader />

            {/* Sub Nav */}
            <div className="flex gap-8 border-b-2 border-brand-beige">
                <Link href="/dashboard/settings/automation" className="pb-4 px-2 text-sm font-bold text-brand-blue-alt/40 hover:text-brand-blue transition-all uppercase tracking-tight">الردود السريعة</Link>
                <Link href="/dashboard/settings/automation/rules" className="pb-4 px-2 text-sm font-black text-brand-green border-b-4 border-brand-green transition-all uppercase tracking-tight">محرك الرد الآلي</Link>
                <Link href="/dashboard/settings/automation/menus" className="pb-4 px-2 text-sm font-bold text-brand-blue-alt/40 hover:text-brand-blue transition-all uppercase tracking-tight">القوائم التفاعلية</Link>
            </div>

            <div className="bg-white rounded-[32px] border-2 border-brand-beige shadow-sm overflow-hidden mt-8">
                <div className="p-8 border-b-2 border-brand-off-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-brand-blue text-white flex items-center justify-center shadow-lg shadow-brand-blue/20">
                            <Zap className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-brand-blue font-cairo">محرك الرد الآلي التلقائي</h2>
                            <p className="text-xs text-brand-blue-alt/40 font-black uppercase tracking-widest">قم ببرمجة النظام للرد تلقائياً على كلمات محددة</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                        <div className="relative">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-blue-alt/30" />
                            <input
                                type="text"
                                placeholder="بحث عن قاعدة ذكية..."
                                className="pr-12 pl-4 py-3 bg-brand-off-white/80 border-2 border-brand-beige rounded-2xl text-sm font-bold text-brand-blue focus:border-brand-green transition-all w-full md:w-72 outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            className="bg-brand-green hover:bg-brand-green-alt text-white font-black gap-2 h-14 px-8 rounded-2xl shadow-xl shadow-brand-green/20 transition-all active:scale-95 mt-2"
                            onClick={() => openModal()}
                        >
                            <Plus className="h-5 w-5" />
                            إنشاء قاعدة جديدة
                        </Button>
                    </div>
                </div>

                <div className="p-6">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                            ))}
                        </div>
                    ) : filteredRules.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <Zap className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-black text-navy mb-1">لا توجد قواعد أتمتة</h3>
                            <p className="text-sm text-gray-400 font-bold">كلما زادت القواعد، زادت سرعة ردك على عملائك</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {filteredRules.map((rule) => (
                                <div key={rule.id} className="p-8 bg-brand-off-white/50 rounded-[32px] border-2 border-brand-beige hover:border-brand-green/30 hover:bg-white hover:shadow-xl transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                                    <div className="flex items-center justify-between mb-6 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border-2 shadow-sm transition-all",
                                                rule.is_active ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-50 text-brand-blue-alt/30 border-brand-beige"
                                            )}>
                                                {rule.is_active ? '● القاعدة نشطة' : '○ متوقفة مؤقتاً'}
                                            </div>
                                            <h3 className="text-2xl font-black text-brand-blue">{rule.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="ghost"
                                                onClick={() => toggleRuleStatus(rule.id, rule.is_active)}
                                                className={cn(
                                                    "h-11 w-11 p-0 rounded-xl transition-all shadow-sm border border-transparent",
                                                    rule.is_active ? "text-amber-500 hover:bg-amber-50 hover:border-amber-100" : "text-brand-green hover:bg-green-50 hover:border-green-100"
                                                )}
                                            >
                                                {rule.is_active ? <XCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                                            </Button>
                                            <Button variant="ghost" onClick={() => openModal(rule)} className="h-11 w-11 p-0 text-brand-blue-alt/40 hover:text-brand-blue hover:bg-brand-off-white rounded-xl border border-transparent hover:border-brand-beige transition-all">
                                                <Edit2 className="h-5 w-5" />
                                            </Button>
                                            <Button variant="ghost" onClick={() => handleDelete(rule.id)} className="h-11 w-11 p-0 text-brand-blue-alt/40 hover:text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all">
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                                        <div className="space-y-4">
                                            <p className="text-[11px] font-black text-brand-blue-alt/40 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                <Search className="h-3 w-3" />
                                                شروط التفعيل والكلمات الذكية
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-3 py-1 bg-brand-blue text-white rounded-lg text-[10px] font-black uppercase tracking-tight">
                                                    {triggerLabels[rule.trigger_type]}
                                                </span>
                                                {rule.keywords.map((kw, i) => (
                                                    <span key={i} className="px-4 py-1.5 bg-white border-2 border-brand-beige rounded-xl text-xs font-black text-brand-blue shadow-sm">
                                                        {kw}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-white/80 p-6 rounded-2xl border-2 border-brand-beige shadow-sm relative group-hover:border-brand-green/20 transition-all">
                                            <div className="flex items-center gap-2 mb-3 text-[11px] font-black text-brand-green uppercase tracking-widest">
                                                <MessageSquare className="h-4 w-4" />
                                                الرد التلقائي المبرمج
                                            </div>
                                            <p className="text-sm font-bold text-brand-blue leading-relaxed text-right">{rule.response_content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-start justify-center pt-40 p-4 font-cairo animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border-4 border-white overflow-hidden animate-in zoom-in-95 duration-300" dir="rtl">
                        {/* Header */}
                        <div className="bg-brand-blue p-5 flex items-center justify-between text-white relative overflow-hidden h-16">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl" />
                            <div className="relative z-10 flex items-center gap-3">
                                <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                                    {editingRule ? <Edit2 className="h-5 w-5 text-brand-green" /> : <Plus className="h-5 w-5 text-brand-green" />}
                                </div>
                                <div>
                                    <h2 className="font-black text-xl">{editingRule ? 'تعديل القاعدة الذكية' : 'إنشاء قاعدة جديدة'}</h2>
                                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1.5">قم ببرمجة النظام للرد تلقائياً بذكاء</p>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-black text-brand-blue flex items-center gap-1.5 mb-2 px-1">اسم القاعدة</label>
                                        <input
                                            type="text"
                                            placeholder="مثال: رد الترحيب"
                                            className="w-full h-10 px-4 bg-brand-off-white/50 border border-brand-beige rounded-xl text-sm font-bold text-brand-blue focus:border-brand-green/50 focus:bg-white transition-all text-right outline-none shadow-sm"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-black text-brand-blue flex items-center gap-1.5 mb-2 px-1">نوع المطابقة الذكية</label>
                                        <div className="relative">
                                            <select
                                                className="w-full h-10 px-4 bg-brand-off-white/50 border border-brand-beige rounded-xl text-sm font-bold text-brand-blue focus:border-brand-green/50 focus:bg-white transition-all text-right appearance-none outline-none shadow-sm"
                                                value={formData.trigger_type}
                                                onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value as any })}
                                            >
                                                <option value="exact">مطابقة تامة للكلام</option>
                                                <option value="contains">يحتوي على الكلمة</option>
                                                <option value="starts_with">يبدأ بـ</option>
                                            </select>
                                            <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue-alt/30 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-black text-brand-blue flex items-center gap-1.5 mb-2 px-1">الكلمات المفتاحية (افصل بينها بفاصلة ,)</label>
                                    <input
                                        type="text"
                                        placeholder="سعر، كم السعر، بكام"
                                        className="w-full h-11 px-4 bg-brand-off-white/50 border border-brand-beige rounded-xl text-sm font-bold text-brand-blue focus:border-brand-green/50 focus:bg-white transition-all text-right outline-none shadow-sm"
                                        value={formData.keywords}
                                        onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                                        required
                                    />
                                    <p className="text-[10px] text-brand-blue-alt/40 font-bold mt-1 px-1">سيتم تفعيل الرد إذا كانت الرسالة تطابق أي من هذه الكلمات</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-black text-brand-blue flex items-center gap-1.5 mb-2 px-1">محتوى الرد الآلي الجديد</label>
                                    <textarea
                                        rows={3}
                                        placeholder="اكتب الرد الذي سيصل للعميل تلقائياً..."
                                        className="w-full px-6 py-4 bg-brand-off-white/50 border border-brand-beige rounded-xl text-sm font-bold text-brand-blue focus:border-brand-green/50 focus:bg-white transition-all resize-none text-right outline-none shadow-sm leading-relaxed"
                                        value={formData.response_content}
                                        onChange={(e) => setFormData({ ...formData, response_content: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-6 border-t border-brand-beige/50 mt-4">
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
                                        className="flex-[2] h-12 bg-brand-green hover:bg-brand-green-alt text-white font-black rounded-xl shadow-lg shadow-brand-green/20 transition-all active:scale-95 text-lg"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : 'حفظ ونشر القاعدة'}
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
