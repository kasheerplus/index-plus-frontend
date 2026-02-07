'use client';

import { useState, useEffect, Suspense } from 'react';
import { ConversationList } from '@/components/inbox/conversation-list';
import { ChatArea } from '@/components/inbox/chat-area';
import { useSearchParams } from 'next/navigation';

function InboxContent() {
    const searchParams = useSearchParams();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [initialSearch, setInitialSearch] = useState('');

    useEffect(() => {
        const customerName = searchParams.get('customer');
        if (customerName) {
            setInitialSearch(customerName);
        }
    }, [searchParams]);

    return (
        <div className="flex h-[calc(100vh-144px)] sm:h-[calc(100vh-160px)] bg-white overflow-hidden -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 animate-fade-in shadow-inner relative z-10">
            {/* List Area */}
            <div className="w-80 sm:w-96 border-l-2 border-brand-beige flex flex-col h-full bg-brand-off-white shadow-[10px_0_30px_rgba(0,0,0,0.02)] z-10">
                <ConversationList
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    initialSearch={initialSearch}
                />
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col h-full bg-white relative">
                {selectedId ? (
                    <ChatArea
                        conversationId={selectedId}
                        onClose={() => setSelectedId(null)}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6 bg-brand-off-white/30">
                        <div className="h-40 w-40 rounded-full bg-white flex items-center justify-center border-2 border-brand-beige shadow-xl animate-bounce-slow">
                            <span className="text-7xl">📬</span>
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-brand-blue mb-4">ابدأ محادثة جديدة</h2>
                            <p className="text-brand-blue-alt font-bold max-w-sm mx-auto leading-relaxed text-lg">
                                اختر محادثة من القائمة الجانبية لعرض الرسائل والبدء في المراسلة الفورية مع عملائك بشكل مباشر.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function InboxPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-full">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-blue border-t-transparent"></div>
            </div>
        }>
            <InboxContent />
        </Suspense>
    );
}
