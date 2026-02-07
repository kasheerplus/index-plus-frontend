'use client';

import { useState, useEffect } from 'react';
import { Search, UserPlus, Filter, Tag, MessageSquare, Loader2, Users, Receipt, MapPin, X, Check, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { AddCustomerModal } from './add-customer-modal';
import { InvoiceModal } from './invoice-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { TagEditorModal } from './tag-editor-modal';

interface Customer {
    id: string;
    name: string;
    phone: string;
    email: string;
    tags: string[];
    address?: string;
    notes?: string;
    created_at: string;
    conversations?: { source: string; status: string }[];
    sales_records?: any[];
}

export function CustomerTable() {
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<{ sale: any, customer: Customer } | null>(null);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);


    useEffect(() => {
        fetchCustomers();
    }, [page, searchQuery, selectedTag]); // Refetch on page/filter change

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            // Calculate range
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from('customers')
                .select('*, conversations(source, status), sales_records(id, amount, items, created_at, status)', { count: 'exact' })
                .order('created_at', { ascending: false });

            // Apply Filters if any
            if (searchQuery) {
                query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
            }

            if (selectedTag) {
                // Determine logic for tag filtering if needed on server side
                // Since tags is an array, we use contains
                query = query.contains('tags', [selectedTag]);
            }

            const { data, error, count } = await query.range(from, to);

            if (error) throw error;

            setCustomers(data || []);
            setTotalCount(count || 0);

        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteCustomer = async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء.')) return;

        try {
            const { error } = await supabase.from('customers').delete().eq('id', id);
            if (error) throw error;
            toast.success('تم حذف العميل بنجاح');
            fetchCustomers();
        } catch (err: any) {
            toast.error('حدث خطأ أثناء الحذف: ' + err.message);
        }
    };

    const allTags = Array.from(new Set(customers.flatMap(c => c.tags || [])));
    // Note: allTags might be incomplete with pagination, ideally fetch distinct tags from DB.
    // implementing client-side derived tags from current page for now. 

    return (
        <>
            {showAddModal && (
                <AddCustomerModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => fetchCustomers()}
                    customerToEdit={editingCustomer}
                />
            )}

            {selectedCustomer && (
                <TagEditorModal
                    customer={selectedCustomer}
                    onClose={() => setSelectedCustomer(null)}
                    onSuccess={() => fetchCustomers()}
                />
            )}

            {selectedInvoice && (
                <InvoiceModal
                    sale={selectedInvoice.sale}
                    customer={selectedInvoice.customer}
                    onClose={() => setSelectedInvoice(null)}
                />
            )}

            <div className="bg-white rounded-[32px] border-2 border-brand-beige shadow-sm overflow-hidden font-cairo">
                <div className="p-6 border-b-2 border-brand-beige flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-brand-blue">قائمة العملاء</h2>
                        <p className="text-sm text-brand-blue-alt/60 font-bold">إدارة بيانات العملاء والبحث عنهم بسهولة</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 relative">
                            <Button
                                variant="outline"
                                className={cn(
                                    "h-10 text-xs gap-2 border-brand-beige text-brand-blue-alt font-black hover:bg-brand-off-white",
                                    selectedTag && "bg-brand-green/10 text-brand-green border-brand-green/30"
                                )}
                                onClick={() => setShowFilterMenu(!showFilterMenu)}
                            >
                                <Filter className="h-4 w-4" />
                                {selectedTag ? `تصنيف: ${selectedTag}` : 'تصفية'}
                                {selectedTag && <span onClick={(e) => { e.stopPropagation(); setSelectedTag(null); }} className="hover:bg-red-100 rounded-full p-0.5"><X className="h-3 w-3 text-red-500" /></span>}
                            </Button>

                            {showFilterMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)} />
                                    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-brand-beige overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="p-2 border-b border-brand-beige bg-brand-off-white/30">
                                            <p className="text-[10px] font-black text-brand-blue-alt/50 uppercase px-2">تصفية حسب الوسوم</p>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto p-1">
                                            <button
                                                onClick={() => { setSelectedTag(null); setShowFilterMenu(false); }}
                                                className={cn(
                                                    "w-full text-right px-3 py-2 text-xs font-bold rounded-lg mb-1",
                                                    !selectedTag ? "bg-brand-green/10 text-brand-green" : "text-brand-blue hover:bg-brand-off-white"
                                                )}
                                            >
                                                الكل
                                            </button>
                                            {allTags.map(tag => (
                                                <button
                                                    key={tag}
                                                    onClick={() => { setSelectedTag(tag); setShowFilterMenu(false); }}
                                                    className={cn(
                                                        "w-full text-right px-3 py-2 text-xs font-bold rounded-lg mb-1 flex items-center justify-between",
                                                        selectedTag === tag ? "bg-brand-green/10 text-brand-green" : "text-brand-blue hover:bg-brand-off-white"
                                                    )}
                                                >
                                                    {tag}
                                                    {selectedTag === tag && <Check className="h-3 w-3" />}
                                                </button>
                                            ))}
                                            {allTags.length === 0 && (
                                                <p className="text-[10px] text-center py-4 text-brand-blue-alt/40 font-bold">لا توجد وسوم متاحة</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                            <Button
                                className="h-10 text-xs gap-2 font-black shadow-lg shadow-brand-green/20 bg-brand-green hover:bg-brand-green-alt"
                                onClick={() => { setEditingCustomer(null); setShowAddModal(true); }}
                            >
                                <UserPlus className="h-4 w-4" />
                                إضافة عميل
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-brand-off-white/30 border-b border-brand-beige">
                    <div className="relative max-w-md">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue-alt/50" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="بحث عن عميل بالاسم أو الهاتف..."
                            className="w-full bg-white border-2 border-brand-beige rounded-xl py-2.5 pr-10 pl-4 text-sm font-bold focus:border-brand-green/30 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    {isLoading ? (
                        <div className="space-y-4 p-6">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-[200px]" />
                                        <Skeleton className="h-3 w-[150px]" />
                                    </div>
                                    <Skeleton className="h-8 w-24" />
                                </div>
                            ))}
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                            <div className="h-20 w-20 bg-brand-off-white rounded-full flex items-center justify-center border-2 border-brand-beige">
                                <Users className="h-10 w-10 text-brand-blue/10" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-brand-blue">لا توجد نتائج</h3>
                                <p className="text-sm text-brand-blue-alt/60 font-bold">لم نجد أي عملاء يطابقون بحثك</p>
                            </div>
                        </div>
                    ) : (
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-brand-off-white/50 text-brand-blue-alt text-[11px] font-black uppercase tracking-widest border-b border-brand-beige">
                                    <th className="px-6 py-5">الاسم</th>
                                    <th className="px-6 py-5">العنوان</th>
                                    <th className="px-6 py-5">البريد الإلكتروني</th>
                                    <th className="px-6 py-5">الهاتف</th>
                                    <th className="px-6 py-5">التصنيفات (Tags)</th>
                                    <th className="px-6 py-5 text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-beige">
                                {customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-brand-off-white/30 transition-all group">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-brand-green/10 flex items-center justify-center font-black text-brand-green text-xs border border-brand-green/20 uppercase">
                                                    {customer.name[0]}
                                                </div>
                                                <div className="flex items-center justify-center h-full">
                                                    <p className="text-sm font-black text-brand-blue">{customer.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right">
                                            {customer.address ? (
                                                <span className="flex items-center gap-1.5 text-xs font-bold text-brand-blue-alt group-hover:text-brand-blue transition-colors max-w-[150px] truncate">
                                                    <MapPin className="h-3.5 w-3.5 text-brand-blue-alt/30 flex-shrink-0" />
                                                    {customer.address}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-brand-blue-alt/30 font-bold italic">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-brand-blue-alt">
                                            {customer.email || '-'}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-brand-blue-alt font-number font-black">
                                            {customer.phone}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                {customer.tags?.length > 0 ? customer.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-brand-off-white text-brand-blue-alt border border-brand-beige shadow-sm"
                                                    >
                                                        {tag}
                                                    </span>
                                                )) : (
                                                    <span className="text-[10px] text-brand-blue-alt/30 italic font-bold">بدون تصنيف</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-2 relative">
                                                {/* Invoice Button */}
                                                {customer.sales_records && customer.sales_records.length > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        className="p-2 h-auto text-brand-blue-alt/50 hover:text-amber-600 hover:bg-amber-50"
                                                        onClick={() => setSelectedInvoice({ sale: customer.sales_records![0], customer })} // Show latest invoice
                                                        title="عرض آخر فاتورة"
                                                    >
                                                        <Receipt className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                {/* Contact Button Logic */}
                                                {(() => {
                                                    const channels = Array.from(new Set(customer.conversations?.map(c => c.source) || []));
                                                    // Always allow WhatsApp via phone if available
                                                    if (customer.phone && !channels.includes('whatsapp')) channels.push('whatsapp');

                                                    if (channels.length > 1) {
                                                        return (
                                                            <div className="relative group/menu">
                                                                <Button
                                                                    variant="ghost"
                                                                    className="p-2 h-auto text-brand-green bg-brand-green/5 hover:bg-brand-green hover:text-white"
                                                                    title="تواصل مع العميل"
                                                                >
                                                                    <MessageSquare className="h-4 w-4" />
                                                                </Button>
                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 bg-white rounded-xl shadow-xl border border-brand-beige overflow-hidden hidden group-hover/menu:block z-50 animate-in fade-in zoom-in-95 duration-200">
                                                                    {channels.map(source => (
                                                                        <button
                                                                            key={source}
                                                                            onClick={() => router.push(`/dashboard/inbox?customer=${encodeURIComponent(customer.name)}&source=${source}`)}
                                                                            className="w-full text-right px-4 py-3 text-xs font-bold text-brand-blue hover:bg-brand-off-white flex items-center gap-2"
                                                                        >
                                                                            <span className={cn(
                                                                                "h-2 w-2 rounded-full",
                                                                                source === 'whatsapp' ? 'bg-green-500' :
                                                                                    source === 'facebook' ? 'bg-blue-600' :
                                                                                        source === 'instagram' ? 'bg-pink-500' : 'bg-gray-400'
                                                                            )} />
                                                                            {source === 'whatsapp' ? 'واتساب' :
                                                                                source === 'facebook' ? 'فيسبوك' :
                                                                                    source === 'instagram' ? 'إنستجرام' : source}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    } else {
                                                        return (
                                                            <Button
                                                                variant="ghost"
                                                                className="p-2 h-auto text-brand-blue-alt/50 hover:text-brand-green hover:bg-brand-green/5"
                                                                onClick={() => router.push(`/dashboard/inbox?customer=${encodeURIComponent(customer.name)}&source=whatsapp`)}
                                                                title="إرسال عبر واتساب"
                                                            >
                                                                <MessageSquare className="h-4 w-4" />
                                                            </Button>
                                                        );
                                                    }
                                                })()}

                                                <Button
                                                    variant="ghost"
                                                    className="p-2 h-auto text-brand-blue-alt/50 hover:text-brand-blue hover:bg-brand-blue/5"
                                                    onClick={() => { setEditingCustomer(customer); setShowAddModal(true); }}
                                                    title="تعديل البيانات"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    className="p-2 h-auto text-brand-blue-alt/50 hover:text-brand-blue hover:bg-brand-blue/5"
                                                    onClick={() => setSelectedCustomer(customer)}
                                                    title="تعديل الوسوم"
                                                >
                                                    <Tag className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    className="p-2 h-auto text-brand-blue-alt/50 hover:text-red-500 hover:bg-red-50"
                                                    onClick={() => deleteCustomer(customer.id)}
                                                    title="حذف العميل"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Footer */}
                {totalCount > 0 && (
                    <div className="p-4 border-t-2 border-brand-beige bg-brand-off-white/30 flex items-center justify-between">
                        <div className="text-xs font-bold text-brand-blue-alt">
                            عرض {(page - 1) * pageSize + 1} إلى {Math.min(page * pageSize, totalCount)} من أصل {totalCount} عميل
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <span className="text-xs font-black text-brand-blue min-w-[20px] text-center">{page}</span>
                            <Button
                                variant="outline"
                                disabled={page >= Math.ceil(totalCount / pageSize)}
                                onClick={() => setPage(p => p + 1)}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
