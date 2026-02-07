'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, UserMinus, UserCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { InviteMemberModal } from '@/components/team/invite-member-modal';
import { EditMemberModal } from '@/components/team/edit-member-modal';

interface TeamMember {
    id: string;
    full_name: string;
    role: 'owner' | 'admin' | 'agent' | 'supervisor';
    status: 'active' | 'suspended';
    created_at: string;
}

export default function TeamPage() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState<string>('owner');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

    useEffect(() => {
        fetchTeam();
        fetchCurrentUserRole();
    }, []);

    const fetchCurrentUserRole = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (data) setCurrentUserRole(data.role);
            }
        } catch (err) {
            console.warn('Could not fetch user role:', err);
        }
    };

    const fetchTeam = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: true });

            if (!error && data) {
                setMembers(data);
            }
        } catch (err) {
            console.warn('Could not fetch team:', err);
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

            if (!error) {
                setMembers(members.map(m =>
                    m.id === id ? { ...m, status: newStatus as any } : m
                ));
            }
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            owner: 'مالك المشروع',
            admin: 'مدير عام',
            supervisor: 'مشرف',
            agent: 'موظف مبيعات'
        };
        return labels[role] || role;
    };

    return (
        <div className="p-8 space-y-8 bg-brand-off-white min-h-screen font-cairo text-right" dir="rtl">
            {/* Header */}
            <div className="bg-white rounded-[32px] p-8 border-2 border-brand-beige shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-brand-green text-white flex items-center justify-center shadow-lg shadow-brand-green/20">
                            <Users className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-brand-blue">إدارة الفريق</h1>
                            <p className="text-sm text-brand-blue-alt/60 font-bold mt-1">
                                إدارة أعضاء الفريق وصلاحياتهم
                            </p>
                        </div>
                    </div>

                    {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                        <Button
                            onClick={() => setShowInviteModal(true)}
                            className="h-14 px-8 font-black gap-3 shadow-xl shadow-brand-green/20 bg-brand-green hover:bg-brand-green-alt rounded-2xl"
                        >
                            <UserPlus className="h-6 w-6" />
                            إضافة عضو جديد
                        </Button>
                    )}
                </div>
            </div>

            {/* Team Members */}
            <div className="bg-white rounded-[32px] border-2 border-brand-beige shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center p-20">
                        <Loader2 className="h-10 w-10 text-brand-green animate-spin" />
                    </div>
                ) : members.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Users className="h-16 w-16 text-gray-100 mb-4" />
                        <h3 className="text-lg font-black text-brand-blue">لا يوجد أعضاء بعد</h3>
                        <p className="text-sm text-brand-blue-alt/50 font-bold mt-2">
                            ابدأ بإضافة أعضاء الفريق
                        </p>
                    </div>
                ) : (
                    <div className="divide-y-2 divide-brand-off-white">
                        {members.map((member) => (
                            <div key={member.id} className="p-6 hover:bg-brand-off-white/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    {/* Member Info */}
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-full bg-brand-blue/5 flex items-center justify-center font-black text-brand-blue border-2 border-brand-beige uppercase text-xl">
                                            {member.full_name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-brand-blue">
                                                {member.full_name}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className={cn(
                                                    "text-sm font-bold",
                                                    member.role === 'owner' ? "text-amber-600" : "text-brand-blue-alt/60"
                                                )}>
                                                    {getRoleLabel(member.role)}
                                                </span>
                                                <span className="text-brand-blue-alt/30">•</span>
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-xs font-black",
                                                    member.status === 'active'
                                                        ? "bg-green-50 text-green-600"
                                                        : "bg-red-50 text-red-600"
                                                )}>
                                                    {member.status === 'active' ? 'نشط' : 'معطل'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {(currentUserRole === 'owner' || currentUserRole === 'admin') && member.role !== 'owner' && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                onClick={() => setSelectedMember(member)}
                                                className="h-10 px-4 gap-2 text-brand-green hover:bg-brand-green/10 rounded-xl font-bold"
                                            >
                                                <Shield className="h-4 w-4" />
                                                إدارة
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    "h-10 w-10 p-0 rounded-xl",
                                                    member.status === 'active'
                                                        ? "text-red-500 hover:bg-red-50"
                                                        : "text-green-500 hover:bg-green-50"
                                                )}
                                                onClick={() => toggleStatus(member.id, member.status)}
                                                title={member.status === 'active' ? 'تعطيل الحساب' : 'تنشيط الحساب'}
                                            >
                                                {member.status === 'active' ? (
                                                    <UserMinus className="h-5 w-5" />
                                                ) : (
                                                    <UserCheck className="h-5 w-5" />
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Invite Member Modal */}
            {showInviteModal && (
                <InviteMemberModal
                    onClose={() => setShowInviteModal(false)}
                    onSuccess={() => {
                        // Small delay to allow trigger to complete
                        setTimeout(fetchTeam, 1000);
                        setShowInviteModal(false);
                    }}
                />
            )}

            {/* Edit Member Modal */}
            {selectedMember && (
                <EditMemberModal
                    member={selectedMember}
                    onClose={() => setSelectedMember(null)}
                    onSuccess={() => {
                        fetchTeam();
                        setSelectedMember(null);
                    }}
                />
            )}
        </div>
    );
}
