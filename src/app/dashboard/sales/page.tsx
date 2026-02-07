'use client';

import { useState, useEffect } from 'react';
import {
    ShoppingBag,
    Search,
    Eye,
    CheckCircle2,
    Clock,
    MoreVertical,
    Download,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { SaleDetailsModal } from '@/components/sales/sale-details-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useKasheerConnection } from '@/hooks/use-kasheer-connection';
import { ExternalLink, Package } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Sale {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    items: any[];
    customers: {
        name: string;
    };
}

export default function SalesPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        pending: 0
    });
    const { isConnected: isKasheerConnected } = useKasheerConnection();

    useEffect(() => {
        if (isKasheerConnected) {
            fetchSales();
        } else {
            setIsLoading(false);
        }
    }, [filter, isKasheerConnected]);

    const fetchSales = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('sales_records')
                .select(`
                    id, 
                    amount, 
                    status, 
                    created_at, 
                    items,
                    customers (name)
                `)
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Normalize customers to object if array
            const normalizedData = (data || []).map(sale => ({
                ...sale,
                customers: Array.isArray(sale.customers) ? sale.customers[0] : sale.customers
            }));

            setSales(normalizedData as Sale[]);

            // Calculate simple stats
            const totalAmount = (data || []).reduce((acc, curr) => acc + Number(curr.amount), 0);
            const completedCount = (data || []).filter(s => s.status === 'completed').length;
            const pendingCount = (data || []).filter(s => s.status === 'pending').length;

            setStats({
                total: totalAmount,
                completed: completedCount,
                pending: pendingCount
            });
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const exportToExcel = () => {
        if (filteredSales.length === 0) return;

        const excelData = filteredSales.map(sale => ({
            'رقم الطلب': sale.id.split('-')[0].toUpperCase(),
            'العميل': (Array.isArray(sale.customers) ? sale.customers[0]?.name : sale.customers?.name) || 'غير معروف',
            'التاريخ': new Date(sale.created_at).toLocaleString('ar-EG'),
            'القيمة': Number(sale.amount),
            'الحالة': sale.status === 'completed' ? 'مكتمل' : sale.status === 'pending' ? 'معلق' : 'ملغي'
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'المبيعات');

        // Write to file and download
        XLSX.writeFile(workbook, `sales_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };
    const filteredSales = sales.filter(sale => {
        const matchesSearch = sale.customers?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sale.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="p-8 space-y-8 bg-brand-off-white min-h-full font-cairo">
            {/* Not Connected State */}
            {!isLoading && !isKasheerConnected && (
                <div className="flex items-center justify-center min-h-[600px]">
                    <div className="text-center space-y-6 max-w-md">
                        <div className="h-24 w-24 bg-brand-off-white rounded-full flex items-center justify-center mx-auto border-4 border-brand-beige">
                            <ShoppingBag className="h-12 w-12 text-brand-blue-alt/30" />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-2xl font-black text-brand-blue">لم يتم ربط Kasheer Plus</h2>
                            <p className="text-brand-blue-alt font-bold leading-relaxed">
                                لعرض المبيعات وإنشاء الفواتير، يجب عليك ربط حسابك في Kasheer Plus أولاً من صفحة الإعدادات.
                            </p>
                        </div>
                        <Button
                            className="bg-brand-blue hover:bg-brand-blue-alt text-white font-black gap-2"
                            onClick={() => window.location.href = '/dashboard/settings/channels'}
                        >
                            <ExternalLink className="h-4 w-4" />
                            الذهاب إلى الإعدادات
                        </Button>
                    </div>
                </div>
            )}

            {/* Connected State - Show Sales */}
            {!isLoading && isKasheerConnected && (
                <>
                    {selectedSale && (
                        <SaleDetailsModal
                            sale={selectedSale}
                            onClose={() => setSelectedSale(null)}
                        />
                    )}

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-brand-blue mb-2">سجل المبيعات</h1>
                            <nav className="flex items-center gap-2 text-sm font-bold">
                                <span className="text-brand-blue-alt/60">لوحة التحكم</span>
                                <span className="text-brand-beige">/</span>
                                <span className="text-brand-green">المبيعات</span>
                            </nav>
                        </div>

                        <Button
                            variant="outline"
                            className="font-black gap-2 h-12 border-brand-beige text-brand-blue-alt hover:bg-brand-off-white"
                            onClick={exportToExcel}
                            disabled={filteredSales.length === 0}
                        >
                            <Download className="h-5 w-5" />
                            تصدير إكسل
                        </Button>
                    </div>

                    {/* Stats Cards - Exact Kasheer Plus Style */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'إجمالي المبيعات (ج.م)', value: stats.total.toLocaleString(), icon: ShoppingBag, color: 'text-brand-green', bgColor: 'bg-brand-green/10' },
                            { label: 'طلبات مكتملة', value: stats.completed, icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-50' },
                            { label: 'بانتظار التأكيد', value: stats.pending, icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-50' },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white rounded-[32px] p-6 border-2 border-brand-beige shadow-sm hover:shadow-xl transition-all flex items-center gap-5">
                                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center", stat.bgColor, stat.color)}>
                                    <stat.icon className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-brand-blue-alt/60 uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-3xl font-black text-brand-blue font-number">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-[32px] border-2 border-brand-beige shadow-sm overflow-hidden">
                        <div className="p-6 border-b-2 border-brand-beige flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="relative max-w-md w-full">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue-alt/50" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="بحث برقم الطلب أو العميل..."
                                        className="w-full bg-brand-off-white/50 border-2 border-transparent focus:border-brand-green/20 rounded-xl py-2.5 pr-10 pl-4 text-sm font-bold transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                                {['all', 'completed', 'pending', 'cancelled'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={cn(
                                            "px-5 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all whitespace-nowrap",
                                            filter === f
                                                ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20"
                                                : "bg-brand-off-white text-brand-blue-alt/60 hover:bg-brand-beige/30"
                                        )}
                                    >
                                        {f === 'all' ? 'الكل' : f === 'completed' ? 'مكتمل' : f === 'pending' ? 'معلق' : 'ملغي'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-x-auto min-h-[400px]">
                            {isLoading ? (
                                <div className="space-y-4 p-6">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <Skeleton className="h-4 w-[100px]" />
                                            <Skeleton className="h-4 w-[150px]" />
                                            <Skeleton className="h-4 w-[120px]" />
                                            <Skeleton className="h-4 w-[80px]" />
                                            <Skeleton className="h-6 w-16 rounded-full" />
                                            <Skeleton className="h-8 w-20" />
                                        </div>
                                    ))}
                                </div>
                            ) : filteredSales.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                                    <div className="h-20 w-20 bg-brand-off-white rounded-full flex items-center justify-center border-2 border-brand-beige">
                                        <ShoppingBag className="h-10 w-10 text-brand-green/10" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-brand-blue">لا توجد مبيعات حالياً</h3>
                                        <p className="text-sm text-brand-blue-alt/60 font-bold">ابدأ بتحويل المحادثات إلى مبيعات لتظهر هنا</p>
                                    </div>
                                </div>
                            ) : (
                                <table className="w-full text-right">
                                    <thead>
                                        <tr className="bg-brand-off-white/50 text-brand-blue-alt text-[11px] font-black uppercase tracking-widest border-b border-brand-beige">
                                            <th className="px-6 py-5">رقم الطلب</th>
                                            <th className="px-6 py-5">العميل</th>
                                            <th className="px-6 py-5">التاريخ</th>
                                            <th className="px-6 py-5">القيمة</th>
                                            <th className="px-6 py-5">الحالة</th>
                                            <th className="px-6 py-5 text-center">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-beige">
                                        {filteredSales.map((sale) => (
                                            <tr key={sale.id} className="hover:bg-brand-off-white/30 transition-all group">
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <span className="text-[11px] font-black text-brand-blue font-number tracking-wider">#{sale.id.split('-')[0].toUpperCase()}</span>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <p className="text-sm font-black text-brand-blue">{sale.customers?.name || 'عميل غير معروف'}</p>
                                                    <p className="text-[10px] text-brand-blue-alt/50 font-bold">{sale.items?.length || 0} منتجات</p>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-xs text-brand-blue-alt font-number font-black">
                                                    {new Date(sale.created_at).toLocaleDateString('ar-EG')}
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-sm font-black text-brand-green font-number">
                                                    {sale.amount.toLocaleString()} ج.م
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm",
                                                        sale.status === 'completed' ? "bg-green-100 text-green-600 border border-green-200" :
                                                            sale.status === 'pending' ? "bg-amber-100 text-amber-600 border border-amber-200" : "bg-red-100 text-red-600 border border-red-200"
                                                    )}>
                                                        {sale.status === 'completed' ? 'مكتمل' : sale.status === 'pending' ? 'معلق' : 'ملغي'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            className="p-2 h-auto text-brand-blue-alt/50 hover:text-brand-blue hover:bg-brand-blue/5"
                                                            onClick={() => setSelectedSale(sale)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" className="p-2 h-auto text-brand-blue-alt/50 hover:text-brand-blue hover:bg-brand-blue/5">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
