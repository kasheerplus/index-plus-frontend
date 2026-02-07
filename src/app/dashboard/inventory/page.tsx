'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Box,
    Search,
    RefreshCw,
    AlertTriangle,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    Layers,
    History,
    ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';

interface Product {
    id: string;
    remote_id: string;
    name: string;
    sku: string;
    category: string;
    price: number;
    stock_quantity: number;
    unit: string;
    image_url: string;
    last_synced_at: string;
}

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [isKasheerConnected, setIsKasheerConnected] = useState<boolean | null>(null);

    useEffect(() => {
        checkKasheerConnection();
    }, []);

    const checkKasheerConnection = async () => {
        setIsLoading(true);
        try {
            // Check if Kasheer Plus channel exists and is active
            const { data: channel, error } = await supabase
                .from('channels')
                .select('*')
                .eq('platform', 'kasheer_plus')
                .eq('status', 'connected')
                .maybeSingle();

            if (error) {
                console.error('Error checking Kasheer connection:', error);
                // If table doesn't exist or other error, assume not connected
                setIsKasheerConnected(false);
            } else if (channel) {
                setIsKasheerConnected(true);
                await fetchInventory();
            } else {
                setIsKasheerConnected(false);
            }
        } catch (err) {
            console.error('Error:', err);
            setIsKasheerConnected(false);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInventory = async () => {
        const { data, error } = await supabase
            .from('synced_inventory')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            toast.error('فشل تحميل المخزون');
            console.error(error);
        } else {
            setProducts(data || []);
            if (data && data.length > 0) {
                setLastSync(data[0].last_synced_at);
            }
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const lowStockItems = products.filter(p => p.stock_quantity <= 5).length;
    const totalItems = products.length;
    const totalValue = products.reduce((acc, p) => acc + (p.price * p.stock_quantity), 0);

    return (
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 bg-brand-off-white min-h-full font-cairo">
            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center space-y-4">
                        <RefreshCw className="h-12 w-12 text-brand-blue animate-spin mx-auto" />
                        <p className="text-brand-blue-alt font-bold">جاري التحقق من الاتصال...</p>
                    </div>
                </div>
            )}

            {/* Not Connected State */}
            {!isLoading && isKasheerConnected === false && (
                <div className="flex items-center justify-center min-h-[600px]">
                    <div className="text-center space-y-6 max-w-md">
                        <div className="h-24 w-24 bg-brand-off-white rounded-full flex items-center justify-center mx-auto border-4 border-brand-beige">
                            <Package className="h-12 w-12 text-brand-blue-alt/30" />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-2xl font-black text-brand-blue">لم يتم ربط Kasheer Plus</h2>
                            <p className="text-brand-blue-alt font-bold leading-relaxed">
                                لعرض المخزن والمنتجات، يجب عليك ربط حسابك في Kasheer Plus أولاً من صفحة الإعدادات.
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

            {/* Connected State - Show Inventory */}
            {!isLoading && isKasheerConnected === true && (
                <>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-brand-blue mb-2">المخزن المتزامن</h1>
                            <div className="flex items-center gap-2">
                                <Box className="h-4 w-4 text-brand-green" />
                                <p className="text-sm font-bold text-brand-blue-alt">
                                    بيانات مباشرة من <span className="text-brand-green font-black">نظام إندكس بلس</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border-2 border-brand-beige shadow-sm">
                            <div className="text-left md:text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">آخر مزامنة</p>
                                <p className="text-sm font-black text-brand-blue">
                                    {lastSync ? new Date(lastSync).toLocaleString('ar-EG') : 'لا يوجد'}
                                </p>
                            </div>
                            <Button
                                onClick={fetchInventory}
                                variant="ghost"
                                className="h-10 w-10 rounded-xl bg-brand-off-white text-brand-green hover:bg-white hover:rotate-180 transition-all duration-500"
                            >
                                <RefreshCw className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards - Exact Kasheer Plus Style */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-[32px] border-2 border-brand-beige shadow-sm hover:shadow-xl transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Layers className="h-6 w-6" />
                                </div>
                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">إجمالي الأصناف</span>
                            </div>
                            <h3 className="text-3xl font-black text-brand-blue font-number">{totalItems}</h3>
                            <p className="text-sm font-bold text-brand-blue-alt mt-1">صنف متطابق من النظام</p>
                        </div>

                        <div className="bg-white p-6 rounded-[32px] border-2 border-brand-beige shadow-sm hover:shadow-xl transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                                    <AlertTriangle className="h-6 w-6" />
                                </div>
                                <span className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1 rounded-full">نواقص المخزن</span>
                            </div>
                            <h3 className="text-3xl font-black text-brand-blue font-number">{lowStockItems}</h3>
                            <p className="text-sm font-bold text-brand-blue-alt mt-1">أصناف تحتاج لإعادة الطلب</p>
                        </div>

                        <div className="bg-white p-6 rounded-[32px] border-2 border-brand-beige shadow-sm hover:shadow-xl transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                                    <Package className="h-6 w-6" />
                                </div>
                                <span className="text-[10px] font-black text-brand-green bg-brand-green/10 px-3 py-1 rounded-full">قيمة المخزون</span>
                            </div>
                            <h3 className="text-3xl font-black text-brand-blue font-number">{totalValue.toLocaleString()} <span className="text-sm font-bold">ج.م</span></h3>
                            <p className="text-sm font-bold text-brand-blue-alt mt-1">إجمالي تكلفة الأصناف الحالية</p>
                        </div>
                    </div>

                    {/* Search & Actions - Exact Kasheer Plus Style */}
                    <div className="bg-white rounded-[32px] border-2 border-brand-beige shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-brand-beige flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="بحث بالاسم، SKU، أو التصنيف..."
                                    className="w-full pr-12 pl-4 py-3.5 bg-brand-off-white/50 border-2 border-transparent focus:border-brand-green/20 rounded-2xl text-sm font-bold transition-all text-right outline-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" className="rounded-xl font-bold text-brand-blue-alt hover:bg-brand-off-white gap-2">
                                    <Filter className="h-4 w-4" />
                                    تصفية
                                </Button>
                                <Button variant="ghost" className="rounded-xl font-bold text-brand-blue-alt hover:bg-brand-off-white gap-2">
                                    <History className="h-4 w-4" />
                                    سجل المزامنة
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-brand-off-white/50 border-b border-brand-beige">
                                    <tr>
                                        <th className="px-6 py-5 text-[11px] font-black text-brand-blue-alt uppercase tracking-widest">المنتج</th>
                                        <th className="px-6 py-5 text-[11px] font-black text-brand-blue-alt uppercase tracking-widest text-center">التصنيف</th>
                                        <th className="px-6 py-5 text-[11px] font-black text-brand-blue-alt uppercase tracking-widest text-center">السعر</th>
                                        <th className="px-6 py-5 text-[11px] font-black text-brand-blue-alt uppercase tracking-widest text-center">الكمية</th>
                                        <th className="px-6 py-5 text-[11px] font-black text-brand-blue-alt uppercase tracking-widest text-left">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-beige">
                                    {isLoading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i}>
                                                <td className="px-6 py-5"><Skeleton className="h-10 w-48 rounded-lg" /></td>
                                                <td className="px-6 py-5 text-center"><Skeleton className="h-6 w-24 mx-auto rounded-lg" /></td>
                                                <td className="px-6 py-5 text-center"><Skeleton className="h-6 w-16 mx-auto rounded-lg" /></td>
                                                <td className="px-6 py-5 text-center"><Skeleton className="h-6 w-12 mx-auto rounded-lg" /></td>
                                                <td className="px-6 py-5 text-left"><Skeleton className="h-6 w-20 rounded-lg" /></td>
                                            </tr>
                                        ))
                                    ) : filteredProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-24 text-center">
                                                <div className="h-20 w-20 bg-brand-off-white rounded-full flex items-center justify-center mx-auto mb-6 text-brand-blue/10">
                                                    <Package className="h-10 w-10 text-brand-green" />
                                                </div>
                                                <h3 className="text-xl font-black text-brand-blue mb-2">لا توجد منتجات متزامنة</h3>
                                                <p className="text-sm text-brand-blue-alt font-bold max-w-xs mx-auto">
                                                    يرجى التأكد من ربط حسابك وتفعيل خاصية المزامنة.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredProducts.map((product) => (
                                            <tr key={product.id} className="group hover:bg-brand-off-white/30 transition-all">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-14 w-14 rounded-2xl bg-brand-off-white flex items-center justify-center overflow-hidden border-2 border-brand-beige shadow-sm">
                                                            {product.image_url ? (
                                                                <img src={product.image_url} alt="" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <Package className="h-6 w-6 text-brand-green/30" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-base font-black text-brand-blue">{product.name}</p>
                                                            <p className="text-[11px] font-bold text-gray-400 uppercase">SKU: {product.sku || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="px-4 py-1.5 bg-brand-off-white rounded-xl text-xs font-black text-brand-blue border border-brand-beige">
                                                        {product.category || 'عام'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="text-base font-black text-brand-blue font-number">{product.price.toLocaleString()} ج.م</span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className={cn(
                                                        "text-base font-black font-number",
                                                        product.stock_quantity <= 5 ? "text-red-500" : "text-brand-blue"
                                                    )}>
                                                        {product.stock_quantity}
                                                        <span className="text-xs mr-1 opacity-50">{product.unit}</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-left">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {product.stock_quantity <= 5 && (
                                                            <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                                        )}
                                                        <span className={cn(
                                                            "text-[11px] font-black px-3 py-1 rounded-lg uppercase tracking-wider shadow-sm",
                                                            product.stock_quantity > 0 ? "bg-brand-green/10 text-brand-green border border-brand-green/20" : "bg-red-50 text-red-600 border border-red-100"
                                                        )}>
                                                            {product.stock_quantity > 0 ? 'متاح' : 'نافد'}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
