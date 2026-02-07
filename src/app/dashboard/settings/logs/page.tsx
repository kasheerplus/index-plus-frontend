'use client';

import { useState, useEffect } from 'react';
import {
    History,
    Search,
    Filter,
    User,
    Activity,
    AlertCircle,
    CheckCircle2,
    XCircle,
    ArrowRightCircle,
    Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SettingsHeader } from '@/components/settings/settings-header';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface AuditLog {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    created_at: string;
    user_id: string;
    old_data: any;
    new_data: any;
    users: {
        full_name: string;
    } | null;
}

export default function LogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select(`
                    *,
                    users (
                        full_name
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setLogs(data as any[] || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'create': return <CheckCircle2 className="h-4 w-4 text-brand-green" />;
            case 'update': return <ArrowRightCircle className="h-4 w-4 text-brand-blue" />;
            case 'delete': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <Activity className="h-4 w-4 text-brand-blue-alt/50" />;
        }
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'create': return 'إضافة';
            case 'update': return 'تعديل';
            case 'delete': return 'حذف';
            case 'login': return 'دخول';
            case 'export': return 'تصدير';
            default: return action;
        }
    };

    const getEntityLabel = (type: string) => {
        switch (type) {
            case 'sale': return 'مبيعات';
            case 'customer': return 'عميل';
            case 'setting': return 'إعدادات';
            case 'member': return 'عضو';
            case 'channel': return 'قناة';
            default: return type;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-right font-cairo" dir="rtl">
            {/* Header Card */}
            <div className="bg-white rounded-[32px] p-8 border-2 border-brand-beige shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-brand-off-white flex items-center justify-center border-2 border-brand-beige shadow-sm">
                        <History className="h-6 w-6 text-brand-blue" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-brand-blue">سجل النشاطات</h1>
                        <p className="text-sm text-brand-blue-alt/40 font-bold mt-1">تتبع جميع العمليات والتغييرات التي تمت على النظام لضمان الأمان والشفافية.</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="relative max-w-md w-full">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-blue-alt/30" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="بحث في السجلات والنشاطات..."
                        className="w-full bg-white border-2 border-brand-beige rounded-2xl py-3.5 pr-12 pl-4 text-sm font-bold text-brand-blue shadow-sm focus:border-brand-green transition-all outline-none"
                    />
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => toast.success('سيتم إضافة خيارات التصفية المتقدمة قريباً')}
                        className="flex items-center gap-3 px-6 py-3.5 bg-white border-2 border-brand-beige rounded-2xl text-sm font-black text-brand-blue-alt/60 hover:bg-brand-off-white transition-all shadow-sm"
                    >
                        <Filter className="h-4 w-4" />
                        تصفية النتائج
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border-2 border-brand-beige shadow-sm overflow-hidden">
                <div className="overflow-x-auto min-h-[500px]">
                    {isLoading ? (
                        <div className="p-8 space-y-6">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                            ))}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <History className="h-20 w-20 text-brand-blue-alt/5 mb-6" />
                            <h3 className="text-xl font-black text-brand-blue opacity-30">لا توجد سجلات أمان حالياً</h3>
                        </div>
                    ) : (
                        <table className="w-full text-right" dir="rtl">
                            <thead>
                                <tr className="bg-brand-off-white/50 text-brand-blue-alt/60 text-[11px] font-black uppercase tracking-widest border-b-2 border-brand-off-white">
                                    <th className="px-8 py-5 text-right">النشاط والوصف</th>
                                    <th className="px-8 py-5 text-right">بواسطة العضو</th>
                                    <th className="px-8 py-5 text-right">نوع الكيان</th>
                                    <th className="px-8 py-5 text-right">تاريخ والوقت</th>
                                    <th className="px-8 py-5 text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-brand-off-white">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-brand-off-white transition-all group border-b-2 border-brand-off-white last:border-0 text-right">
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-brand-off-white flex items-center justify-center border border-brand-beige">
                                                    {getActionIcon(log.action)}
                                                </div>
                                                <span className="text-base font-black text-brand-blue">
                                                    {getActionLabel(log.action)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-3 direct-rtl">
                                                <div className="h-8 w-8 rounded-full bg-brand-green/10 flex items-center justify-center border border-brand-green/20">
                                                    <User className="h-4 w-4 text-brand-green" />
                                                </div>
                                                <span className="text-sm font-black text-brand-blue-alt/70">
                                                    {log.users?.full_name || 'نظام ذكي تلقائي'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <span className="text-[11px] font-black px-4 py-1.5 bg-brand-blue/5 text-brand-blue rounded-full border border-brand-blue/10 uppercase tracking-tighter">
                                                {getEntityLabel(log.entity_type)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <span className="text-xs font-bold text-brand-blue-alt/40 font-number">
                                                {format(new Date(log.created_at), 'PPP p', { locale: ar })}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-center">
                                            <button className="h-10 w-10 flex items-center justify-center mx-auto text-brand-blue-alt/30 hover:text-brand-green hover:bg-white rounded-xl transition-all border border-transparent hover:border-brand-beige shadow-sm">
                                                <Info className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
