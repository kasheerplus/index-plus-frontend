'use client';

import { X, Receipt, Calendar, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InvoiceModalProps {
    sale: any;
    customer: any;
    onClose: () => void;
}

export function InvoiceModal({ sale, customer, onClose }: InvoiceModalProps) {
    if (!sale) return null;

    const items = typeof sale.items === 'string' ? JSON.parse(sale.items) : (sale.items || []);

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-32 bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-4 border-white overflow-hidden animate-in zoom-in-95 duration-300 mb-10">
                {/* Header */}
                <div className="bg-brand-blue p-6 flex items-center justify-between text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                            <Receipt className="h-5 w-5 text-brand-green" />
                            <h2 className="font-black text-xl">فاتورة مبيعات</h2>
                        </div>
                        <p className="text-white/60 text-xs font-bold font-number">#{sale.id.slice(0, 8)}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors relative z-10"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Customer Info */}
                    <div className="flex items-start justify-between p-4 bg-brand-off-white rounded-2xl border border-brand-beige">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-brand-blue-alt/40 uppercase">المستلم</p>
                            <p className="font-black text-brand-blue">{customer.name}</p>
                            {customer.phone && <p className="text-xs font-bold text-brand-blue-alt font-number">{customer.phone}</p>}
                        </div>
                        <div className="text-left space-y-1">
                            <p className="text-[10px] font-black text-brand-blue-alt/40 uppercase">التاريخ</p>
                            <p className="font-black text-brand-blue text-xs flex items-center gap-1.5 direction-ltr">
                                {new Date(sale.created_at).toLocaleDateString('en-GB')}
                                <Calendar className="h-3 w-3 text-brand-green" />
                            </p>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-black text-brand-blue px-1">المنتجات</h3>
                        <div className="border border-brand-beige rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-brand-off-white text-[10px] font-black text-brand-blue-alt/50 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-right">المنتج</th>
                                        <th className="px-4 py-3 text-center">الكمية</th>
                                        <th className="px-4 py-3 text-left">السعر</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-beige">
                                    {items.map((item: any, idx: number) => (
                                        <tr key={idx} className="bg-white">
                                            <td className="px-4 py-3 font-bold text-brand-blue">{item.name || item.product_name}</td>
                                            <td className="px-4 py-3 font-number text-center text-brand-blue-alt">{item.quantity || 1}</td>
                                            <td className="px-4 py-3 font-number font-black text-left text-brand-green">
                                                {((item.price || 0) * (item.quantity || 1)).toLocaleString()} ج.م
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between p-4 bg-brand-blue text-white rounded-2xl shadow-lg shadow-brand-blue/10">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center">
                                <Coins className="h-4 w-4 text-brand-green" />
                            </div>
                            <span className="font-bold text-sm">الإجمالي النهائي</span>
                        </div>
                        <span className="font-black text-xl font-number tracking-wide">
                            {Number(sale.amount).toLocaleString()} ج.م
                        </span>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t border-brand-beige bg-brand-off-white/30 flex gap-3">
                    <Button onClick={onClose} className="flex-1 bg-white border border-brand-beige text-brand-blue hover:bg-brand-off-white font-bold">
                        إغلاق
                    </Button>
                    <Button className="flex-1 bg-brand-green hover:bg-brand-green-alt text-white font-bold shadow-lg shadow-brand-green/20">
                        تحميل PDF
                    </Button>
                </div>
            </div>
        </div>
    );
}
