'use client';

import { useState, useEffect } from 'react';
import {
    UserPlus,
    Shield,
    ShieldCheck,
    MoreVertical,
    UserMinus,
    UserCheck,
    Search,
    Loader2,
    Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { SettingsHeader } from '@/components/settings/settings-header';
import { InviteMemberModal } from '@/components/team/invite-member-modal';
import { PermissionsModal } from '@/components/team/permissions-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-permissions';

interface Member {
    id: string;
    full_name: string;
    role: 'owner' | 'admin' | 'agent' | 'supervisor';
    status: 'active' | 'suspended';
    permissions: any;
    created_at: string;
}

export default function TeamPage() {
    const { can, isLoading: permissionsLoading } = usePermissions();
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) {
                console.warn('Error fetching team members:', error.message);
                // If table doesn't exist, show empty list
                setMembers([]);
            } else {
                setMembers(data as Member[] || []);
            }
        } catch (err) {
            console.warn('Failed to fetch team members, table may not exist yet:', err);
            setMembers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        try {
            const { error } = await supabase
                .from('users')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            setMembers(members.map(m => m.id === id ? { ...m, status: newStatus as any } : m));

            // --- AUDIT LOG ---
            try {
                const { data: { user } } = await supabase.auth.getUser();
                await supabase.from('audit_logs').insert([{
                    company_id: user?.app_metadata?.company_id,
                    user_id: user?.id,
                    action: 'update',
                    entity_type: 'member',
                    entity_id: id,
                    new_data: { status: newStatus }
                }]);
            } catch (auditErr) { console.warn('Audit Log failed:', auditErr); }

        } catch (err) {
            console.error(err);
            alert('حدث خطأ أثناء تحديث الحالة');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-right font-cairo" dir="rtl">
            <div className="bg-white rounded-[32px] p-8 border-2 border-brand-beige shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-brand-blue text-white flex items-center justify-center shadow-lg shadow-brand-blue/20">
                        <Users className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-brand-blue">إدارة الفريق</h1>
                        <p className="text-sm text-brand-blue-alt/60 font-bold mt-1">إضافة وإدارة موظفي المبيعات والمدراء</p>
                    </div>
                </div>
            </div>

            {showInviteModal && (
                <InviteMemberModal
                    onClose={() => setShowInviteModal(false)}
                    onSuccess={() => fetchTeam()}
                />
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {can('manage_team') && (
                    <Button
                        className="h-14 px-8 font-black gap-3 shadow-xl shadow-brand-green/20 bg-brand-green hover:bg-brand-green-alt rounded-2xl"
                        onClick={() => setShowInviteModal(true)}
                    >
                        <UserPlus className="h-6 w-6" />
                        إضافة عضو للفريق
                    </Button>
                )}
            </div>

            <div className="bg-white rounded-[32px] border-2 border-brand-beige shadow-sm overflow-hidden">
                <div className="p-8 border-b-2 border-brand-off-white bg-white/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-blue-alt/30" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="بحث عن عضو في الفريق..."
                            className="w-full bg-brand-off-white/80 border-2 border-brand-beige rounded-2xl py-3.5 pr-12 pl-4 text-sm font-bold text-brand-blue focus:border-brand-green transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    {isLoading ? (
                        <div className="space-y-4 p-6">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-[180px]" />
                                        <Skeleton className="h-3 w-[120px]" />
                                    </div>
                                    <Skeleton className="h-8 w-20" />
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    ) : members.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Users className="h-16 w-16 text-gray-100 mb-4" />
                            <h3 className="text-lg font-black text-navy">لا يوجد أعضاء بعد</h3>
                        </div>
                    ) : (
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-brand-off-white/50 text-brand-blue-alt/60 text-[11px] font-black uppercase tracking-widest border-b-2 border-brand-off-white">
                                    <th className="px-8 py-5">العضو</th>
                                    <th className="px-8 py-5">الصلاحية</th>
                                    <th className="px-8 py-5">الحالة</th>
                                    <th className="px-8 py-5 text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-brand-off-white">
                                {members
                                    .filter(m => m.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-all group border-b border-gray-50 last:border-0">
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-full bg-brand-blue/5 flex items-center justify-center font-black text-brand-blue border-2 border-brand-beige uppercase text-lg">
                                                        {user.full_name?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-black text-brand-blue">{user.full_name}</p>
                                                        <p className="text-[11px] text-brand-blue-alt/40 font-black font-number uppercase tracking-tighter">{user.id.split('-')[0]}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-lg flex items-center justify-center",
                                                        user.role === 'owner' ? "bg-amber-50 text-amber-500 border border-amber-100" : "bg-brand-green/10 text-brand-green border border-brand-green/20"
                                                    )}>
                                                        {user.role === 'owner' ? <ShieldCheck className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                                                    </div>
                                                    <span className={cn(
                                                        "text-sm font-black transition-colors uppercase tracking-tight",
                                                        user.role === 'owner' ? "text-amber-600" : "text-brand-blue"
                                                    )}>
                                                        {user.role === 'owner' ? 'مالك المشروع' : user.role === 'admin' ? 'مدير عام' : 'موظف مبيعات'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <span className={cn(
                                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                                    user.status === 'active' ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                                                )}>
                                                    {user.status === 'active' ? 'حساب نشط' : 'حساب معطل'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {can('manage_team') && user.role !== 'owner' ? (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                className="h-9 w-9 p-0 text-brand-green hover:bg-brand-green/10 rounded-xl transition-all border border-transparent hover:border-brand-green/20"
                                                                onClick={() => setSelectedMember(user)}
                                                                title="تعديل الصلاحيات"
                                                            >
                                                                <Shield className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                className={cn(
                                                                    "h-9 w-9 p-0 rounded-xl transition-all border border-transparent",
                                                                    user.status === 'active'
                                                                        ? "text-red-500 hover:bg-red-50 hover:border-red-100"
                                                                        : "text-green-500 hover:bg-green-50 hover:border-green-100"
                                                                )}
                                                                onClick={() => toggleStatus(user.id, user.status)}
                                                                title={user.status === 'active' ? 'تعطيل الحساب' : 'تنشيط الحساب'}
                                                            >
                                                                {user.status === 'active' ? <UserMinus className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-brand-blue-alt/30 font-bold">—</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {selectedMember && (
                <PermissionsModal
                    member={selectedMember}
                    onClose={() => setSelectedMember(null)}
                    onSuccess={() => fetchTeam()}
                />
            )}
        </div>
    );
}
