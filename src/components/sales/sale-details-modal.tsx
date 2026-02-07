'use client';

import { X, ShoppingBag, User, Calendar, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SaleDetailsModalProps {
    sale: {
        id: string;
        amount: number;
        status: string;
        created_at: string;
        items: any[];
        customers: {
            name: string;
        };
    };
    onClose: () => void;
}

export function SaleDetailsModal({ sale, onClose }: SaleDetailsModalProps) {
    const statusColors = {
        completed: 'bg-green-100 text-green-600',
        pending: 'bg-amber-100 text-amber-600',
        cancelled: 'bg-red-100 text-red-600'
    };

    const statusText = {
        completed: 'مكتمل',
        pending: 'معلق',
        cancelled: 'ملغي'
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-cairo" onClick={onClose}>
            <div
                className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="sale-details-title"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 id="sale-details-title" className="text-2xl font-black text-navy">تفاصيل الطلب</h2>
                            <p className="text-xs text-gray-400 font-bold font-number">#{sale.id.split('-')[0].toUpperCase()}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        aria-label="إغلاق"
                    >
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Status Badge */}
                <div className="mb-6">
                    <span className={`px-4 py-2 rounded-full text-sm font-black ${statusColors[sale.status as keyof typeof statusColors]}`}>
                        {statusText[sale.status as keyof typeof statusText]}
                    </span>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <User className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-black text-navy">معلومات العميل</h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 font-bold">الاسم</span>
                            <span className="text-sm font-black text-navy">{sale.customers?.name || 'غير معروف'}</span>
                        </div>
                    </div>
                </div>

                {/* Order Info */}
                <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Calendar className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-black text-navy">معلومات الطلب</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 font-bold">تاريخ الإنشاء</span>
                            <span className="text-sm font-black text-navy font-number">
                                {new Date(sale.created_at).toLocaleDateString('ar-EG', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 font-bold">عدد المنتجات</span>
                            <span className="text-sm font-black text-navy font-number">{sale.items?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                            <span className="text-base font-black text-navy">الإجمالي</span>
                            <span className="text-2xl font-black text-primary font-number">{sale.amount} ج.م</span>
                        </div>
                    </div>
                </div>

                {/* Items List */}
                {sale.items && sale.items.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Package className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-black text-navy">المنتجات</h3>
                        </div>
                        <div className="space-y-3">
                            {sale.items.map((item: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-xl">
                                    <div>
                                        <p className="text-sm font-black text-navy">{item.name || `منتج ${index + 1}`}</p>
                                        <p className="text-xs text-gray-400 font-bold">الكمية: {item.quantity || 1}</p>
                                    </div>
                                    <span className="text-sm font-black text-primary font-number">
                                        {item.price || 0} ج.م
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 h-12 font-black"
                    >
                        إغلاق
                    </Button>
                    <Button
                        className="flex-1 h-12 font-black"
                        onClick={() => window.print()}
                    >
                        طباعة الفاتورة
                    </Button>
                </div>
            </div>
        </div>
    );
}
