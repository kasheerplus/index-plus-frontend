'use client';

import { useState } from 'react';
import {
    X,
    Shield,
    Check,
    Lock,
    Eye,
    Trash2,
    MessageSquare,
    DollarSign,
    Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface PermissionsModalProps {
    member: {
        id: string;
        full_name: string;
        role: string;
        permissions: any;
    };
    onClose: () => void;
    onSuccess: () => void;
}

const PERMISSION_GROUPS = [
    {
        id: 'inbox',
        label: 'صندوق الوارد',
        icon: MessageSquare,
        permissions: [
            { id: 'view_all_chats', label: 'رؤية كافة المحادثات' },
            { id: 'delete_messages', label: 'حذف الرسائل' },
            { id: 'manage_quick_replies', label: 'إدارة الردود السريعة' },
        ]
    },
    {
        id: 'sales',
        label: 'المبيعات والمالية',
        icon: DollarSign,
        permissions: [
            { id: 'create_sales', label: 'إنشاء عمليات بيع' },
            { id: 'view_analytics', label: 'رؤية التقارير والتحليلات' },
            { id: 'manage_billing', label: 'إدارة الاشتراك والفوترة' },
        ]
    },
    {
        id: 'team',
        label: 'الفريق والإعدادات',
        icon: Users,
        permissions: [
            { id: 'manage_team', label: 'إدارة أعضاء الفريق' },
            { id: 'manage_channels', label: 'إدارة القنوات' },
            { id: 'view_audit_logs', label: 'رؤية سجلات الأمان' },
        ]
    }
];

export function PermissionsModal({ member, onClose, onSuccess }: PermissionsModalProps) {
    const [permissions, setPermissions] = useState<any>(member.permissions || {});
    const [isSaving, setIsSaving] = useState(false);

    const togglePermission = (id: string) => {
        setPermissions((prev: any) => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ permissions })
                .eq('id', member.id);

            if (error) throw error;
            toast.success('تم تحديث الصلاحيات بنجاح');
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('حدث خطأ أثناء حفظ الصلاحيات');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm font-cairo">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-8 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Shield className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-navy leading-tight">صلاحيات المستخدم</h2>
                            <p className="text-sm font-bold text-gray-500 mt-1">{member.full_name} • {member.role === 'admin' ? 'مدير' : 'موظف'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                        <X className="h-6 w-6 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {member.role === 'owner' ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Lock className="h-12 w-12 text-amber-500 mb-4" />
                            <h3 className="text-xl font-black text-navy mb-2">المالك لديه كافة الصلاحيات</h3>
                            <p className="text-gray-400 font-bold">لا يمكن تعديل صلاحيات المالك الافتراضية</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {PERMISSION_GROUPS.map((group) => (
                                <div key={group.id} className="space-y-4">
                                    <div className="flex items-center gap-2 text-navy">
                                        <group.icon className="h-5 w-5 opacity-50" />
                                        <h3 className="font-black">{group.label}</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {group.permissions.map((perm) => (
                                            <button
                                                key={perm.id}
                                                onClick={() => togglePermission(perm.id)}
                                                className={cn(
                                                    "flex items-center justify-between p-4 rounded-2xl border transition-all text-right",
                                                    permissions[perm.id]
                                                        ? "bg-primary/5 border-primary/20 ring-1 ring-primary/10"
                                                        : "bg-white border-gray-100 hover:border-gray-200"
                                                )}
                                            >
                                                <span className={cn(
                                                    "text-sm font-bold",
                                                    permissions[perm.id] ? "text-primary" : "text-gray-600"
                                                )}>
                                                    {perm.label}
                                                </span>
                                                <div className={cn(
                                                    "h-5 w-5 rounded-md flex items-center justify-center transition-all",
                                                    permissions[perm.id] ? "bg-primary text-white" : "bg-gray-100"
                                                )}>
                                                    {permissions[perm.id] && <Check className="h-3 w-3" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <Button variant="ghost" className="h-12 px-8 font-black rounded-2xl" onClick={onClose}>
                        إلغاء
                    </Button>
                    <Button
                        className="h-12 px-12 font-black rounded-2xl bg-navy hover:bg-navy/90 text-white shadow-xl shadow-navy/20"
                        onClick={handleSave}
                        disabled={isSaving || member.role === 'owner'}
                    >
                        {isSaving ? 'جارِ الحفظ...' : 'حفظ الصلاحيات'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
