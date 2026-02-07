'use client';

import { useState, useEffect } from 'react';
import {
    CreditCard,
    Download,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    RefreshCw,
    Loader2,
    Smartphone,
    Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { SettingsHeader } from '@/components/settings/settings-header';

interface PaymentTransaction {
    id: string;
    amount: number;
    currency: string;
    payment_method: string;
    status: string;
    failure_reason?: string;
    created_at: string;
    paid_at?: string;
    expires_at?: string;
    gateway_reference_code?: string;
    customers?: {
        name: string;
        phone: string;
    };
    sales_records?: {
        id: string;
    };
}

const paymentMethodLabels: Record<string, string> = {
    fawry: 'فوري',
    vodafone_cash: 'فودافون كاش',
    orange_money: 'أورانج موني',
    etisalat_cash: 'اتصالات كاش',
    card: 'بطاقة بنكية',
    manual: 'يدوي'
};

const statusLabels: Record<string, string> = {
    pending: 'قيد الانتظار',
    processing: 'جاري المعالجة',
    success: 'مكتمل',
    failed: 'فشل',
    expired: 'منتهي',
    refunded: 'مسترد'
};

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [methodFilter, setMethodFilter] = useState<string>('all');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('payment_transactions')
                .select('*, customers(name, phone), sales_records(id)')
                .order('created_at', { ascending: false });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            if (methodFilter !== 'all') {
                query = query.eq('payment_method', methodFilter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [statusFilter, methodFilter]);

    const filteredTransactions = transactions.filter(t => {
        const searchLower = searchQuery.toLowerCase();
        return (
            t.customers?.name?.toLowerCase().includes(searchLower) ||
            t.customers?.phone?.includes(searchQuery) ||
            t.id.toLowerCase().includes(searchLower) ||
            t.gateway_reference_code?.includes(searchQuery)
        );
    });

    const exportToCSV = () => {
        const headers = ['التاريخ', 'العميل', 'الهاتف', 'المبلغ', 'الطريقة', 'الحالة', 'رقم المعاملة'];
        const rows = filteredTransactions.map(t => [
            new Date(t.created_at).toLocaleDateString('ar-EG'),
            t.customers?.name || 'غير معروف',
            t.customers?.phone || '-',
            `${t.amount} ${t.currency}`,
            paymentMethodLabels[t.payment_method] || t.payment_method,
            statusLabels[t.status] || t.status,
            t.id
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            success: 'bg-green-100 text-green-700 border-green-200',
            pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            processing: 'bg-blue-100 text-blue-700 border-blue-200',
            failed: 'bg-red-100 text-red-700 border-red-200',
            expired: 'bg-gray-100 text-gray-700 border-gray-200',
            refunded: 'bg-purple-100 text-purple-700 border-purple-200'
        };

        const icons = {
            success: <CheckCircle2 className="h-3 w-3" />,
            pending: <Clock className="h-3 w-3" />,
            processing: <RefreshCw className="h-3 w-3 animate-spin" />,
            failed: <XCircle className="h-3 w-3" />,
            expired: <AlertCircle className="h-3 w-3" />,
            refunded: <RefreshCw className="h-3 w-3" />
        };

        return (
            <div className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border-2', styles[status as keyof typeof styles] || styles.pending)}>
                {icons[status as keyof typeof icons]}
                {statusLabels[status] || status}
            </div>
        );
    };

    const getMethodIcon = (method: string) => {
        if (method === 'card') return <CreditCard className="h-4 w-4" />;
        if (method.includes('cash') || method.includes('money')) return <Smartphone className="h-4 w-4" />;
        return <Banknote className="h-4 w-4" />;
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center font-cairo">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 bg-brand-off-white min-h-full font-cairo text-right" dir="rtl">
            <SettingsHeader />

            {/* Header */}
            <div className="bg-white rounded-[32px] p-8 border-2 border-brand-beige shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-brand-blue text-white flex items-center justify-center shadow-lg shadow-brand-blue/20">
                            <CreditCard className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-brand-blue">إدارة المدفوعات</h1>
                            <p className="text-sm text-brand-blue-alt/60 font-bold">عرض وإدارة جميع المعاملات المالية</p>
                        </div>
                    </div>
                    <Button
                        onClick={exportToCSV}
                        className="bg-brand-green hover:bg-brand-green-alt text-white font-black rounded-2xl h-12 px-6 shadow-lg shadow-brand-green/20"
                    >
                        <Download className="h-4 w-4 ml-2" />
                        تصدير CSV
                    </Button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-blue-alt/40" />
                        <input
                            type="text"
                            placeholder="بحث بالاسم، الهاتف، أو رقم المعاملة..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 pr-12 pl-4 bg-brand-off-white border-2 border-brand-beige rounded-2xl text-sm font-bold focus:border-brand-green outline-none"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-12 px-4 bg-brand-off-white border-2 border-brand-beige rounded-2xl text-sm font-bold focus:border-brand-green outline-none"
                    >
                        <option value="all">كل الحالات</option>
                        <option value="success">مكتمل</option>
                        <option value="pending">قيد الانتظار</option>
                        <option value="processing">جاري المعالجة</option>
                        <option value="failed">فشل</option>
                        <option value="expired">منتهي</option>
                    </select>

                    <select
                        value={methodFilter}
                        onChange={(e) => setMethodFilter(e.target.value)}
                        className="h-12 px-4 bg-brand-off-white border-2 border-brand-beige rounded-2xl text-sm font-bold focus:border-brand-green outline-none"
                    >
                        <option value="all">كل طرق الدفع</option>
                        <option value="fawry">فوري</option>
                        <option value="card">بطاقة بنكية</option>
                        <option value="vodafone_cash">فودافون كاش</option>
                        <option value="orange_money">أورانج موني</option>
                        <option value="etisalat_cash">اتصالات كاش</option>
                    </select>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-[32px] border-2 border-brand-beige shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-brand-off-white border-b-2 border-brand-beige">
                            <tr>
                                <th className="px-6 py-4 text-right text-xs font-black text-brand-blue-alt/60 uppercase tracking-wider">التاريخ</th>
                                <th className="px-6 py-4 text-right text-xs font-black text-brand-blue-alt/60 uppercase tracking-wider">العميل</th>
                                <th className="px-6 py-4 text-right text-xs font-black text-brand-blue-alt/60 uppercase tracking-wider">المبلغ</th>
                                <th className="px-6 py-4 text-right text-xs font-black text-brand-blue-alt/60 uppercase tracking-wider">طريقة الدفع</th>
                                <th className="px-6 py-4 text-right text-xs font-black text-brand-blue-alt/60 uppercase tracking-wider">الحالة</th>
                                <th className="px-6 py-4 text-right text-xs font-black text-brand-blue-alt/60 uppercase tracking-wider">رقم المعاملة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-beige">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <CreditCard className="h-12 w-12 text-brand-blue-alt/20" />
                                            <p className="text-sm font-bold text-brand-blue-alt/60">لا توجد معاملات</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-brand-off-white/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-brand-blue-alt">
                                            {new Date(transaction.created_at).toLocaleDateString('ar-EG', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-black text-brand-blue">{transaction.customers?.name || 'غير معروف'}</p>
                                                <p className="text-xs text-brand-blue-alt/60 font-bold">{transaction.customers?.phone || '-'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-lg font-black text-brand-blue font-number">{transaction.amount}</span>
                                            <span className="text-xs text-brand-blue-alt/60 font-bold mr-1">{transaction.currency}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getMethodIcon(transaction.payment_method)}
                                                <span className="text-sm font-bold text-brand-blue-alt">
                                                    {paymentMethodLabels[transaction.payment_method] || transaction.payment_method}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(transaction.status)}
                                            {transaction.failure_reason && (
                                                <p className="text-[10px] text-red-600 mt-1 font-bold">{transaction.failure_reason}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-xs font-mono text-brand-blue-alt/60 bg-brand-off-white px-2 py-1 rounded">
                                                {transaction.id.substring(0, 8)}...
                                            </code>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
