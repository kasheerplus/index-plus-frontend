'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

interface Conversation {
    id: string;
    channel_id: string;
    source: 'whatsapp' | 'facebook' | 'instagram' | 'tiktok';
    status: 'open' | 'pending' | 'closed';
    last_message_at: string;
    unread_count: number;
    customers: {
        id: string;
        name: string;
    };
    messages?: Array<{
        content: string;
    }>;
}

interface ConversationListProps {
    selectedId: string | null;
    onSelect: (id: string) => void;
    initialSearch?: string;
}

export function ConversationList({ selectedId, onSelect, initialSearch = '' }: ConversationListProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('open');
    const [search, setSearch] = useState(initialSearch);
    const [sourceFilter, setSourceFilter] = useState<string | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        if (initialSearch) {
            setSearch(initialSearch);
        }
    }, [initialSearch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchConversations();
        }, 300); // Debounce
        return () => clearTimeout(timer);
    }, [filter, search, sourceFilter]);

    const fetchConversations = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('conversations')
                .select(`
                    id,
                    channel_id,
                    source,
                    status,
                    last_message_at,
                    unread_count,
                    customers (id, name),
                    messages (content)
                `)
                .eq('status', filter)
                .order('last_message_at', { ascending: false });

            if (sourceFilter) {
                query = query.eq('source', sourceFilter);
            }

            // If search is present, perform a 2-step search for better safety
            if (search && search.length > 1) {
                // 1. Find matching customers
                const { data: matchingCustomers } = await supabase
                    .from('customers')
                    .select('id')
                    .ilike('name', `%${search}%`)
                    .limit(50);

                const customerIds = matchingCustomers?.map(c => c.id) || [];

                if (customerIds.length > 0) {
                    query = query.in('customer_id', customerIds);
                } else {
                    // If no customers match, ensure we return no results (or you could implement message search here)
                    // For now, avoiding the crash is priority. 
                    // To force strict match:
                    query = query.eq('id', '00000000-0000-0000-0000-000000000000');
                }
            }

            const { data, error } = await query;
            if (error) {
                console.error('Supabase fetch error:', error);
                throw error;
            }

            const normalizedData = (data as any[] || []).map(item => {
                // Handle case where customers might be an array or object
                const customerData = Array.isArray(item.customers)
                    ? item.customers[0]
                    : item.customers;

                return {
                    ...item,
                    customers: customerData || { id: 'unknown', name: 'Unknown Customer' }
                };
            });

            setConversations(normalizedData as Conversation[]);
        } catch (err: any) {
            console.error('Error fetching conversations:', err.message || err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredConversations = conversations; // Server-side handles it mostly now

    return (
        <div className="flex flex-col h-full font-cairo">
            {/* Header & Search */}
            <div className="p-6 space-y-5 bg-white border-b-2 border-brand-beige">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-brand-blue tracking-tight">المحادثات</h2>
                    <div className="relative">
                        <Button
                            variant="ghost"
                            className={cn(
                                "p-2.5 h-auto rounded-xl transition-all",
                                sourceFilter ? "text-brand-green bg-brand-green/10" : "text-brand-blue-alt/40 hover:text-brand-green hover:bg-brand-green/5"
                            )}
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            <Filter className="h-5 w-5" />
                        </Button>

                        {isFilterOpen && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-brand-beige z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-2 space-y-1">
                                    <button
                                        onClick={() => { setSourceFilter(null); setIsFilterOpen(false); }}
                                        className={cn("w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-colors", !sourceFilter ? "bg-brand-green/10 text-brand-green" : "text-brand-blue hover:bg-brand-off-white")}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-current" />
                                        الكل
                                    </button>
                                    <button
                                        onClick={() => { setSourceFilter('whatsapp'); setIsFilterOpen(false); }}
                                        className={cn("w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-colors", sourceFilter === 'whatsapp' ? "bg-green-50 text-green-600" : "text-brand-blue hover:bg-brand-off-white")}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        واتساب
                                    </button>
                                    <button
                                        onClick={() => { setSourceFilter('facebook'); setIsFilterOpen(false); }}
                                        className={cn("w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-colors", sourceFilter === 'facebook' ? "bg-blue-50 text-blue-600" : "text-brand-blue hover:bg-brand-off-white")}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                                        فيسبوك
                                    </button>
                                    <button
                                        onClick={() => { setSourceFilter('instagram'); setIsFilterOpen(false); }}
                                        className={cn("w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-colors", sourceFilter === 'instagram' ? "bg-pink-50 text-pink-600" : "text-brand-blue hover:bg-brand-off-white")}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-pink-500" />
                                        إنستجرام
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative group">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue-alt/40 group-focus-within:text-brand-green transition-colors" />
                    <input
                        type="text"
                        placeholder="بحث عن اسم أو رسالة..."
                        className="w-full bg-brand-off-white border-2 border-brand-beige focus:border-brand-green/30 focus:bg-white rounded-[20px] py-3 pr-11 pl-4 text-sm font-bold transition-all outline-none shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Filter Tabs - Exact Kasheer Plus Style */}
            <div className="flex p-1.5 bg-brand-beige/30 mx-4 my-4 rounded-2xl gap-1">
                {['open', 'pending', 'closed'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={cn(
                            'flex-1 py-2.5 text-xs font-black rounded-xl transition-all capitalize',
                            filter === t
                                ? 'bg-white text-brand-green shadow-lg shadow-brand-green/5 ring-1 ring-brand-beige'
                                : 'text-brand-blue-alt/50 hover:bg-white/50 hover:text-brand-blue'
                        )}
                    >
                        {t === 'open' ? 'نشطة' : t === 'pending' ? 'معلقة' : 'مغلقة'}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <p className="text-xs font-bold text-gray-400">تحميل المحادثات...</p>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-50 px-4">
                        <MessageSquare className="h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-xs font-bold text-gray-400">لا توجد محادثات {filter === 'open' ? 'نشطة' : 'في هذا القسم'}</p>
                    </div>
                ) : (
                    filteredConversations.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => onSelect(conv.id)}
                            className={cn(
                                'w-full p-5 flex gap-4 border-b border-brand-beige/50 transition-all text-right relative group',
                                selectedId === conv.id ? 'bg-white shadow-[inset_0_0_20px_rgba(0,0,0,0.02)]' : 'hover:bg-white/60'
                            )}
                        >
                            {selectedId === conv.id && (
                                <div className="absolute right-0 top-3 bottom-3 w-1.5 bg-brand-green rounded-l-full shadow-[2px_0_10px_rgba(17,118,58,0.3)]" />
                            )}

                            <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-off-white to-white flex-shrink-0 flex items-center justify-center font-black text-brand-blue border-2 border-brand-beige uppercase shadow-sm group-hover:shadow-md transition-shadow">
                                {conv.customers?.name?.[0] || '?'}
                                <div className={cn(
                                    "absolute -bottom-1 -left-1 h-6 w-6 rounded-full border-2 border-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform",
                                    conv.source === 'whatsapp' ? 'bg-green-500' :
                                        conv.source === 'facebook' ? 'bg-blue-600' :
                                            conv.source === 'instagram' ? 'bg-pink-500' : 'bg-brand-blue'
                                )}>
                                    <span className="text-[9px] text-white font-black">
                                        {conv.source[0].toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <span className={cn(
                                        "font-black truncate text-[15px] transition-colors",
                                        selectedId === conv.id ? "text-brand-green" : "text-brand-blue"
                                    )}>
                                        {conv.customers?.name || 'عميل مجهول'}
                                    </span>
                                    <span className="text-[10px] text-brand-blue-alt/50 font-number font-black bg-brand-beige/20 px-2 py-0.5 rounded-full">
                                        {new Date(conv.last_message_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-baseline gap-2">
                                    <p className={cn(
                                        "text-xs truncate font-bold leading-tight",
                                        conv.unread_count > 0 ? "text-brand-blue font-black" : "text-brand-blue-alt/60"
                                    )}>
                                        {conv.messages?.[0]?.content || 'لا يوجد رسائل بعد'}
                                    </p>
                                    {conv.unread_count > 0 && (
                                        <span className="bg-brand-green text-white text-[10px] font-black h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center font-number shadow-lg shadow-brand-green/20 animate-pulse">
                                            {conv.unread_count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
