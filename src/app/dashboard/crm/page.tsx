'use client';

import { CustomerTable } from '@/components/crm/customer-table';

export default function CRMPage() {
    return (
        <div className="p-8 space-y-8 bg-brand-off-white min-h-full font-cairo">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-brand-blue mb-2">العملاء</h1>
                    <nav className="flex items-center gap-2 text-sm font-bold">
                        <span className="text-brand-blue-alt/60">الرئيسية</span>
                        <span className="text-brand-beige">/</span>
                        <span className="text-brand-green">إدارة العملاء</span>
                    </nav>
                </div>
            </div>

            <CustomerTable />
        </div>
    );
}
