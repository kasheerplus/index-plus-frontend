'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShoppingCart, Calculator, Loader2, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface Item {
    id: string;
    name: string;
    price: number;
}

interface CreateSaleModalProps {
    onClose: () => void;
    customerName: string;
    customerId?: string;
    conversationId?: string;
}

export function CreateSaleModal({ onClose, customerName, customerId, conversationId }: CreateSaleModalProps) {
    const [items, setItems] = useState<Item[]>([{ id: '1', name: '', price: 0 }]);
    const [isLoading, setIsLoading] = useState(false);
    const [inventory, setInventory] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState<string | null>(null);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        const { data } = await supabase
            .from('synced_inventory')
            .select('id, name, price, stock_quantity')
            .limit(50);
        if (data) setInventory(data);
    };

    const handleSearch = async (query: string) => {
        if (query.length < 2) return;
        const { data } = await supabase
            .from('synced_inventory')
            .select('id, name, price, stock_quantity')
            .ilike('name', `%${query}%`)
            .limit(10);
        if (data) {
            setInventory(prev => {
                // Merge new results avoiding duplicates
                const newItems = data.filter(d => !prev.some(p => p.id === d.id));
                return [...prev, ...newItems];
            });
        }
    };

    const addItem = () => {
        setItems([...items, { id: Math.random().toString(), name: '', price: 0 }]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof Item, value: any) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const total = items.reduce((acc, current) => acc + (Number(current.price) || 0), 0);

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const cid = user?.app_metadata?.company_id || user?.user_metadata?.company_id;

            const { error } = await supabase
                .from('sales_records')
                .insert([{
                    amount: total,
                    items: items.filter(i => i.name),
                    status: 'pending',
                    customer_id: customerId,
                    conversation_id: conversationId,
                    company_id: cid
                }]);

            if (error) {
                console.error('Supabase Sale Insert Error:', error);
                throw error;
            }

            // --- AUDIT LOG ---
            try {
                await supabase.from('audit_logs').insert([{
                    company_id: cid,
                    user_id: user?.id,
                    action: 'create',
                    entity_type: 'sale',
                    entity_id: undefined, // Will be generated if we had the ID back
                    new_data: { amount: total, customer_name: customerName }
                }]);
            } catch (auditErr) { console.warn('Audit Log failed:', auditErr); }

            // --- KASHEER PLUS SYNC (Outbound) ---
            try {
                // Fetch the Kasheer channel for this company
                const { data: channel } = await supabase
                    .from('channels')
                    .select('*')
                    .eq('platform', 'kasheer_plus')
                    .eq('company_id', cid)
                    .single();

                if (channel?.status === 'connected') {
                    // Trigger outbound sync Edge Function
                    await supabase.functions.invoke('kasheer-sync', {
                        body: {
                            action: 'outbound_sale',
                            sale: { amount: total, items: items.filter(i => i.name) },
                            channel_id: channel.id
                        }
                    });
                }
            } catch (syncErr) {
                console.warn('Kasheer Sync failed but sale was recorded:', syncErr);
                // We don't block the UI for sync failure, as the sale is recorded locally
            }

            toast.success('تم تسجيل العملية ومزامنتها بنجاح!');
            onClose();
        } catch (err: any) {
            console.error('Detailed Sale Error:', JSON.stringify(err, null, 2));
            alert(`حدث خطأ أثناء حفظ الطلب: ${err.message || 'خطأ غير معروف'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-48 px-4 pb-4 bg-brand-blue/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl max-h-[75vh] flex flex-col rounded-[32px] shadow-2xl overflow-hidden font-cairo animate-in zoom-in-95 duration-300 border border-white/20">
                {/* Header */}
                <div className="px-6 py-4 border-b border-brand-beige flex items-center justify-between bg-gradient-to-r from-brand-off-white to-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-brand-green text-white flex items-center justify-center shadow-md shadow-brand-green/20">
                            <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-brand-blue tracking-tight">إتمام عملية بيع</h3>
                            <p className="text-[10px] text-brand-blue-alt/60 font-bold">العميل: <span className="text-brand-green">{customerName}</span></p>
                        </div>
                    </div>
                    <Button variant="ghost" className="p-1 h-8 w-8 rounded-lg text-brand-blue-alt/40 hover:bg-red-50 hover:text-red-500 transition-all" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5 flex-1 overflow-y-auto scrollbar-hide">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-black uppercase text-brand-blue-alt/40 tracking-[0.2em] flex items-center gap-2">
                                <Plus className="h-3 w-3" />
                                المنتجات المطلوبة
                            </h4>
                            <span className="text-[10px] font-black bg-brand-green/10 text-brand-green px-3 py-1 rounded-full">{items.length} منتجات</span>
                        </div>

                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={item.id} className="flex gap-4 items-end group animate-in slide-in-from-right-2" style={{ animationDelay: `${index * 50}ms` }}>
                                    <div className="flex-1">
                                        {index === 0 && <label className="block text-xs font-black text-brand-blue mb-2 mr-1">اسم المنتج أو الخدمة</label>}
                                        <div className="relative">
                                            <Input
                                                placeholder="اسم المنتج..."
                                                className="h-12 rounded-xl bg-brand-off-white border-2 border-brand-beige focus:border-brand-green/30 focus:bg-white pr-10 font-bold transition-all text-xs"
                                                value={item.name}
                                                onChange={(e) => {
                                                    updateItem(item.id, 'name', e.target.value);
                                                    handleSearch(e.target.value);
                                                    setShowSuggestions(item.id);
                                                }}
                                                onFocus={() => setShowSuggestions(item.id)}
                                                onBlur={() => setTimeout(() => setShowSuggestions(null), 200)}
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-blue-alt/30">
                                                <ShoppingCart className="h-4 w-4" />
                                            </div>

                                            {showSuggestions === item.id && inventory.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-brand-beige overflow-hidden z-50 max-h-48 overflow-y-auto">
                                                    {inventory
                                                        .filter(inv => inv.name.toLowerCase().includes(item.name.toLowerCase()))
                                                        .map(inv => (
                                                            <button
                                                                key={inv.id}
                                                                className="w-full text-right px-4 py-3 text-xs font-bold text-brand-blue hover:bg-brand-green/5 hover:text-brand-green transition-all border-b border-brand-beige/30 last:border-none flex justify-between"
                                                                onClick={() => {
                                                                    updateItem(item.id, 'name', inv.name);
                                                                    updateItem(item.id, 'price', inv.price);
                                                                    setShowSuggestions(null);
                                                                }}
                                                            >
                                                                <span>{inv.name}</span>
                                                                <span className="font-number text-brand-blue-alt/50">{inv.price} ج.م</span>
                                                            </button>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-32">
                                        {index === 0 && <label className="block text-xs font-black text-brand-blue mb-1 mr-1">السعر</label>}
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            className="h-12 rounded-xl bg-brand-off-white border-2 border-brand-beige focus:border-brand-green/30 focus:bg-white font-number font-black text-base transition-all"
                                            value={item.price || ''}
                                            onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        className="h-12 w-12 rounded-xl text-red-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                                        onClick={() => removeItem(item.id)}
                                        disabled={items.length === 1}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={addItem}
                            className="w-full h-12 border-2 border-dashed border-brand-beige rounded-xl flex items-center justify-center gap-2 text-brand-blue-alt hover:border-brand-green/40 hover:text-brand-green hover:bg-brand-green/5 transition-all font-black text-xs active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            إضافة منتج إضافي
                        </button>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-brand-blue rounded-2xl p-4 text-white relative overflow-hidden shadow-lg shadow-brand-blue/20 shrink-0">
                        {/* Decorative background circle */}
                        <div className="absolute -bottom-10 -right-10 h-24 w-24 bg-white/5 rounded-full blur-2xl" />

                        <div className="relative space-y-2">
                            <div className="flex justify-between items-center opacity-60 font-bold text-[10px]">
                                <span>المجموع</span>
                                <span className="font-number">{total.toLocaleString()} ج.م</span>
                            </div>
                            <div className="h-[1px] bg-white/10 my-1" />
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-lg bg-brand-green flex items-center justify-center">
                                        <Calculator className="h-3 w-3" />
                                    </div>
                                    <span className="text-sm font-black tracking-tight">الإجمالي</span>
                                </div>
                                <span className="text-xl font-black font-number text-brand-green tracking-wider">{total.toLocaleString()} ج.م</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-brand-beige flex items-center justify-between bg-brand-off-white/30 shrink-0 gap-3">
                    <Button
                        variant="ghost"
                        className="h-10 px-4 font-black text-brand-blue-alt hover:text-brand-blue rounded-xl transition-all text-xs"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        إلغاء
                    </Button>
                    <Button
                        className="h-10 px-8 font-black bg-brand-green hover:bg-brand-green-alt text-white rounded-xl shadow-md shadow-brand-green/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex items-center gap-2 text-sm"
                        onClick={handleConfirm}
                        disabled={isLoading || total === 0 || items.some(i => !i.name)}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                جاري...
                            </>
                        ) : (
                            <>
                                تأكيد
                                <ChevronRight className="h-4 w-4 mr-1" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
