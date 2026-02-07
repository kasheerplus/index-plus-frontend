'use client';

import { useState } from 'react';
import {
    X,
    MapPin,
    Phone,
    Mail,
    ShoppingBag,
    MessageCircle,
    Plus,
    StickyNote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CustomerProfileProps {
    onClose: () => void;
}

export function CustomerProfile({ onClose }: CustomerProfileProps) {
    return (
        <div className="flex flex-col h-full bg-white font-cairo border-r border-gray-100 animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <h3 className="text-xl font-black text-navy uppercase tracking-tight">ملف العميل</h3>
                <Button variant="ghost" className="p-1 h-auto text-gray-400" onClick={onClose}>
                    <X className="h-6 w-6" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Profile Card */}
                <div className="p-8 text-center bg-accent/30">
                    <div className="h-24 w-24 rounded-full bg-navy mx-auto border-4 border-white shadow-xl flex items-center justify-center text-3xl font-black text-white mb-4">
                        ع
                    </div>
                    <h2 className="text-2xl font-black text-navy mb-1">عبدالله صابر</h2>
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="bg-primary/20 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">VIP</span>
                        <span className="bg-gray-200 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded-full">مهتم</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <button className="flex flex-col items-center p-3 rounded-2xl bg-white border border-gray-100 hover:border-primary/50 transition-all shadow-sm">
                            <span className="text-xs font-black text-gray-400 mb-1">إجمالي المشتريات</span>
                            <span className="text-sm font-black text-navy font-number uppercase">٥,٢٠٠ ج.م</span>
                        </button>
                        <button className="flex flex-col items-center p-3 rounded-2xl bg-white border border-gray-100 hover:border-primary/50 transition-all shadow-sm">
                            <span className="text-xs font-black text-gray-400 mb-1">عدد الطلبات</span>
                            <span className="text-sm font-black text-navy font-number">٨</span>
                        </button>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">معلومات الاتصال</h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm font-bold text-navy">
                                <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                    <Phone className="h-4 w-4" />
                                </div>
                                <span className="font-number tracking-wider font-bold">0123456789</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm font-bold text-navy">
                                <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <span>a.saber@example.com</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm font-bold text-navy">
                                <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                    <MapPin className="h-4 w-4" />
                                </div>
                                <span>القاهرة، مصر</span>
                            </div>
                        </div>
                    </div>

                    {/* Internal Notes */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">ملاحظات داخلية</h4>
                            <button className="text-primary hover:bg-primary/5 p-1 rounded transition-all">
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 space-y-2">
                            <div className="flex items-center gap-2 text-amber-700">
                                <StickyNote className="h-4 w-4" />
                                <span className="text-[10px] font-black">ملاحظة مهمة</span>
                            </div>
                            <p className="text-xs font-bold text-amber-800 leading-relaxed">
                                العميل يفضل التواصل عبر واتساب فقط ويحب خدمة التوصيل السريع.
                            </p>
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">آخر الطلبات</h4>
                        <div className="space-y-3">
                            {[1, 2].map((i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 bg-white shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                                            <ShoppingBag className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-navy uppercase tracking-tight">طلب #102{i}</p>
                                            <p className="text-[10px] text-gray-400 font-bold font-number">٢٤ يناير ٢٠٢٤</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black text-navy font-number uppercase">٨٥٠ ج.م</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
