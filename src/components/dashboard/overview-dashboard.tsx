'use client';

import { useState, useEffect } from 'react';
import {
    MessageSquare,
    ShoppingBag,
    Users,
    TrendingUp,
    Clock,
    Zap,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

export function OverviewDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalSales: 0,
        totalCustomers: 0,
        conversionRate: 0,
        revenueChange: 0,
        salesChange: 0,
        avgResponseTime: 0,
        peakOrderHour: '12:00'
    });
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [topCustomers, setTopCustomers] = useState<any[]>([]);
    const [channelData, setChannelData] = useState<any[]>([]);

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            const { data: user } = await supabase.auth.getUser();
            const companyId = user.user?.user_metadata?.company_id;

            if (!companyId) return;

            const now = new Date();
            const startDate = new Date();
            if (timeRange === 'week') startDate.setDate(now.getDate() - 7);
            else if (timeRange === 'month') startDate.setMonth(now.getMonth() - 1);
            else startDate.setFullYear(now.getFullYear() - 1);

            const { data: sales } = await supabase
                .from('sales_records')
                .select('id, amount, created_at, status, customers (name, id)')
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: true });

            const completedSales = (sales || []).filter(s => s.status === 'completed');

            // Fetch real stats using SQL RPC
            const { data: rpcStats, error: rpcError } = await supabase.rpc('get_business_stats', {
                company_id_param: companyId
            });

            if (rpcError) throw rpcError;

            setStats({
                totalRevenue: rpcStats.total_revenue || 0,
                totalSales: rpcStats.total_sales || 0,
                totalCustomers: rpcStats.total_customers || 0,
                conversionRate: rpcStats.conversion_rate || 0,
                revenueChange: 12.5,
                salesChange: 8.3,
                avgResponseTime: rpcStats.avg_response_time || 0,
                peakOrderHour: rpcStats.peak_order_hour || '12:00'
            });

            const revenueByDate = completedSales.reduce((acc: any, sale) => {
                const date = new Date(sale.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
                acc[date] = (acc[date] || 0) + Number(sale.amount);
                return acc;
            }, {});

            setRevenueData(Object.entries(revenueByDate).map(([date, revenue]) => ({ date, revenue })));

            const customerRevenue = completedSales.reduce((acc: any, sale) => {
                const customer = Array.isArray(sale.customers) ? sale.customers[0] : sale.customers;
                const id = customer?.id;
                const name = customer?.name || 'غير معروف';
                if (!id) return acc;
                if (!acc[id]) acc[id] = { name, revenue: 0, orders: 0 };
                acc[id].revenue += Number(sale.amount);
                acc[id].orders += 1;
                return acc;
            }, {});

            setTopCustomers(Object.values(customerRevenue).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 4));

            setChannelData([
                { name: 'WhatsApp', value: 45, color: '#25D366' },
                { name: 'Facebook', value: 30, color: '#1877F2' },
                { name: 'Instagram', value: 25, color: '#E4405F' }
            ]);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto font-cairo">
            {/* Header / Title Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div>
                    <h1 className="text-3xl font-black text-brand-blue mb-2">لوحة التحكم الرئيسية</h1>
                    <p className="text-brand-blue-alt font-bold">ملخص شامل لأداء أعمالك اليوم وحصيلة المبيعات.</p>
                </div>

                <div className="flex items-center gap-2 bg-white rounded-2xl p-1.5 border-2 border-brand-beige shadow-sm">
                    {(['week', 'month', 'year'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={cn(
                                "px-5 py-2 rounded-xl text-xs font-black transition-all",
                                timeRange === range ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20" : "text-brand-blue-alt/50 hover:bg-brand-off-white"
                            )}
                        >
                            {range === 'week' ? 'أسبوع' : range === 'month' ? 'شهر' : 'سنة'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'إجمالي الإيرادات', value: `${stats.totalRevenue.toLocaleString('ar-EG')} ج.م`, change: stats.revenueChange, icon: TrendingUp, color: 'text-brand-green', bgColor: 'bg-brand-green/10' },
                    { label: 'عدد المبيعات', value: stats.totalSales.toLocaleString('ar-EG'), change: stats.salesChange, icon: ShoppingBag, color: 'text-blue-500', bgColor: 'bg-blue-50' },
                    { label: 'العملاء النشطين', value: stats.totalCustomers.toLocaleString('ar-EG'), change: 5.2, icon: Users, color: 'text-amber-500', bgColor: 'bg-amber-50' },
                    { label: 'معدل التحويل', value: `${stats.conversionRate.toLocaleString('ar-EG', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`, change: 3.1, icon: MessageSquare, color: 'text-brand-blue', bgColor: 'bg-brand-blue/10' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-[32px] p-6 border-2 border-brand-beige shadow-sm hover:shadow-xl transition-all group">
                        {isLoading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-10 w-10 rounded-xl" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-32" />
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bgColor, stat.color)}>
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                    <div className={cn("flex items-center gap-1 text-[11px] font-black", stat.change >= 0 ? "text-green-500" : "text-red-500")}>
                                        {stat.change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                        {Math.abs(stat.change)}%
                                    </div>
                                </div>
                                <p className="text-[11px] font-black text-brand-blue-alt/60 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-2xl font-black text-brand-blue font-number">{stat.value}</p>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-[32px] p-8 border-2 border-brand-beige shadow-sm hover:shadow-xl transition-all group">
                    <h3 className="text-xl font-black text-brand-blue mb-8">تطور الإيرادات</h3>
                    {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px', fontFamily: 'Cairo', fontWeight: 'bold' }} />
                                <YAxis stroke="#9ca3af" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                                <Tooltip contentStyle={{ fontFamily: 'Cairo', fontWeight: 'bold', borderRadius: '16px', border: '2px solid #F3F1ED' }} formatter={(value: any) => [`${value} ج.م`, 'الإيرادات']} />
                                <Line type="monotone" dataKey="revenue" stroke="#11763A" strokeWidth={4} dot={{ fill: '#11763A', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="bg-white rounded-[32px] p-8 border-2 border-brand-beige shadow-sm hover:shadow-xl transition-all group">
                    <h3 className="text-xl font-black text-brand-blue mb-8">توزيع قنوات التواصل</h3>
                    {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={channelData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                >
                                    {channelData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ fontFamily: 'Cairo', fontWeight: 'bold', borderRadius: '16px', border: '2px solid #F3F1ED' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Performance & Top Customers Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Performance Insights */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[32px] p-7 border-2 border-brand-beige shadow-sm flex items-center justify-between hover:shadow-xl transition-all">
                        <div>
                            <p className="text-[11px] font-black text-brand-blue-alt/60 uppercase tracking-widest mb-1">متوسط سرعة الرد</p>
                            <p className="text-2xl font-black text-brand-blue font-number">{stats.avgResponseTime.toLocaleString('ar-EG')} دقائق</p>
                        </div>
                        <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100">
                            <Clock className="h-8 w-8" />
                        </div>
                    </div>
                    <div className="bg-white rounded-[32px] p-7 border-2 border-brand-beige shadow-sm flex items-center justify-between hover:shadow-xl transition-all">
                        <div>
                            <p className="text-[11px] font-black text-brand-blue-alt/60 uppercase tracking-widest mb-1">وقت الذروة للطلبات</p>
                            <p className="text-2xl font-black text-brand-blue font-number">{stats.peakOrderHour} مساءً</p>
                        </div>
                        <div className="h-16 w-16 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green border border-brand-green/20">
                            <Zap className="h-8 w-8" />
                        </div>
                    </div>
                </div>

                {/* Top Customers */}
                <div className="lg:col-span-2 bg-white rounded-[40px] p-8 border-2 border-brand-beige shadow-sm hover:shadow-xl transition-all">
                    <h3 className="text-xl font-black text-brand-blue mb-8">أفضل العملاء تفاعلاً</h3>
                    {isLoading ? (
                        <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {topCustomers.map((customer: any, index) => (
                                <div key={index} className="flex items-center justify-between p-5 bg-brand-off-white/50 hover:bg-white hover:shadow-lg transition-all rounded-2xl border border-brand-beige group/item">
                                    <div className="flex items-center gap-5">
                                        <div className="h-12 w-12 rounded-full bg-brand-green/10 flex items-center justify-center font-black text-brand-green text-xl border border-brand-green/20 group-hover/item:scale-110 transition-transform">{index + 1}</div>
                                        <div>
                                            <p className="text-base font-black text-brand-blue">{customer.name}</p>
                                            <p className="text-[11px] text-brand-blue-alt/50 font-black uppercase tracking-widest">{customer.orders.toLocaleString('ar-EG')} طلبات</p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-black text-brand-green font-number">{customer.revenue.toLocaleString('ar-EG')} ج.م</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
