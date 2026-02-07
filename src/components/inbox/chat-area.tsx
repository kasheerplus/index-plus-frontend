'use client';

import { useState, useEffect } from 'react';
import { Send, Phone, MoreVertical, Paperclip, Smile, ShoppingCart, Loader2, MessageSquare, Image as ImageIcon, X, Settings, Search, UserCog, CheckCircle2, ChevronRight, Tag, Book, User, Plus, StickyNote, Mail, PhoneCall, Facebook, Instagram, MessageCircle } from 'lucide-react';
import { SettingsHeader } from '@/components/settings/settings-header';
import { useNotifications } from '../providers/notification-provider';
import { usePermissions } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { CreateSaleModal } from './create-sale-modal';
import { ImageLightbox, AudioPlayer } from './media-utils';
import { QuickReplyManager } from './quick-reply-manager';
import { EmojiPicker } from './emoji-picker';
import { useKasheerConnection } from '@/hooks/use-kasheer-connection';
import toast from 'react-hot-toast';
import { useRef } from 'react';

interface ChatAreaProps {
    conversationId: string;
    onClose?: () => void;
}

interface Message {
    id: string;
    content: string;
    sender_type: 'customer' | 'agent';
    created_at: string;
    metadata?: {
        attachments?: Array<{
            type: string;
            url: string;
            name: string;
        }>;
    };
}

interface ConversationDetails {
    source: string;
    status?: string;
    customers: {
        id?: string;
        name: string;
        phone?: string;
        email?: string;
        address?: string;
        tags?: string[];
        notes?: string;
    };
}

