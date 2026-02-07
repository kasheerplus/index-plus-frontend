'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus,
    Minus,
    Share2,
    Trash2,
    Edit2,
    Search,
    Zap,
    Loader2,
    LayoutTemplate,
    ChevronRight,
    Play,
    Settings2,
    Phone,
    MessageSquare,
    Send,
    User,
    Bot,
    Link as LinkIcon,
    UserCheck,
    Package,
    Tag,
    Clock,
    X,
    MoreHorizontal,
    Lock,
    Grid,
    List,
    Target,
    Maximize,
    ChevronDown,
    MessageCircle,
    Instagram
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { SettingsHeader } from '@/components/settings/settings-header';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-permissions';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FLOW_TEMPLATES, CATEGORIES, ACTIVITY_GROUPS } from '@/data/flow-templates';

interface FlowNode {
    id: string;
    type: 'message' | 'question' | 'handover' | 'product_lookup' | 'crm_tag' | 'time_condition' | 'collect_data' | 'create_order' | 'condition' | 'router' | 'payment_request' | 'payment_status';
    content: string;
    metadata?: {
        // Router specific metadata
        branches?: {
            id: string;
            label: string;
            variable: string;
            operator: string;
            value: string | number;
            nextNodeId?: string;
        }[];
        fallbackNodeId?: string;
        // Payment specific metadata
        paymentAmount?: number | 'dynamic';
        paymentAmountVariable?: string;
        paymentMethods?: ('fawry' | 'wallet' | 'card')[];
        paymentDescription?: string;
        paymentExpiryHours?: number;
        // Legacy condition metadata
        conditions?: any[];
        [key: string]: any;
    };
    options?: { id: string; label: string; nextNodeId: string }[];
    defaultNextNodeId?: string;
    transitionType?: 'timeout' | 'input';
    position?: { x: number; y: number };
}

interface InteractiveFlow {
    id: string;
    name: string;
    trigger_type: 'keyword' | 'post_link' | 'main_menu' | 'all';
    trigger_keyword: string;
    trigger_post_link: string;
    is_main_menu: boolean;
    is_active: boolean;
    flow_data: {
        nodes: FlowNode[];
        startNodeId: string;
    };
}

