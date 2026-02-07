import {
    LayoutTemplate,
    ShoppingCart,
    Headphones,
    Info,
    Calendar,
    Navigation,
    Store,
    Utensils,
    Briefcase,
    Building2,
    Tag,
    Zap
} from 'lucide-react';

export interface FlowNode {
    id: string;
    type: 'message' | 'question' | 'handover' | 'product_lookup' | 'crm_tag' | 'time_condition' | 'collect_data' | 'create_order';
    content: string;
    metadata?: any;
    options?: { id: string; label: string; nextNodeId: string }[];
    defaultNextNodeId?: string;
}

export interface FlowTemplate {
    id: string;
    name: string;
    category: string;
    description: string;
    icon: any;
    isDefault?: boolean;
    requiresKasheer?: boolean;
    flow_data: {
        nodes: FlowNode[];
        startNodeId: string;
    };
}

export const FLOW_TEMPLATES: FlowTemplate[] = [
    // 1. Core Menus
    {
        id: 'tpl-main-menu',
        name: 'القائمة الرئيسية',
        category: 'Core Menus',
        description: 'نقطة الانطلاق لعملائك للوصول لكل خدماتك',
        icon: LayoutTemplate,
        isDefault: true,
        flow_data: {
            startNodeId: 'node-1',
            nodes: [
                {
                    id: 'node-1',
                    type: 'message',
                    content: 'مرحباً بك في إندكس بلص! كيف يمكننا مساعدتك اليوم؟',
                    options: [
                        { id: 'opt-1', label: '🛍️ تصفح المنتجات', nextNodeId: 'node-2' },
                        { id: 'opt-2', label: '📦 متابعة طلب', nextNodeId: 'node-3' },
                        { id: 'opt-3', label: '💬 التحدث مع موظف', nextNodeId: 'node-4' }
                    ]
                },
                { id: 'node-2', type: 'message', content: 'جارٍ عرض الأقسام والمنتجات المتاحة...' },
                { id: 'node-3', type: 'handover', content: 'تحويل للموظف لمتابعة طلبك...' },
                { id: 'node-4', type: 'handover', content: 'تحويل للموظف' }
            ]
        }
    },
    {
        id: 'tpl-back',
        name: 'رجوع',
        category: 'Navigation UX',
        description: 'زر سريع للعودة للخطوة السابقة',
        icon: Navigation,
        isDefault: true,
        flow_data: {
            startNodeId: 'node-1',
            nodes: [
                { id: 'node-1', type: 'message', content: 'الرجوع للقائمة السابقة...' }
            ]
        }
    },
    {
        id: 'tpl-talk-agent',
        name: 'تحدث مع موظف',
        category: 'Support & Contact',
        description: 'تحويل مباشر للمحادثة البشرية',
        icon: Headphones,
        isDefault: true,
        flow_data: {
            startNodeId: 'node-1',
            nodes: [
                { id: 'node-1', type: 'handover', content: 'جاري تحويلك لأحد ممثلي الخدمة...' }
            ]
        }
    },
    // Sales & Orders
    {
        id: 'tpl-order-now',
        name: 'اطلب الآن',
        category: 'Sales & Orders',
        description: 'مسار سريع لبدء عملية الشراء',
        icon: ShoppingCart,
        flow_data: {
            startNodeId: 'node-1',
            nodes: [
                {
                    id: 'node-1', type: 'message', content: 'أهلاً بك! ماذا تود أن تطلب اليوم؟', options: [
                        { id: 'opt-1', label: '🛒 تصفح المنتجات', nextNodeId: 'node-2' },
                        { id: 'opt-2', label: '⚡ طلب سريع برقم الصنف', nextNodeId: 'node-3' }
                    ]
                },
                { id: 'node-2', type: 'message', content: 'إليك قائمة بمنتجاتنا المميزة:' },
                { id: 'node-3', type: 'message', content: 'من فضلك أدخل كود المنتج (SKU):' }
            ]
        }
    },
    // Information
    {
        id: 'tpl-faq',
        name: 'الأسئلة الشائعة',
        category: 'Information & Legal',
        description: 'إجابات سريعة على تساؤلات العملاء المتكررة',
        icon: Info,
        flow_data: {
            startNodeId: 'node-1',
            nodes: [
                {
                    id: 'node-1', type: 'message', content: 'إليك إجابات لأكثر الأسئلة تكراراً:', options: [
                        { id: 'opt-1', label: '🚚 مواعيد التوصيل', nextNodeId: 'node-2' },
                        { id: 'opt-2', label: '💳 طرق الدفع', nextNodeId: 'node-3' },
                        { id: 'opt-3', label: '🔄 سياسة الاستبدال', nextNodeId: 'node-4' }
                    ]
                },
                { id: 'node-2', type: 'message', content: 'التوصيل يستغرق من 2-5 أيام عمل حسب محافظتك.' },
                { id: 'node-3', type: 'message', content: 'نقبل الدفع نقداً عند الاستلام، أو ببطاقات الائتمان، وفودافون كاش.' },
                { id: 'node-4', type: 'message', content: 'يمكنك الاستبدال خلال 14 يوم من استلام الطلب بشرط وجود الغلاف الأصلي.' }
            ]
        }
    },
    // Services
    {
        id: 'tpl-booking',
        name: 'حجز موعد',
        category: 'Services & Bookings',
        description: 'تسهيل حجز المواعيد والخدمات',
        icon: Calendar,
        flow_data: {
            startNodeId: 'node-1',
            nodes: [
                {
                    id: 'node-1', type: 'message', content: 'تفضل باختيار القسم الذي تود الحجز فيه:', options: [
                        { id: 'opt-1', label: '📅 حجز كشف', nextNodeId: 'node-2' },
                        { id: 'opt-2', label: '🔬 حجز استشارة', nextNodeId: 'node-2' }
                    ]
                },
                { id: 'node-2', type: 'message', content: 'من فضلكم أرسلوا الاسم بالكامل ورقم الهاتف لتأكيد الحجز.' }
            ]
        }
    },
    {
        id: 'tpl-products',
        name: 'تصفح المنتجات / الخدمات',
        category: 'Core Menus',
        description: 'عرض الكتالوج الخاص بك بطريقة تفاعلية',
        icon: Store,
        flow_data: {
            startNodeId: 'node-1',
            nodes: [
                {
                    id: 'node-1', type: 'message', content: 'إليك أقسامنا الرئيسية، اختر ما تود تصفحه:', options: [
                        { id: 'opt-1', label: '👕 الملابس', nextNodeId: 'node-2' },
                        { id: 'opt-2', label: '👟 الأحذية', nextNodeId: 'node-2' },
                        { id: 'opt-3', label: '🎒 الإكسسوارات', nextNodeId: 'node-2' }
                    ]
                },
                { id: 'node-2', type: 'message', content: 'جارٍ جلب المنتجات من المخزن... يمكنك الضغط على أي منتج للتفاصيل.' }
            ]
        }
    },
    {
        id: 'tpl-customer-service',
        name: 'خدمة العملاء',
        category: 'Support & Contact',
        description: 'مساعدة العملاء في استفساراتهم العامة',
        icon: Headphones,
        flow_data: {
            startNodeId: 'node-1',
            nodes: [
                {
                    id: 'node-1', type: 'message', content: 'كيف يمكن لفريق خدمة العملاء مساعدتك؟', options: [
                        { id: 'opt-1', label: '💳 استفسار عن الدفع', nextNodeId: 'node-2' },
                        { id: 'opt-2', label: '📝 تعديل بيانات طلب', nextNodeId: 'node-3' },
                        { id: 'opt-3', label: '🆘 مساعدة تقنية', nextNodeId: 'node-4' }
                    ]
                },
                { id: 'node-2', type: 'message', content: 'نقبل جميع وسائل الدفع الإلكتروني والنقدي.' },
                { id: 'node-3', type: 'handover', content: 'تحويل للموظف لتعديل بيانات طلبك...' },
                { id: 'node-4', type: 'message', content: 'يرجى وصف المشكلة التقنية التي تواجهك بالتفصيل.' }
            ]
        }
    },
    {
        id: 'tpl-order-tracking',
        name: 'متابعة الطلب',
        category: 'Sales & Orders',
        description: 'تتبع حالة الشحن بالربط مع نظام كاشير',
        icon: Tag,
        requiresKasheer: true,
        flow_data: {
            startNodeId: 'node-1',
            nodes: [
                { id: 'node-1', type: 'message', content: 'من فضلك أدخل رقم الطلب الخاص بك لمتابعته:' },
                { id: 'node-2', type: 'handover', content: 'تحويل للموظف ليعطيك حالة طلبك الحالية...' }
            ]
        }
    },
    {
        id: 'tpl-best-selling',
        name: 'الأكثر مبيعًا',
        category: 'Core Menus',
        description: 'عرض المنتجات الأكثر طلباً في متجرك',
        icon: Zap,
        requiresKasheer: true,
        flow_data: {
            startNodeId: 'node-1',
            nodes: [
                { id: 'node-1', type: 'message', content: 'إليك قائمة المنتجات الأكثر طلباً اليوم حسب إحصائيات كاشير بلس:' }
            ]
        }
    },
    {
        id: 'tpl-order-transaction',
        name: 'إكمال عملية بيع',
        category: 'Sales & Orders',
        description: 'تحصيل البيانات وحجز المنتج من المخزن',
        icon: ShoppingCart,
        requiresKasheer: true,
        flow_data: {
            startNodeId: 'node-1',
            nodes: [
                {
                    id: 'node-1',
                    type: 'collect_data',
                    content: 'من فضلك أدخل البيانات التالية لإكمال الطلب:',
                    metadata: { fields: ['name', 'phone', 'address', 'size', 'color'] },
                    defaultNextNodeId: 'node-2'
                },
                {
                    id: 'node-2',
                    type: 'create_order',
                    content: 'جارٍ حجز المنتج وإصدار رقم الفاتورة...',
                    defaultNextNodeId: 'node-3'
                },
                { id: 'node-3', type: 'message', content: 'لقد تم تسجيل طلبك بنجاح! رقم طلبك هو: #{{order_id}}' }
            ]
        }
    }
];

export const CATEGORIES = [
    { id: 'Core Menus', name: 'القوائم الأساسية', icon: LayoutTemplate },
    { id: 'Sales & Orders', name: 'البيع والطلبات', icon: ShoppingCart },
    { id: 'Support & Contact', name: 'الدعم والتواصل', icon: Headphones },
    { id: 'Information & Legal', name: 'المعلومات والسياسات', icon: Info },
    { id: 'Services & Bookings', name: 'الخدمات والحجوزات', icon: Calendar },
    { id: 'Navigation UX', name: 'التنقل (UX)', icon: Navigation },
    { id: 'Specific Activities', name: 'أنشطة متخصصة', icon: Store }
];

export const ACTIVITY_GROUPS = [
    { title: 'قائمة متجر إلكتروني', icon: Store, templateIds: ['tpl-order-now', 'tpl-faq'] },
    { title: 'قائمة مطعم', icon: Utensils, templateIds: ['tpl-order-now', 'tpl-booking'] },
    { title: 'قائمة خدمات', icon: Briefcase, templateIds: ['tpl-booking', 'tpl-faq'] },
    { title: 'قائمة شركة', icon: Building2, templateIds: ['tpl-faq', 'tpl-talk-agent'] }
];
