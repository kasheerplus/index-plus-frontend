'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Save, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuickReply {
    id: string;
    shortcut: string;
    content: string;
}

interface QuickReplyManagerProps {
    replies: QuickReply[];
    onUpdate: () => void;
}

export function QuickReplyManager({ replies, onUpdate }: QuickReplyManagerProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newShortcut, setNewShortcut] = useState('');
    const [newContent, setNewContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAdd = async () => {
        if (!newShortcut || !newContent) return;
        setIsLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        const cid = user?.app_metadata?.company_id || user?.user_metadata?.company_id;

        const { error } = await supabase.from('quick_replies').insert([{
            shortcut: newShortcut,
            content: newContent,
            company_id: cid
        }]);

        if (error) {
            toast.error('فشل إضافة الرد السريع');
        } else {
            toast.success('تمت الإضافة بنجاح');
            setNewShortcut('');
            setNewContent('');
            setIsAdding(false);
            onUpdate();
        }
        setIsLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من مسح هذا الرد؟')) return;

        const { error } = await supabase.from('quick_replies').delete().eq('id', id);

        if (error) {
            toast.error('فشل الحذف');
        } else {
            toast.success('تم الحذف');
            onUpdate();
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-brand-blue">الردود المحفوظة ({replies.length})</h4>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full hover:bg-brand-green/10 text-brand-green border border-brand-green/20"
                    onClick={() => setIsAdding(!isAdding)}
                >
                    {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </Button>
            </div>

            {isAdding && (
                <div className="p-3 bg-brand-off-white rounded-xl border border-brand-beige space-y-3 animate-in slide-in-from-top-2">
                    <Input
                        placeholder="الاختصار (مثال: /ترحيب)"
                        className="h-9 bg-white text-xs font-bold"
                        value={newShortcut}
                        onChange={(e) => setNewShortcut(e.target.value)}
                    />
                    <Textarea
                        placeholder="نص الرسالة..."
                        className="min-h-[80px] bg-white text-xs resize-none"
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                    />
                    <Button
                        size="sm"
                        className="w-full h-8 bg-brand-green hover:bg-brand-green-alt text-white font-black text-xs gap-2"
                        onClick={handleAdd}
                        disabled={isLoading || !newShortcut || !newContent}
                    >
                        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        حفظ الرد
                    </Button>
                </div>
            )}

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {replies.map(reply => (
                    <div key={reply.id} className="group flex items-start justify-between p-3 bg-white border border-brand-beige rounded-xl hover:shadow-md transition-all">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-brand-green mb-1">{reply.shortcut}</p>
                            <p className="text-[10px] text-brand-blue-alt line-clamp-2 leading-relaxed">{reply.content}</p>
                        </div>
                        <button
                            onClick={() => handleDelete(reply.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