export default function InteractiveFlowsPage() {
    const { can, isLoading: isRoleLoading } = usePermissions();
    const [flows, setFlows] = useState<InteractiveFlow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [activeActivity, setActiveActivity] = useState<string | null>(null);
    // Flow Builder & Simulator State

    // Flow Builder & Simulator State
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingFlow, setEditingFlow] = useState<InteractiveFlow | null>(null);
    const [flowName, setFlowName] = useState('');
    const [triggerType, setTriggerType] = useState<'keyword' | 'post_link' | 'main_menu' | 'all'>('keyword');
    const [triggerKeyword, setTriggerKeyword] = useState('');
    const [triggerPostLink, setTriggerPostLink] = useState('');
    const [nodes, setNodes] = useState<FlowNode[]>([]);
    const [startNodeId, setStartNodeId] = useState('');

    // Simulator State
    const [simMessages, setSimMessages] = useState<{ sender: 'bot' | 'user'; text: string; options?: any[]; metadata?: any; isSystem?: boolean }[]>([]);
    const [currentSimNodeId, setCurrentSimNodeId] = useState<string | null>(null);
    const [simInput, setSimInput] = useState('');
    const [simPlatform, setSimPlatform] = useState<'whatsapp' | 'messenger' | 'instagram'>('whatsapp');

    // Kasheer Plus Integration
    const [isKasheerConnected, setIsKasheerConnected] = useState(false);
    const [inventory, setInventory] = useState<any[]>([]);
    const [creationMenuNodeId, setCreationMenuNodeId] = useState<string | null>(null);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1.0);

    useEffect(() => {
        if (!isRoleLoading && can('manage_automation')) {
            fetchFlows();
            fetchInventory();
            checkKasheerConnection();
        }
    }, [isRoleLoading]);

    const checkKasheerConnection = async () => {
        const { data } = await supabase
            .from('channels')
            .select('status')
            .eq('platform', 'kasheer_plus')
            .eq('status', 'connected')
            .limit(1);
        setIsKasheerConnected(data && data.length > 0 ? true : false);
    };

    const fetchFlows = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('interactive_flows')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) toast.error('فشل تحميل القوائم');
        else setFlows(data || []);
        setIsLoading(false);
    };

    const fetchInventory = async () => {
        const { data } = await supabase.from('synced_inventory').select('id, name, price, sku').limit(10);
        setInventory(data || []);
    };

    const handleSaveFlow = async () => {
        if (!flowName) return toast.error('يرجى إدخال اسم القائمة');
        setIsSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const companyId = user?.app_metadata?.company_id || user?.user_metadata?.company_id;

            const payload = {
                name: flowName,
                trigger_type: triggerType,
                trigger_keyword: (triggerType === 'keyword' || triggerType === 'all') ? (triggerKeyword || null) : null,
                trigger_post_link: (triggerType === 'post_link' || triggerType === 'all') ? (triggerPostLink || null) : null,
                is_main_menu: triggerType === 'main_menu',
                flow_data: { nodes, startNodeId },
                company_id: companyId,
                is_active: true
            };

            if (editingFlow) {
                const { error } = await supabase.from('interactive_flows').update(payload).eq('id', editingFlow.id);
                if (error) throw error;
                toast.success('تم تحديث المسار بنجاح');
            } else {
                const { error } = await supabase.from('interactive_flows').insert(payload);
                if (error) throw error;
                toast.success('تم إنشاء المسار بنجاح');
            }
            setShowBuilder(false);
            fetchFlows();
        } catch (err: any) {
            toast.error(err.message || 'حدث خطأ أثناء الحفظ');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInitializeDefaults = async () => {
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const companyId = user?.app_metadata?.company_id || user?.user_metadata?.company_id;

            const defaults = FLOW_TEMPLATES.filter(t => t.isDefault);
            const payloads = defaults.map(t => ({
                name: t.name,
                trigger_type: t.id === 'tpl-main-menu' ? 'main_menu' : 'keyword',
                is_main_menu: t.id === 'tpl-main-menu',
                flow_data: t.flow_data,
                company_id: companyId,
                is_active: true
            }));

            const { error } = await supabase.from('interactive_flows').insert(payloads);
            if (error) throw error;

            toast.success('تم تهيئة القوائم الأساسية بنجاح!');
            fetchFlows();
        } catch (err: any) {
            toast.error('فشل في التهيئة التلقائية');
        } finally {
            setIsSaving(false);
        }
    };

    const applyTemplate = (template: any) => {
        if (template.requiresKasheer && !isKasheerConnected) {
            toast.error('هذا القالب يتطلب ربط كاشير بلس أولاً');
            return;
        }
        setEditingFlow(null);
        setFlowName(template.name);
        setTriggerType(template.id === 'tpl-main-menu' ? 'main_menu' : 'keyword');
        setTriggerKeyword('');
        setTriggerPostLink('');
        setNodes(template.flow_data.nodes);
        setStartNodeId(template.flow_data.startNodeId);
        setShowBuilder(true);
        resetSimulator();
    };

    const handleApplyActivitySet = (activity: any) => {
        // Toggle filter instead of auto-applying
        if (activeActivity === activity.title) {
            setActiveActivity(null);
        } else {
            setActiveActivity(activity.title);
            toast.success(`تم تصفية القوالب لـ ${activity.title}`);
            // Smooth scroll to gallery
            const gallery = document.getElementById('template-gallery');
            gallery?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const addNode = (type: FlowNode['type'], content: string, metadata: any = {}) => {
        const newNodeId = 'node-' + Math.random().toString(36).substr(2, 9);
        const lastNode = editingNodeId ? nodes.find(n => n.id === editingNodeId) : nodes[nodes.length - 1];

        // Calculate Position
        let position = { x: 2400, y: 2400 }; // Center of 5000x5000 grid
        if (lastNode && lastNode.position) {
            position = { x: lastNode.position.x + 350, y: lastNode.position.y };
        } else if (nodes.length > 0) {
            const last = nodes[nodes.length - 1];
            position = { x: (last.position?.x || 2400) + 350, y: (last.position?.y || 2400) };
        }

        const newNode: FlowNode = {
            id: newNodeId,
            type,
            content,
            metadata,
            position
        };

        if (type === 'router') {
            newNode.content = 'موزع شروط';
            newNode.metadata = {
                branches: [],
                fallbackNodeId: undefined
            };
        }

        const updatedNodes = [...nodes, newNode];

        // Auto-connect if possible
        if (lastNode && !lastNode.defaultNextNodeId && lastNode.type !== 'handover' && lastNode.type !== 'condition') {
            const idx = updatedNodes.findIndex(n => n.id === lastNode.id);
            updatedNodes[idx] = { ...updatedNodes[idx], defaultNextNodeId: newNodeId };
        }

        setNodes(updatedNodes);
        setEditingNodeId(newNodeId);
        if (!startNodeId) setStartNodeId(newNodeId);

    };



    const openBuilder = (flow: InteractiveFlow | null = null) => {
        if (flow) {
            setEditingFlow(flow);
            setFlowName(flow.name);
            setTriggerType(flow.trigger_type || 'keyword');
            setTriggerKeyword(flow.trigger_keyword || '');
            setTriggerPostLink(flow.trigger_post_link || '');
            setNodes(flow.flow_data.nodes || []);
            setStartNodeId(flow.flow_data.startNodeId || '');
        } else {
            setEditingFlow(null);
            setFlowName('');
            setTriggerType('keyword');
            setTriggerKeyword('');
            setTriggerPostLink('');
            const initialNodeId = 'node-' + Math.random().toString(36).substr(2, 9);
            const initialNode: FlowNode = {
                id: initialNodeId,
                type: 'message',
                content: 'مرحباً بك! كيف يمكنني مساعدتك؟',
                position: { x: 2400, y: 2400 }
            };
            setNodes([initialNode]);
            setStartNodeId(initialNodeId);
            setEditingNodeId(initialNodeId);
        }
        setShowBuilder(true);
        resetSimulator();

    };

    const resetSimulator = () => {
        setSimMessages([]);
        setCurrentSimNodeId(null);
    };

    const runSimulator = () => {
        const startNode = nodes.find(n => n.id === startNodeId);
        if (!startNode) return;
        processNode(startNode);
    };

    const processNode = (node: FlowNode) => {
        setCurrentSimNodeId(node.id);

        let messageText = node.content;
        let metadata = node.metadata;

        if (node.type === 'product_lookup' && node.metadata?.productId) {
            const product = inventory.find(p => p.id === node.metadata?.productId);
            if (product) {
                messageText = `سعر ${product.name} هو ${product.price} ج.م`;
            }
        } else if (node.type === 'handover') {
            messageText = 'تم تحويل المحادثة لموظف، سيتم الرد عليك قريباً...';
        } else if (node.type === 'crm_tag') {
            messageText = `[نظام] تم إضافة تصنيف: ${node.metadata?.tag}`;
        } else if (node.type === 'collect_data') {
            const selectedFields = node.metadata?.fields || [];
            const fieldsMap: Record<string, string> = {
                'name': 'الاسم',
                'phone': 'الهاتف',
                'address': 'العنوان',
                'size': 'المقاس',
                'color': 'اللون'
            };
            const fieldNames = selectedFields.map((f: string) => fieldsMap[f] || f).join('، ');
            messageText = node.content + (fieldNames ? `\n(${fieldNames})` : '');
        } else if (node.type === 'create_order') {
            const orderId = Math.floor(100000 + Math.random() * 900000);
            messageText = node.content.replace('{{order_id}}', orderId.toString());
        }

        if (node.type === 'condition') {
            const lastUserMsg = [...simMessages].reverse().find(m => m.sender === 'user');
            const userText = lastUserMsg?.text?.toLowerCase() || '';

            let targetNodeId = node.defaultNextNodeId; // Default to Else

            if (node.metadata?.conditions) {
                for (const cond of node.metadata.conditions) {
                    if (cond.value && userText.includes(cond.value.toLowerCase())) {
                        targetNodeId = cond.nextNodeId;
                        break;
                    }
                }
            }

            if (targetNodeId) {
                const nextNode = nodes.find(n => n.id === targetNodeId);
                if (nextNode) {
                    setTimeout(() => processNode(nextNode), 500);
                    return;
                }
            }
        }

        setSimMessages(prev => [...prev, {
            sender: 'bot',
            text: messageText,
            options: node.options,
            metadata: metadata,
            isSystem: node.type === 'condition'
        }]);

        // Auto-advance if no options and transition is 'timeout' or not set (default)
        if (node.type !== 'handover' && node.type !== 'condition' && (!node.options || node.options.length === 0) && node.defaultNextNodeId && node.transitionType !== 'input') {
            const nextNode = nodes.find(n => n.id === node.defaultNextNodeId);
            if (nextNode) {
                setTimeout(() => {
                    processNode(nextNode);
                }, 1500); // 1.5s delay for natural feel
            }
        }
    };

    const handleSimReply = (text: string) => {
        setSimMessages(prev => [...prev, { sender: 'user', text }]);

        const currentNode = nodes.find(n => n.id === currentSimNodeId);
        if (currentNode?.transitionType === 'input' && currentNode.defaultNextNodeId) {
            const nextNode = nodes.find(n => n.id === currentNode.defaultNextNodeId);
            if (nextNode) {
                setTimeout(() => processNode(nextNode), 1000);
            }
        }
    };

    const handleSimOptionClick = (option: any) => {
        const nextNode = nodes.find(n => n.id === option.nextNodeId);
        setSimMessages(prev => [...prev, { sender: 'user', text: option.label }]);
        if (nextNode) processNode(nextNode);
    };

    if (!isRoleLoading && !can('manage_automation')) {
        return <div className="p-12 text-center font-cairo">لا تملك صلاحية الوصول</div>;
    }

    return (
        <div className="p-8 space-y-8 bg-brand-off-white min-h-full font-cairo text-right" dir="rtl">
            <SettingsHeader />

            {/* Sub Nav */}
            <div className="flex gap-8 border-b-2 border-brand-beige">
                <Link href="/dashboard/settings/automation" className="pb-4 px-2 text-sm font-bold text-brand-blue-alt/40 hover:text-brand-blue transition-all uppercase tracking-tight">الردود السريعة</Link>
                <Link href="/dashboard/settings/automation/rules" className="pb-4 px-2 text-sm font-bold text-brand-blue-alt/40 hover:text-brand-blue transition-all uppercase tracking-tight">محرك الرد الآلي</Link>
                <Link href="/dashboard/settings/automation/menus" className="pb-4 px-2 text-sm font-black text-brand-green border-b-4 border-brand-green transition-all uppercase tracking-tight">القوائم التفاعلية</Link>
            </div>

            {!showBuilder ? (
                <div className="bg-white rounded-[32px] border-2 border-brand-beige shadow-sm overflow-hidden animate-in fade-in duration-500">
                    <div className="p-8 border-b-2 border-brand-off-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-brand-blue text-white flex items-center justify-center shadow-lg shadow-brand-blue/20">
                                <Share2 className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-2xl font-black text-brand-blue">باني القوائم التفاعلية المتقدم</h2>
                                    {isKasheerConnected ? (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-green/10 text-brand-green border border-brand-green/20 rounded-full text-[10px] font-black animate-pulse">
                                            <div className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                                            كاشير بلس متصل
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full text-[10px] font-black">
                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                            كاشير بلس غير متصل (محدود)
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-brand-blue-alt/40 font-black uppercase tracking-widest">قم بإنشاء مسارات محادثة آلية، ربط منشورات، ودمج المخزن</p>
                            </div>
                        </div>

                        <Button
                            className="bg-brand-green hover:bg-brand-green-alt text-white font-black gap-2 h-14 px-8 rounded-2xl shadow-xl shadow-brand-green/20 transition-all active:scale-95"
                            onClick={() => openBuilder()}
                        >
                            <Plus className="h-5 w-5" />
                            إنشاء مسار أتمتة
                        </Button>
                    </div>

                    <div className="p-8">
                        {isLoading ? (
                            <Skeleton className="h-48 w-full rounded-2xl" />
                        ) : flows.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-brand-beige">
                                <Bot className="h-16 w-16 text-brand-green mx-auto mb-4 animate-bounce" />
                                <h3 className="text-2xl font-black text-brand-blue mb-2">ابدأ ذكاء مشروعك بلمسة واحدة</h3>
                                <p className="text-sm text-brand-blue-alt/40 max-w-sm mx-auto mb-8">لم تقم بإنشاء أي قوائم تفاعلية بعد. هل تود أن نقوم بإنشاء القوائم الأساسية لك آلياً؟</p>
                                <Button
                                    className="bg-brand-blue text-white h-14 px-10 rounded-2xl font-black shadow-xl shadow-brand-blue/20"
                                    onClick={handleInitializeDefaults}
                                    disabled={isSaving}
                                >
                                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Zap className="h-5 w-5 mr-2 text-brand-green" />}
                                    تهيئة القوائم الأساسية الآن (Core)
                                </Button>
                                <p className="mt-4 text-[10px] text-brand-blue-alt/20 font-black uppercase">سيتم إضافة: القائمة الرئيسية، رد الرجوع، وتواصل مع موظف</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {flows.map(flow => (
                                    <div key={flow.id} className="p-6 bg-brand-off-white/50 border-2 border-brand-beige rounded-[24px] hover:border-brand-green/30 hover:bg-white transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-10 w-10 rounded-xl bg-brand-blue/5 flex items-center justify-center text-brand-blue">
                                                {flow.trigger_type === 'main_menu' ? <LayoutTemplate className="h-5 w-5" /> :
                                                    flow.trigger_type === 'post_link' ? <LinkIcon className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                                            </div>
                                            <div className="flex gap-2">
                                                {flow.is_main_menu && (
                                                    <span className="text-[10px] font-black bg-amber-500 text-white px-3 py-1 rounded-lg shadow-sm">القائمة الرئيسية</span>
                                                )}
                                                <button onClick={() => openBuilder(flow)} className="p-2 hover:bg-brand-off-white rounded-lg text-brand-blue-alt/40 hover:text-brand-blue transition-colors">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <h4 className="font-black text-brand-blue mb-1">{flow.name}</h4>
                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            {flow.trigger_type === 'main_menu' && (
                                                <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100 italic">تظهر تلقائياً عند بدء المحادثة</span>
                                            )}
                                            {flow.trigger_type === 'keyword' && (
                                                <span className="text-[10px] font-black bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full">
                                                    /{flow.trigger_keyword || 'no-trigger'}
                                                </span>
                                            )}
                                            {flow.trigger_type === 'post_link' && (
                                                <span className="text-[10px] font-black bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <LinkIcon className="h-3 w-3" /> منشور مربوط
                                                </span>
                                            )}
                                            <span className="text-[10px] font-black text-brand-blue-alt/40 uppercase">
                                                {flow.flow_data.nodes?.length || 0} خطوة
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-between items-center text-xs font-black text-brand-green bg-white border border-brand-beige group-hover:border-brand-green/20"
                                            onClick={() => openBuilder(flow)}
                                        >
                                            تعديل المسار وفتـح المحـاكـي
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Template Gallery */}
                    <div id="template-gallery" className="p-8 bg-brand-off-white/30 border-t-2 border-brand-off-white">
                        <div className="flex items-center gap-3 mb-8">
                            <LayoutTemplate className="h-6 w-6 text-brand-blue" />
                            <div>
                                <h3 className="text-xl font-black text-brand-blue">مسارات جاهزة للتشغيل (قوالب إندكس)</h3>
                                <p className="text-[10px] text-brand-blue-alt/40 font-black uppercase tracking-widest">اختر قالباً جاهزاً وقم بتخصيصه خلال ثوانٍ</p>
                            </div>
                        </div>

                        {CATEGORIES.map(cat => {
                            const catTemplates = FLOW_TEMPLATES.filter(t => t.category === cat.id);
                            const filteredTemplates = activeActivity
                                ? catTemplates.filter(t => ACTIVITY_GROUPS.find(a => a.title === activeActivity)?.templateIds.includes(t.id))
                                : catTemplates;

                            if (filteredTemplates.length === 0) return null;

                            return (
                                <div key={cat.id} className="mb-10 last:mb-0">
                                    <div className="flex items-center gap-2 mb-4 px-2">
                                        <cat.icon className="h-4 w-4 text-brand-green" />
                                        <h4 className="text-sm font-black text-brand-blue">{cat.name}</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {filteredTemplates.map(tpl => {
                                            const isLocked = tpl.requiresKasheer && !isKasheerConnected;
                                            return (
                                                <div key={tpl.id} className={`p-5 bg-white border-2 border-brand-beige rounded-2xl hover:border-brand-green/30 transition-all group flex flex-col justify-between h-full relative ${isLocked ? 'opacity-60 cursor-not-allowed grayscale' : ''}`}>
                                                    {isLocked && (
                                                        <div className="absolute top-3 left-3 bg-amber-500 text-white p-1.5 rounded-lg shadow-lg z-10">
                                                            <Lock className="h-3 w-3" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="h-8 w-8 rounded-lg bg-brand-off-white flex items-center justify-center text-brand-blue mb-3">
                                                            <tpl.icon className="h-4 w-4" />
                                                        </div>
                                                        <h5 className="font-black text-sm text-brand-blue mb-1 group-hover:text-brand-green transition-colors flex items-center gap-2">
                                                            {tpl.name}
                                                            {tpl.requiresKasheer && !isLocked && <Zap className="h-3 w-3 text-brand-green" />}
                                                        </h5>
                                                        <p className="text-[10px] text-brand-blue-alt/50 leading-relaxed mb-4">{tpl.description}</p>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        className={`w-full h-9 text-[10px] font-black border-brand-beige rounded-xl ${isLocked ? 'hover:bg-brand-off-white cursor-not-allowed' : 'hover:border-brand-green hover:text-brand-green'}`}
                                                        onClick={() => applyTemplate(tpl)}
                                                        disabled={isLocked}
                                                    >
                                                        {isLocked ? 'مطلوب ربط كاشير بلس' : 'تخصيص القالب'}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        <div className="mt-12">
                            <h4 className="text-xs font-black text-brand-blue-alt/40 px-2 uppercase tracking-widest mb-6">قوالب حسب نشاطك التجاري</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {ACTIVITY_GROUPS.map((act, i) => (
                                    <div
                                        key={i}
                                        className="p-6 bg-gradient-to-br from-brand-blue to-brand-blue-alt text-white rounded-[24px] shadow-lg shadow-brand-blue/20 flex flex-col items-center text-center group hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden"
                                        onClick={() => handleApplyActivitySet(act)}
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-all duration-700">
                                            <act.icon className="h-24 w-24" />
                                        </div>
                                        <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 group-hover:bg-brand-green group-hover:rotate-12 transition-all relative z-10">
                                            <act.icon className="h-6 w-6" />
                                        </div>
                                        <h5 className="font-black text-sm mb-2 relative z-10">{act.title}</h5>
                                        <p className="text-[10px] opacity-60 mb-4 relative z-10">يحتوي على {act.templateIds.length} قوائم مدمجة</p>
                                        <Button
                                            variant="ghost"
                                            className="text-[8px] font-black hover:bg-white/10 text-white p-0 h-auto relative z-10"
                                            disabled={isSaving}
                                        >
                                            {isSaving ? 'جارٍ التفعيل...' : 'تفعيل المجموعة الكاملة ←'}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[700px] animate-in slide-in-from-bottom-4 duration-500">
                    {/* Left: Flow Settings & Editor */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="bg-white p-6 rounded-[32px] border-2 border-brand-beige shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xl font-black text-brand-blue">إعدادات المسار والتشغيل</h3>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="ghost" className="font-black text-brand-blue-alt/40" onClick={() => setShowBuilder(false)}>إلغاء</Button>
                                    <Button className="bg-brand-green hover:bg-brand-green-alt text-white font-black px-8 rounded-xl shadow-lg transition-all active:scale-95" onClick={handleSaveFlow}>حفظ ونشر الميزات</Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-brand-blue-alt/40 px-2 uppercase tracking-widest">اسم الأتمتة</label>
                                    <input
                                        type="text"
                                        value={flowName}
                                        onChange={e => setFlowName(e.target.value)}
                                        className="w-full h-14 px-6 bg-brand-off-white/80 border-2 border-brand-beige rounded-2xl font-black text-brand-blue outline-none focus:border-brand-green transition-all"
                                        placeholder="مثال: أتمتة منشور الشتاء"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-brand-blue-alt/40 px-2 uppercase tracking-widest">نوع التشغيل (Trigger)</label>
                                    <select
                                        value={triggerType}
                                        onChange={e => setTriggerType(e.target.value as any)}
                                        className="w-full h-14 px-6 bg-brand-off-white/80 border-2 border-brand-beige rounded-2xl font-black text-brand-blue outline-none appearance-none"
                                    >
                                        <option value="main_menu">القائمة الرئيسية (Welcome Menu)</option>
                                        <option value="keyword">كلمة دلالية (/welcome)</option>
                                        <option value="post_link">لينك منشور (Facebook/Insta)</option>
                                        <option value="all">الكل (Keyword + Post)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    {triggerType === 'main_menu' ? (
                                        <>
                                            <label className="text-xs font-black text-brand-blue-alt/40 px-2 uppercase tracking-widest">تنبيه النظام</label>
                                            <div className="h-14 px-6 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-center gap-3 text-amber-700">
                                                <Clock className="h-4 w-4" />
                                                <p className="text-[10px] font-black">هذه القائمة ستظهر تلقائياً بمجرد دخول العميل للشات لأول مرة.</p>
                                            </div>
                                        </>
                                    ) : triggerType === 'keyword' || triggerType === 'all' ? (
                                        <>
                                            <label className="text-xs font-black text-brand-blue-alt/40 px-2 uppercase tracking-widest">كلمة التفعيل</label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-blue-alt/20 font-black">/</div>
                                                <input
                                                    type="text"
                                                    value={triggerKeyword}
                                                    onChange={e => setTriggerKeyword(e.target.value)}
                                                    className="w-full h-14 pl-8 pr-6 bg-brand-off-white/80 border-2 border-brand-beige rounded-2xl font-black text-brand-blue outline-none font-number focus:border-brand-green transition-all"
                                                    placeholder="sale"
                                                    dir="ltr"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <label className="text-xs font-black text-brand-blue-alt/40 px-2 uppercase tracking-widest">لينك المنشور</label>
                                            <div className="relative">
                                                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue-alt/20" />
                                                <input
                                                    type="text"
                                                    value={triggerPostLink}
                                                    onChange={e => setTriggerPostLink(e.target.value)}
                                                    className="w-full h-14 pl-10 pr-6 bg-brand-off-white/80 border-2 border-brand-beige rounded-2xl font-black text-brand-blue outline-none truncate text-[10px] focus:border-brand-green transition-all"
                                                    placeholder="fb.com/posts/123..."
                                                    dir="ltr"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Node Editor */}
                        <div className="bg-white p-8 rounded-[32px] border-2 border-brand-beige shadow-sm flex-1 relative overflow-hidden">
                            <div className="flex items-center gap-3">
                                <Settings2 className="h-5 w-5 text-brand-green" />
                                <h3 className="text-xl font-black text-brand-blue">بناء خطوات الرد الذكية</h3>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="text-[10px] font-black text-brand-blue-alt/40 h-10 px-4 rounded-xl hover:text-brand-green border-brand-beige" onClick={() => addNode('message', 'نص رسالة جديدة...')}>
                                    + رسالة
                                </Button>
                                <Button variant="outline" className="text-[10px] font-black text-brand-blue-alt/40 h-10 px-4 rounded-xl hover:text-amber-500 border-brand-beige" onClick={() => addNode('handover', 'تحويل للموظف')}>
                                    + تحويل بشري
                                </Button>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "text-[10px] font-black h-10 px-4 rounded-xl border-brand-beige transition-all",
                                        !isKasheerConnected ? "opacity-60 cursor-not-allowed bg-brand-off-white" : "text-brand-blue-alt/40 hover:text-blue-500"
                                    )}
                                    disabled={!isKasheerConnected}
                                    onClick={() => addNode('product_lookup', 'جلب سعر منتج', { productId: '' })}
                                >
                                    {!isKasheerConnected && <Lock className="h-3 w-3 ml-1" />}
                                    + سعر من المخزن
                                </Button>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "text-[10px] font-black h-10 px-4 rounded-xl border-brand-beige transition-all",
                                        !isKasheerConnected ? "opacity-60 cursor-not-allowed bg-brand-off-white" : "text-brand-blue-alt/40 hover:text-purple-500"
                                    )}
                                    disabled={!isKasheerConnected}
                                    onClick={() => addNode('collect_data', 'من فضلك أدخل بياناتك...', { fields: ['name', 'phone', 'address'] })}
                                >
                                    {!isKasheerConnected && <Lock className="h-3 w-3 ml-1" />}
                                    + تحصيل بيانات
                                </Button>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "text-[10px] font-black h-10 px-4 rounded-xl border-brand-beige transition-all",
                                        !isKasheerConnected ? "opacity-60 cursor-not-allowed bg-brand-off-white" : "text-brand-blue-alt/40 hover:text-red-500"
                                    )}
                                    disabled={!isKasheerConnected}
                                    onClick={() => addNode('create_order', 'جارٍ إنشاء الطلب...', {})}
                                >
                                    {!isKasheerConnected && <Lock className="h-3 w-3 ml-1" />}
                                    + إنشاء طلب
                                </Button>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "text-[10px] font-black h-10 px-4 rounded-xl border-brand-beige transition-all text-brand-blue-alt/40 hover:text-orange-500"
                                    )}
                                    onClick={() => addNode('condition', 'تحقق من الشرط...', { conditions: [{ value: '', nextNodeId: '' }] })}
                                >
                                    <Zap className="h-3 w-3 ml-1" />
                                    + منطق / شرط
                                </Button>
                            </div>

                            <div className="space-y-6 max-h-[1000px] overflow-y-auto pr-2 custom-scrollbar">
                                {[...nodes].sort((a, b) => {
                                    if (a.id === startNodeId) return -1;
                                    if (b.id === startNodeId) return 1;
                                    return 0;
                                }).map((node) => {
                                    const index = nodes.indexOf(node);
                                    return (
                                        <div key={node.id} className="relative group">
                                            {index > 0 && <div className="absolute -top-6 right-10 h-6 w-0.5 bg-brand-beige group-hover:bg-brand-green/30 transition-colors" />}
                                            <div className={cn(
                                                "p-6 rounded-[24px] border-2 transition-all relative",
                                                node.type === 'handover' ? "bg-amber-50 border-amber-100" :
                                                    node.type === 'product_lookup' ? "bg-blue-50 border-blue-100" :
                                                        "bg-brand-off-white/50 border-brand-beige hover:border-brand-green/20"
                                            )}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                                                            node.type === 'handover' ? "bg-amber-500 text-white" :
                                                                node.type === 'product_lookup' ? "bg-blue-500 text-white" :
                                                                    "bg-brand-blue text-white"
                                                        )}>
                                                            {node.type === 'message' ? `الخطوة ${index + 1}` :
                                                                node.type === 'handover' ? 'تحويل بشري' :
                                                                    node.type === 'product_lookup' ? 'ربط المخزن' :
                                                                        node.type === 'collect_data' ? 'تحصيل بيانات' : 'إنشاء طلب'}
                                                        </span>
                                                        {node.id === startNodeId && <span className="text-[8px] font-black bg-brand-green text-white px-2 py-0.5 rounded-full">بداية المسار</span>}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {node.id !== startNodeId && <button onClick={() => setStartNodeId(node.id)} className="text-[8px] font-black text-brand-blue-alt/40 hover:text-brand-green">جعلها البداية</button>}
                                                        <button onClick={() => setNodes(nodes.filter(n => n.id !== node.id))} className="text-red-300 hover:text-red-500">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {node.type === 'message' || node.type === 'question' ? (
                                                    <textarea
                                                        value={node.content}
                                                        onChange={e => {
                                                            const updated = [...nodes];
                                                            updated[index].content = e.target.value;
                                                            setNodes(updated);
                                                        }}
                                                        className="w-full bg-white border-2 border-brand-beige rounded-xl p-4 font-black text-sm text-brand-blue min-h-[100px] outline-none focus:border-brand-green transition-all"
                                                        placeholder="اكتب رسالة البوت هنا..."
                                                    />
                                                ) : node.type === 'product_lookup' ? (
                                                    <div className="space-y-4">
                                                        <p className="text-xs font-black text-brand-blue-alt/60">اختر المنتج من مخزن (كاشير بلس) ليتم جلب سعره آلياً:</p>
                                                        <select
                                                            value={node.metadata?.productId}
                                                            onChange={e => {
                                                                const updated = [...nodes];
                                                                updated[index].metadata = { ...updated[index].metadata, productId: e.target.value };
                                                                setNodes(updated);
                                                            }}
                                                            className="w-full h-12 px-4 bg-white border-2 border-brand-beige rounded-xl font-bold text-sm outline-none"
                                                        >
                                                            <option value="">-- اختر منتج --</option>
                                                            {inventory.map(p => <option key={p.id} value={p.id}>{p.name} - ({p.sku})</option>)}
                                                        </select>
                                                    </div>
                                                ) : node.type === 'collect_data' ? (
                                                    <div className="space-y-4 bg-purple-50 p-4 rounded-2xl border border-purple-100">
                                                        <p className="text-xs font-black text-purple-700">اختر البيانات المطلوب تحصيلها في هذه الخطوة:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {[
                                                                { id: 'name', label: 'الاسم' },
                                                                { id: 'phone', label: 'الهاتف' },
                                                                { id: 'address', label: 'العنوان' },
                                                                { id: 'size', label: 'المقاس' },
                                                                { id: 'color', label: 'اللون' }
                                                            ].map(field => {
                                                                const isSelected = node.metadata?.fields?.includes(field.id);
                                                                return (
                                                                    <button
                                                                        key={field.id}
                                                                        onClick={() => {
                                                                            const updated = [...nodes];
                                                                            const currentFields = updated[index].metadata?.fields || [];
                                                                            if (isSelected) {
                                                                                updated[index].metadata = { ...updated[index].metadata, fields: currentFields.filter((f: string) => f !== field.id) };
                                                                            } else {
                                                                                updated[index].metadata = { ...updated[index].metadata, fields: [...currentFields, field.id] };
                                                                            }
                                                                            setNodes(updated);
                                                                        }}
                                                                        className={cn(
                                                                            "px-3 py-1.5 border-2 rounded-xl text-[10px] font-black transition-all",
                                                                            isSelected ? "bg-purple-500 text-white border-purple-500" : "bg-white text-purple-600 border-purple-200 hover:border-purple-400"
                                                                        )}
                                                                    >
                                                                        {isSelected ? '✓ ' : '+ '} {field.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        <textarea
                                                            value={node.content}
                                                            onChange={e => {
                                                                const updated = [...nodes];
                                                                updated[index].content = e.target.value;
                                                                setNodes(updated);
                                                            }}
                                                            className="w-full bg-white border-2 border-purple-200 rounded-xl p-4 font-black text-sm text-brand-blue min-h-[80px] outline-none focus:border-purple-500"
                                                            placeholder="رسالة الطلب (مثلاً: من فضلك أدخل اسمك وعنوانك...)"
                                                        />
                                                    </div>
                                                ) : node.type === 'create_order' ? (
                                                    <div className="py-6 px-4 bg-red-50 rounded-2xl border border-red-100 text-center">
                                                        <Package className="h-8 w-8 text-red-500 mx-auto mb-2" />
                                                        <h5 className="text-sm font-black text-red-700 mb-1">إتمام الطلب وخصم المخزن</h5>
                                                        <p className="text-[10px] text-red-600/70">سيقوم البوت بإنشاء سجل في المبيعات وخصم الكمية المطلوبة من كاشير بلس تلقائياً.</p>
                                                    </div>
                                                ) : (
                                                    <div className="py-4 text-center">
                                                        <p className="text-sm font-black text-amber-600">سيتم إيقاف الرد الآلي وتحويل الشات لموظف بشري فوراً.</p>
                                                    </div>
                                                )}

                                                {/* Options Builder - only for non-final nodes */}
                                                {node.type !== 'handover' && (
                                                    <div className="mt-4 space-y-3">
                                                        <p className="text-[10px] font-black text-brand-blue-alt/40 uppercase tracking-widest px-2">أزرار اختيار العميل (إن وجد)</p>
                                                        {(node.options || []).map((opt, optIndex) => (
                                                            <div key={opt.id} className="flex gap-3 items-center animate-in slide-in-from-right-2 duration-300">
                                                                <input
                                                                    value={opt.label}
                                                                    onChange={e => {
                                                                        const updated = [...nodes];
                                                                        updated[index].options![optIndex].label = e.target.value;
                                                                        setNodes(updated);
                                                                    }}
                                                                    className="flex-1 h-10 px-4 bg-white border-2 border-brand-beige rounded-xl text-xs font-bold focus:border-brand-green outline-none"
                                                                    placeholder="نص الزر..."
                                                                />
                                                                <select
                                                                    value={opt.nextNodeId}
                                                                    onChange={e => {
                                                                        const updated = [...nodes];
                                                                        updated[index].options![optIndex].nextNodeId = e.target.value;
                                                                        setNodes(updated);
                                                                    }}
                                                                    className="flex-1 h-10 px-4 bg-white border-2 border-brand-beige rounded-xl text-[10px] font-black"
                                                                >
                                                                    <option value="">-- اختر الخطوة التالية --</option>
                                                                    {nodes.filter(n => n.id !== node.id).map(n => (
                                                                        <option key={n.id} value={n.id}>
                                                                            {n.type === 'message' ? `الرسالة (${nodes.indexOf(n) + 1})` :
                                                                                n.type === 'handover' ? 'تحويل لموظف' :
                                                                                    n.type === 'product_lookup' ? 'سعر منتج' :
                                                                                        n.type === 'collect_data' ? 'تحصيل بيانات' : 'إنشاء طلب'}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <button onClick={() => {
                                                                    const updated = [...nodes];
                                                                    updated[index].options = updated[index].options?.filter(o => o.id !== opt.id);
                                                                    setNodes(updated);
                                                                }} className="text-red-400 p-2 hover:bg-white rounded-lg">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => {
                                                                const updated = [...nodes];
                                                                if (!updated[index].options) updated[index].options = [];
                                                                updated[index].options.push({ id: Math.random().toString(), label: 'خيار جديد', nextNodeId: '' });
                                                                setNodes(updated);
                                                            }}
                                                            className="w-full py-2 border-2 border-dashed border-brand-beige rounded-xl text-[10px] font-black text-brand-blue-alt/40 hover:bg-white hover:text-brand-green hover:border-brand-green/50 transition-all"
                                                        >
                                                            + إضافة خيار تفاعلي (رد فعل العميل)
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Default Next Step (Auto-advance) */}
                                                {node.type !== 'handover' && (!node.options || node.options.length === 0) && (
                                                    <div className="mt-4 pt-4 border-t border-brand-beige/30">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-[10px] font-black text-brand-blue-alt/40 uppercase tracking-widest px-2 flex items-center gap-2">
                                                                <Clock className="h-3 w-3" /> خطوة الانتقال (بعد {node.transitionType === 'input' ? 'رد العميل' : 'ثوانٍ'})
                                                            </p>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        const updated = [...nodes];
                                                                        updated[index].transitionType = node.transitionType === 'input' ? 'timeout' : 'input';
                                                                        setNodes(updated);
                                                                    }}
                                                                    className="text-brand-blue text-[8px] font-black bg-brand-off-white px-2 py-1 rounded-lg hover:bg-brand-blue hover:text-white transition-all"
                                                                >
                                                                    {node.transitionType === 'input' ? 'تبديل لتلقائي' : 'تبديل لانتظار رد'}
                                                                </button>
                                                                {node.defaultNextNodeId && (
                                                                    <button
                                                                        onClick={() => {
                                                                            const updated = [...nodes];
                                                                            updated[index].defaultNextNodeId = undefined;
                                                                            updated[index].transitionType = undefined;
                                                                            setNodes(updated);
                                                                        }}
                                                                        className="text-red-400 text-[8px] font-black"
                                                                    >
                                                                        إلغاء الانتقال
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <select
                                                            value={node.defaultNextNodeId || ''}
                                                            onChange={e => {
                                                                const updated = [...nodes];
                                                                updated[index].defaultNextNodeId = e.target.value;
                                                                setNodes(updated);
                                                            }}
                                                            className="w-full h-10 px-4 bg-brand-green/5 border-2 border-brand-green/10 rounded-xl text-[10px] font-black text-brand-green outline-none"
                                                        >
                                                            <option value="">-- اختر الخطوة التالية التلقائية --</option>
                                                            {nodes.filter(n => n.id !== node.id).map(n => (
                                                                <option key={n.id} value={n.id}>
                                                                    {n.type === 'message' ? `الرسالة (${nodes.indexOf(n) + 1})` :
                                                                        n.type === 'handover' ? 'تحويل لموظف' : 'سعر منتج'}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                        </div>
                    </div>

                    {/* Simulator Side Panel */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-[32px] border-2 border-brand-beige shadow-sm overflow-hidden sticky top-8">
                            <div className="p-4 bg-white border-b border-brand-beige flex justify-between items-center">
                                <div className="flex gap-2 bg-brand-off-white p-1 rounded-xl">
                                    <button
                                        onClick={() => setSimPlatform('whatsapp')}
                                        className={cn("p-2 rounded-lg transition-all", simPlatform === 'whatsapp' ? "bg-white shadow-sm text-green-600" : "text-brand-blue-alt/40 hover:text-green-600")}
                                        title="WhatsApp"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setSimPlatform('messenger')}
                                        className={cn("p-2 rounded-lg transition-all", simPlatform === 'messenger' ? "bg-white shadow-sm text-blue-600" : "text-brand-blue-alt/40 hover:text-blue-600")}
                                        title="Messenger"
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setSimPlatform('instagram')}
                                        className={cn("p-2 rounded-lg transition-all", simPlatform === 'instagram' ? "bg-white shadow-sm text-pink-600" : "text-brand-blue-alt/40 hover:text-pink-600")}
                                        title="Instagram"
                                    >
                                        <Instagram className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={resetSimulator} className="hover:bg-brand-off-white p-2 rounded-xl transition-colors text-brand-blue-alt/40 hover:text-brand-blue" title="إعادة تشغيل">
                                        <Zap className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className={cn(
                                "h-[500px] overflow-y-auto p-4 space-y-4 custom-scrollbar flex flex-col transition-colors duration-300",
                                simPlatform === 'whatsapp' ? "bg-[#efeae2]" :
                                    simPlatform === 'messenger' ? "bg-white" : "bg-white"
                            )}
                                style={simPlatform === 'whatsapp' ? { backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: '400px', backgroundBlendMode: 'multiply' } : {}}
                            >
                                {simMessages.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-60">
                                        {simPlatform === 'whatsapp' ? <MessageCircle className="h-12 w-12 text-brand-blue-alt/20 mb-3" /> :
                                            simPlatform === 'messenger' ? <MessageSquare className="h-12 w-12 text-brand-blue-alt/20 mb-3" /> :
                                                <Instagram className="h-12 w-12 text-brand-blue-alt/20 mb-3" />}

                                        <p className="text-xs font-bold text-brand-blue-alt">المحاكي جاهز ({simPlatform})</p>
                                        <p className="text-[10px] text-brand-blue-alt/60 mt-1 max-w-[180px]">اضغط على "تشغيل المحاكاة" لتجربة المسار</p>
                                        <Button className="mt-4 bg-brand-green text-white font-bold" onClick={runSimulator}>
                                            ابدأ المحادثة
                                        </Button>
                                    </div>
                                ) : (
                                    simMessages.map((msg, i) => (
                                        <div key={i} className={cn("flex flex-col max-w-[85%]", msg.sender === 'user' ? "self-end items-end" : "self-start items-start")}>
                                            {msg.isSystem ? (
                                                <div className="self-center my-2 bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[9px] font-bold border border-orange-200">
                                                    ⚡ {msg.text}
                                                </div>
                                            ) : (
                                                <>
                                                    <div className={cn(
                                                        "p-3 text-[11px] font-bold shadow-sm relative",
                                                        // WhatsApp Style
                                                        simPlatform === 'whatsapp' && (msg.sender === 'user' ? "bg-[#d9fdd3] text-black rounded-lg rounded-tr-none" : "bg-white text-black rounded-lg rounded-tl-none"),
                                                        // Messenger Style
                                                        simPlatform === 'messenger' && (msg.sender === 'user' ? "bg-[#0084ff] text-white rounded-2xl rounded-br-none" : "bg-[#f0f0f0] text-black rounded-2xl rounded-bl-none"),
                                                        // Instagram Style
                                                        simPlatform === 'instagram' && (msg.sender === 'user' ? "bg-[#3797f0] text-white rounded-3xl rounded-br-lg" : "bg-[#efefef] text-black rounded-3xl rounded-bl-lg")
                                                    )}>
                                                        {msg.text}
                                                        {/* WhatsApp Read Receipt Simulation */}
                                                        {simPlatform === 'whatsapp' && msg.sender === 'user' && (
                                                            <div className="absolute bottom-1 left-2">
                                                                <div className="flex">
                                                                    <div className="h-1 w-2 bg-blue-400/0" /> {/* Spacer */}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {msg.sender === 'bot' && msg.options && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {msg.options.map((opt: any, idx: number) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => handleSimOptionClick(opt)}
                                                                    className={cn(
                                                                        "px-3 py-1.5 text-[10px] font-bold transition-all shadow-sm active:scale-95",
                                                                        simPlatform === 'whatsapp' ? "bg-white text-[#00a884] border border-[#f0f0f0] rounded-full hover:bg-[#f0f0f0]" :
                                                                            simPlatform === 'messenger' ? "bg-white text-[#0084ff] border border-[#e5e5e5] rounded-full hover:bg-[#f0f0f0]" :
                                                                                "bg-white text-[#3797f0] border border-[#dbdbdb] rounded-lg hover:bg-[#fafafa]"
                                                                    )}
                                                                >
                                                                    {opt.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-3 bg-white border-t border-brand-beige flex items-center gap-2">
                                <input
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 h-10 text-xs font-bold focus:outline-none focus:border-brand-blue/30 transition-all placeholder:text-gray-400"
                                    placeholder="اكتب ردك هنا..."
                                    value={simInput}
                                    onChange={(e) => setSimInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && simInput) {
                                            handleSimReply(simInput);
                                            setSimInput('');
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        if (simInput) {
                                            handleSimReply(simInput);
                                            setSimInput('');
                                        }
                                    }}
                                    className="h-10 w-10 bg-brand-blue text-white rounded-xl flex items-center justify-center hover:bg-brand-blue-alt transition-colors shadow-lg shadow-brand-blue/20"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