export function ChatArea({ conversationId, onClose }: ChatAreaProps) {
    const { can } = usePermissions();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [details, setDetails] = useState<ConversationDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showSaleModal, setShowSaleModal] = useState(false);
    const [previewImage, setPreviewImage] = useState<{ src: string, alt: string } | null>(null);
    const [sidebarView, setSidebarView] = useState<'replies' | 'profile' | 'notes' | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [customerTags, setCustomerTags] = useState<string[]>([]);
    const [internalNote, setInternalNote] = useState('');
    const [newTag, setNewTag] = useState('');
    const [quickReplies, setQuickReplies] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<Array<{ type: string; url: string; name: string }>>([]);
    const [isUploading, setIsUploading] = useState(false);
    const { isConnected: isKasheerConnected } = useKasheerConnection();

    useEffect(() => {
        if (conversationId) {
            fetchConversationDetails();
            fetchMessages();
            fetchQuickReplies();
        }
    }, [conversationId]);

    const fetchConversationDetails = async () => {
        const { data, error } = await supabase
            .from('conversations')
            .select(`source, status, customers (*)`)
            .eq('id', conversationId)
            .single();

        if (!error && data) {
            // Normalize customers to object if array
            const customers = Array.isArray(data.customers) ? data.customers[0] : data.customers;
            setDetails({ ...data, customers } as ConversationDetails);

            if (customers) {
                setCustomerTags((customers as any).tags || []);
                setInternalNote((customers as any).notes || '');
            }
        }
    };

    const updateCustomerMeta = async (updates: { tags?: string[], notes?: string, address?: string }) => {
        if (!details?.customers) return;
        const customerId = (details.customers as any).id;
        if (!customerId) return;

        const { error } = await supabase
            .from('customers')
            .update(updates)
            .eq('id', customerId);

        if (!error) {
            toast.success('تم تحديث البيانات بنجاح');
        } else {
            toast.error('حدث خطأ أثناء التحديث');
        }
    };

    const addTag = () => {
        if (!newTag.trim()) return;
        if (customerTags.includes(newTag.trim())) {
            toast.error('الوسم موجود بالفعل');
            return;
        }
        const updatedTags = [...customerTags, newTag.trim()];
        setCustomerTags(updatedTags);
        updateCustomerMeta({ tags: updatedTags });
        setNewTag('');
    };

    const removeTag = (tagToRemove: string) => {
        const updatedTags = customerTags.filter(t => t !== tagToRemove);
        setCustomerTags(updatedTags);
        updateCustomerMeta({ tags: updatedTags });
    };

    const saveInternalNote = () => {
        updateCustomerMeta({ notes: internalNote });
    };

    const fetchMessages = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (!error) setMessages(data || []);
        setIsLoading(false);
    };

    const fetchQuickReplies = async () => {
        const { data, error } = await supabase
            .from('quick_replies')
            .select('*');
        if (!error) setQuickReplies(data || []);
    };

    const closeConversation = async () => {
        if (!confirm('هل أنت متأكد من إغلاق هذه المحادثة؟ سيتم نقلها للأرشيف.')) return;

        const { error } = await supabase
            .from('conversations')
            .update({ status: 'closed' })
            .eq('id', conversationId);

        if (!error) {
            toast.success('تم إغلاق المحادثة ونقلها للأرشيف 📪');
            if (onClose) onClose();
        } else {
            toast.error('فشل إغلاق المحادثة');
        }
    };

    const markAsPending = async () => {
        const { error } = await supabase
            .from('conversations')
            .update({ status: 'pending' })
            .eq('id', conversationId);

        if (!error) {
            toast.success('تم تحويل المحادثة إلى "معلقة" ⏳');
            if (onClose) onClose();
        } else {
            toast.error('فشل تحديث الحالة');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const uploadedFilesList: Array<{ type: string; url: string; name: string }> = [];

        try {
            for (const file of Array.from(files)) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `chat-attachments/${fileName}`;

                const { data, error } = await supabase.storage
                    .from('attachments')
                    .upload(filePath, file);

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('attachments')
                    .getPublicUrl(filePath);

                uploadedFilesList.push({
                    type: file.type.startsWith('image/') ? 'image' : 'file',
                    url: publicUrl,
                    name: file.name
                });
            }

            setUploadedFiles([...uploadedFiles, ...uploadedFilesList]);
            toast.success(`تم رفع ${uploadedFilesList.length} ملف بنجاح! 📎`);
        } catch (err: any) {
            console.error(err);
            toast.error('فشل رفع الملف. تأكد من إعدادات Storage في Supabase');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeUploadedFile = (index: number) => {
        setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
    };

    const sendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!message.trim() && uploadedFiles.length === 0) return;

        const newMessage = message;
        const attachments = uploadedFiles;
        setMessage('');
        setUploadedFiles([]);

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_type: 'agent',
                    content: newMessage || '📎 مرفقات',
                    metadata: attachments.length > 0 ? { attachments } : null
                })
                .select()
                .single();

            if (!error) {
                setMessages([...messages, data]);
                toast.success('تم إرسال الرسالة! ✅');
            }
        } catch (err) {
            console.error(err);
            toast.error('فشل إرسال الرسالة');
        }
    };

    const useQuickReply = (content: string) => {
        setMessage(content);
    };

    return (
        <div className="flex flex-col h-full bg-white font-cairo">
            {/* Header */}
            <header className="h-20 border-b-2 border-brand-beige flex items-center justify-between px-8 bg-white/90 backdrop-blur-md z-10 sticky top-0 shadow-sm">
                <div
                    className="flex items-center gap-4 cursor-pointer group/header hover:bg-brand-off-white/50 p-2 -ml-2 rounded-2xl transition-all"
                    onClick={() => setSidebarView(sidebarView === 'profile' ? null : 'profile')}
                >
                    <div>
                        <h3 className="font-black text-brand-blue text-[15px] flex items-center gap-2">
                            {details?.customers?.name || 'تحميل...'}
                            <ChevronRight className={cn("h-4 w-4 text-brand-blue-alt/20 transition-transform", sidebarView === 'profile' && "rotate-90 text-brand-green")} />
                        </h3>
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all duration-500",
                                details?.status === 'open'
                                    ? "bg-green-50 border-green-100 text-green-600"
                                    : "bg-gray-50 border-gray-100 text-gray-400"
                            )}>
                                {details?.source === 'whatsapp' && <MessageCircle className="h-3.5 w-3.5" />}
                                {details?.source === 'facebook' && <Facebook className="h-3.5 w-3.5" />}
                                {details?.source === 'instagram' && <Instagram className="h-3.5 w-3.5" />}
                                {details?.source === 'tiktok' && <MessageSquare className="h-3.5 w-3.5" />}

                                <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                                <span className="text-[10px] font-black uppercase">
                                    {details?.status === 'open' ? 'نشط الآن' : 'غير متصل'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        className="h-10 px-4 text-xs gap-2 font-black border border-brand-beige text-brand-blue-alt/60 hover:border-yellow-200 hover:bg-yellow-50 hover:text-yellow-600 rounded-xl transition-all"
                        onClick={markAsPending}
                    >
                        <Loader2 className="h-4 w-4" />
                        تعليق
                    </Button>
                    <Button
                        variant="ghost"
                        className="h-10 px-5 text-xs gap-2 font-black border-2 border-red-100 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                        onClick={closeConversation}
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        إغلاق المحادثة
                    </Button>

                    {/* Sale Button - Only show if Kasheer Plus is connected */}
                    {isKasheerConnected && (
                        <>
                            <div className="h-8 w-[2px] bg-brand-beige mx-1" />

                            <Button
                                variant="outline"
                                className="h-10 px-5 text-xs gap-2 font-black border-2 border-brand-green/20 text-brand-green hover:bg-brand-green hover:text-white rounded-xl transition-all shadow-sm hover:shadow-brand-green/20"
                                onClick={() => setShowSaleModal(true)}
                            >
                                <ShoppingCart className="h-4 w-4" />
                                إتمام عملية بيع
                            </Button>
                        </>
                    )}

                    <div className="h-8 w-[2px] bg-brand-beige mx-1" />

                    <Button
                        variant="ghost"
                        className={cn(
                            "p-2.5 h-auto rounded-xl transition-all",
                            sidebarView === 'replies' ? "text-brand-green bg-brand-green/10 shadow-inner" : "text-brand-blue-alt/40 hover:text-brand-blue hover:bg-brand-off-white"
                        )}
                        onClick={() => setSidebarView(sidebarView === 'replies' ? null : 'replies')}
                        title="الردود المحفوظة"
                    >
                        <MessageSquare className="h-5 w-5" />
                    </Button>

                    <Button
                        variant="ghost"
                        className={cn(
                            "p-2.5 h-auto rounded-xl transition-all",
                            sidebarView === 'notes' ? "text-brand-blue bg-brand-blue/10 shadow-inner" : "text-brand-blue-alt/40 hover:text-brand-blue hover:bg-brand-off-white"
                        )}
                        onClick={() => setSidebarView(sidebarView === 'notes' ? null : 'notes')}
                        title="الملاحظات الداخلية"
                    >
                        <StickyNote className="h-5 w-5" />
                    </Button>

                    <Button
                        variant="ghost"
                        className="p-2.5 h-auto text-brand-blue-alt/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        onClick={onClose}
                        title="إغلاق العرض"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            {showSaleModal && (
                <CreateSaleModal
                    customerName={details?.customers?.name || ''}
                    customerId={details?.customers?.id}
                    conversationId={conversationId}
                    onClose={() => setShowSaleModal(false)}
                />
            )}

            {previewImage && (
                <ImageLightbox
                    src={previewImage.src}
                    alt={previewImage.alt}
                    onClose={() => setPreviewImage(null)}
                />
            )}

            {/* Main Area with Sidebar Toggle */}
            <div className="flex-1 flex overflow-hidden bg-brand-off-white/40">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Loader2 className="h-10 w-10 text-brand-green animate-spin" />
                            <span className="text-sm font-bold text-brand-blue-alt/50">جاري تحميل المحادثة...</span>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-30 text-center space-y-4">
                            <div className="h-24 w-24 rounded-full bg-brand-beige/20 flex items-center justify-center">
                                <MessageSquare className="h-12 w-12 text-brand-blue" />
                            </div>
                            <p className="text-sm font-black text-brand-blue">لا توجد رسائل بعد في هذه المحادثة</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex w-full animate-fade-in origin-bottom",
                                    msg.sender_type === 'agent' ? "justify-start" : "justify-end"
                                )}
                            >
                                <div className={cn(
                                    "max-w-[85%] sm:max-w-[70%] p-5 rounded-[24px] text-sm shadow-xl relative transition-all hover:shadow-2xl",
                                    msg.sender_type === 'agent'
                                        ? "bg-gradient-to-br from-brand-blue to-brand-blue-alt text-white rounded-tr-none origin-right"
                                        : "bg-white text-brand-blue rounded-tl-none border-2 border-brand-beige origin-left shadow-brand-beige/20"
                                )}>
                                    {/* Attachments */}
                                    {msg.metadata?.attachments && msg.metadata.attachments.length > 0 && (
                                        <div className="mb-4 space-y-3">
                                            {msg.metadata.attachments.map((attachment, idx) => (
                                                <div key={idx} className="rounded-xl overflow-hidden border border-white/10">
                                                    {attachment.type === 'image' || attachment.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                        <div
                                                            className="cursor-pointer group relative overflow-hidden"
                                                            onClick={() => setPreviewImage({ src: attachment.url, alt: attachment.name })}
                                                        >
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
                                                                <ImageIcon className="h-8 w-8 text-white drop-shadow-lg" />
                                                            </div>
                                                            <img
                                                                src={attachment.url}
                                                                alt={attachment.name}
                                                                className="w-full h-auto max-h-[300px] object-cover"
                                                            />
                                                        </div>
                                                    ) : attachment.type === 'audio' || attachment.url.match(/\.(mp3|wav|ogg|m4a)$/i) ? (
                                                        <AudioPlayer src={attachment.url} />
                                                    ) : (
                                                        <a
                                                            href={attachment.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors border border-white/5"
                                                        >
                                                            <div className="h-10 w-10 rounded-lg bg-black/20 flex items-center justify-center">
                                                                <Paperclip className="h-5 w-5" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-black truncate">{attachment.name}</p>
                                                                <p className="text-[10px] opacity-60 font-bold uppercase tracking-tighter">ملف مرفق</p>
                                                            </div>
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <p className="leading-relaxed font-black whitespace-pre-wrap text-base sm:text-sm">{msg.content}</p>

                                    <div className={cn(
                                        "absolute -bottom-6 flex items-center gap-1.5 whitespace-nowrap",
                                        msg.sender_type === 'agent' ? "right-1" : "left-1"
                                    )}>
                                        <span className="text-[10px] font-number font-black text-brand-blue-alt/40">
                                            {new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {msg.sender_type === 'agent' && (
                                            <div className="flex -space-x-1 rtl:space-x-reverse">
                                                <div className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                                                <div className="h-1.5 w-1.5 rounded-full bg-brand-green opacity-50" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Consolidated Sidebar */}
                <div className={cn(
                    "w-80 border-r-2 border-brand-beige bg-white transition-all duration-300 flex flex-col overflow-hidden",
                    sidebarView ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 w-0 border-none"
                )}>
                    {/* Sidebar Header */}
                    <div className="p-3 border-b border-brand-beige flex items-center justify-between bg-brand-off-white/30">
                        <div className="flex items-center gap-2">
                            {sidebarView === 'replies' && <MessageSquare className="h-4 w-4 text-brand-blue" />}
                            {sidebarView === 'profile' && <User className="h-4 w-4 text-brand-blue" />}
                            {sidebarView === 'notes' && <StickyNote className="h-4 w-4 text-brand-blue" />}
                            <h4 className="font-black text-brand-blue text-[11px] uppercase tracking-wider">
                                {sidebarView === 'replies' && "الردود المحفوظة"}
                                {sidebarView === 'profile' && "بيانات العميل"}
                                {sidebarView === 'notes' && "ملاحظات الموظفين"}
                            </h4>
                        </div>
                        <Button variant="ghost" className="p-1 h-auto hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors" onClick={() => setSidebarView(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-hide bg-white/50">
                        {/* 1. Saved Replies View */}
                        {sidebarView === 'replies' && (
                            <div className="flex flex-col h-full">
                                <div className="p-4 border-b border-brand-beige flex items-center justify-between bg-brand-off-white/50">
                                    <h3 className="font-black text-brand-blue flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 text-brand-green" />
                                        الردود السريعة
                                    </h3>
                                </div>
                                <div className="p-4 flex-1 overflow-y-auto">
                                    <QuickReplyManager
                                        replies={quickReplies}
                                        onUpdate={fetchQuickReplies}
                                    />
                                </div>
                            </div>
                        )}

                        {/* 2. Customer Profile View */}
                        {sidebarView === 'profile' && (
                            <div className="p-4 space-y-4 animate-in fade-in slide-in-from-right-2">
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-brand-blue-alt/40 tracking-widest flex items-center gap-2 px-1">
                                            <User className="h-3 w-3" />
                                            اسم العميل
                                        </label>
                                        <div className="px-3 py-2 bg-brand-off-white border border-brand-beige rounded-xl font-black text-brand-blue text-sm">
                                            {details?.customers?.name}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-brand-blue-alt/40 tracking-widest flex items-center gap-2 px-1">
                                            <PhoneCall className="h-3 w-3" />
                                            رقم الهاتف
                                        </label>
                                        <div className="px-3 py-2 bg-brand-off-white border border-brand-beige rounded-xl font-number font-black text-brand-blue text-sm flex items-center justify-between group cursor-pointer hover:border-brand-green/30 transition-all">
                                            <span>{(details?.customers as any)?.phone || 'غير مسجل'}</span>
                                            <X className="h-3 w-3 opacity-0 group-hover:opacity-40" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-brand-blue-alt/40 tracking-widest flex items-center gap-2 px-1">
                                            <Mail className="h-3 w-3" />
                                            البريد الإلكتروني
                                        </label>
                                        <div className="px-3 py-2 bg-brand-off-white border border-brand-beige rounded-xl font-bold text-brand-blue text-xs truncate hover:border-brand-green/30 transition-all cursor-pointer">
                                            {(details?.customers as any)?.email || 'غير متاح حالياً'}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-brand-blue-alt/40 tracking-widest flex items-center gap-2 px-1">
                                            <Search className="h-3 w-3" />
                                            العنوان بالتفصيل
                                        </label>
                                        <textarea
                                            className="w-full px-3 py-2 bg-brand-off-white border border-brand-beige rounded-xl font-bold text-brand-blue text-xs outline-none focus:border-brand-green/30 transition-all resize-none min-h-[60px]"
                                            placeholder="أضف عنوان العميل هنا..."
                                            value={(details?.customers as any)?.address || ''}
                                            onChange={(e) => {
                                                const newAddress = e.target.value;
                                                setDetails(prev => prev ? {
                                                    ...prev,
                                                    customers: { ...prev.customers, address: newAddress }
                                                } : null);
                                            }}
                                            onBlur={(e) => updateCustomerMeta({ address: e.target.value })}
                                        />
                                    </div>

                                    <div className="p-3 bg-brand-green/5 border border-brand-green/10 rounded-xl">
                                        <p className="text-[9px] font-bold text-brand-green text-center leading-relaxed">
                                            بيانات العميل يتم جمعها وتحديثها تلقائياً عبر البوت الذكي ومنصات التواصل المرتبطة.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Internal Notes & Tags View */}
                        {sidebarView === 'notes' && (
                            <div className="p-4 space-y-5 animate-in fade-in slide-in-from-right-2">
                                {/* Tags Section */}
                                <div className="space-y-3">
                                    <h6 className="text-[10px] font-black uppercase text-brand-blue-alt/40 tracking-widest flex items-center gap-2 px-1">
                                        <Tag className="h-3 w-3" />
                                        الوسوم (Tags)
                                    </h6>

                                    <div className="flex flex-wrap gap-1.5">
                                        {customerTags.map(tag => (
                                            <span key={tag} className="flex items-center gap-1.5 px-2 py-1 bg-brand-green/5 text-brand-green border border-brand-green/10 rounded-lg text-[10px] font-black group transition-all hover:bg-brand-green hover:text-white">
                                                {tag}
                                                <button onClick={() => removeTag(tag)} className="opacity-40 hover:opacity-100 transition-opacity">
                                                    <X className="h-2.5 w-2.5" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex gap-1.5">
                                        <input
                                            type="text"
                                            placeholder="إضافة وسم..."
                                            className="flex-1 bg-brand-off-white border border-brand-beige rounded-xl py-1.5 px-3 text-[11px] font-bold outline-none focus:border-brand-green/30 transition-all text-brand-blue"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                        />
                                        <Button onClick={addTag} className="h-8 w-8 p-0 rounded-xl bg-brand-green shadow-sm">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Internal Notes */}
                                <div className="space-y-3">
                                    <h6 className="text-[10px] font-black uppercase text-brand-blue-alt/40 tracking-widest flex items-center gap-2 px-1">
                                        <StickyNote className="h-3 w-3" />
                                        ملاحظات الموظفين
                                    </h6>
                                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 space-y-2 shadow-inner">
                                        <textarea
                                            className="w-full bg-transparent border-none outline-none text-[11px] font-bold text-amber-900 placeholder:text-amber-700/30 min-h-[200px] resize-none leading-relaxed"
                                            placeholder="اكتب ملاحظات سرية عن العميل هنا..."
                                            value={internalNote}
                                            onChange={(e) => setInternalNote(e.target.value)}
                                            onBlur={saveInternalNote}
                                        />
                                        <div className="flex justify-end">
                                            <span className="text-[8px] font-black text-amber-700/40 uppercase">يتم الحفظ تلقائياً عند الانتهاء</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div >

            {/* Quick Replies Bar */}
            {
                quickReplies.length > 0 && (
                    <div className="px-6 py-3 border-t-2 border-brand-beige flex gap-3 overflow-x-auto whitespace-nowrap scrollbar-hide bg-white items-center shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
                        {can('manage_automation') && (
                            <Button
                                variant="ghost"
                                className="h-9 px-4 text-xs font-black gap-2 text-brand-blue-alt/40 border-2 border-dashed border-brand-beige rounded-xl hover:border-brand-green/30 hover:text-brand-green hover:bg-brand-green/5 transition-all flex-shrink-0"
                                onClick={() => window.location.href = '/dashboard/settings/automation'}
                            >
                                <Settings className="h-4 w-4" />
                                إدارة الردود
                            </Button>
                        )}
                        <div className="h-5 w-[2px] bg-brand-beige flex-shrink-0 mx-1" />
                        {quickReplies.map(q => (
                            <button
                                key={q.id}
                                onClick={() => setMessage(q.content)}
                                className="px-5 py-2 bg-brand-off-white hover:bg-white hover:shadow-lg hover:text-brand-green rounded-2xl text-[13px] font-black transition-all text-brand-blue-alt/60 border-2 border-brand-beige hover:border-brand-green/30 flex-shrink-0 active:scale-95"
                            >
                                {q.shortcut}
                            </button>
                        ))}
                    </div>
                )
            }

            {/* Input */}
            <div className="p-6 bg-white border-t-2 border-brand-beige">
                <form
                    onSubmit={sendMessage}
                    className="bg-brand-off-white/80 rounded-[28px] p-3 flex items-end gap-3 border-2 border-brand-beige focus-within:border-brand-green/30 focus-within:bg-white transition-all shadow-lg shadow-black/[0.02] relative"
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                    />

                    <div className="flex items-center gap-1 mb-1">
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-10 w-10 p-0 rounded-2xl text-brand-blue-alt/40 hover:text-brand-green hover:bg-brand-green/5 transition-all"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? <Loader2 className="h-5 w-5 animate-spin text-brand-green" /> : <Paperclip className="h-5 w-5" />}
                        </Button>
                        <div className="relative">
                            <Button
                                type="button"
                                variant="ghost"
                                className={cn(
                                    "h-10 w-10 p-0 rounded-2xl transition-all",
                                    showEmojiPicker ? "text-amber-500 bg-amber-50" : "text-brand-blue-alt/40 hover:text-amber-500 hover:bg-amber-50"
                                )}
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            >
                                <Smile className="h-5 w-5" />
                            </Button>
                            {showEmojiPicker && (
                                <EmojiPicker
                                    onSelect={(emoji) => setMessage(prev => prev + emoji)}
                                    onClose={() => setShowEmojiPicker(false)}
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-3">
                        {/* Uploaded Files Preview */}
                        {uploadedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-3 p-3 bg-white/50 rounded-2xl border-2 border-brand-beige/50 animate-in fade-in slide-in-from-bottom-2">
                                {uploadedFiles.map((file, index) => (
                                    <div key={index} className="relative group/file">
                                        {file.type === 'image' ? (
                                            <div className="h-20 w-20 rounded-xl overflow-hidden shadow-md group-hover/file:shadow-lg transition-shadow">
                                                <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="h-20 w-20 bg-brand-off-white rounded-xl flex flex-col items-center justify-center gap-1 border-2 border-brand-beige shadow-md">
                                                <Paperclip className="h-7 w-7 text-brand-blue-alt/30" />
                                                <span className="text-[8px] font-black text-brand-blue-alt/50 px-1 truncate w-full text-center">{file.name}</span>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeUploadedFile(index)}
                                            className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg transform scale-0 group-hover/file:scale-100 transition-transform hover:bg-red-600"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <textarea
                            placeholder="اكتب رسالتك للمستخدم هنا..."
                            className="flex-1 bg-transparent border-none outline-none py-3 px-2 text-[15px] resize-none max-h-48 min-h-[44px] font-black text-brand-blue placeholder:text-brand-blue-alt/30 leading-relaxed"
                            rows={1}
                            value={message}
                            onChange={(e) => {
                                setMessage(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                        />
                    </div>

                    <Button
                        type="submit"
                        className={cn(
                            "h-12 w-12 p-0 rounded-2xl shadow-xl flex-shrink-0 transition-all active:scale-90 mb-1",
                            message.trim() || uploadedFiles.length > 0
                                ? "bg-brand-green hover:bg-brand-green-alt shadow-brand-green/30 text-white"
                                : "bg-brand-beige text-brand-blue-alt/30 cursor-not-allowed"
                        )}
                        disabled={!message.trim() && uploadedFiles.length === 0}
                    >
                        <Send className="h-6 w-6 transform rtl:-rotate-90" />
                    </Button>
                </form>
                <p className="text-center text-[10px] text-brand-blue-alt/30 font-bold mt-4">
                    اضغط Shift + Enter لسطر جديد • جميع المحادثات آمنة ومشفرة
                </p>
            </div>
        </div >
    );
}
