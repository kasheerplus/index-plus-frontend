'use server';

import { createClient } from '@supabase/supabase-js';

export async function createTeamMember(
    authToken: string,
    formData: {
        email: string;
        password: string;
        full_name: string;
        role: 'admin' | 'agent' | 'supervisor';
    }
) {
    try {
        // Create admin client using service role key
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                }
            }
        );

        if (!authToken) {
            throw new Error('يجب تسجيل الدخول أولاً');
        }

        // Get user from token
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authToken);

        if (userError || !user) {
            console.error('Auth error:', userError);
            throw new Error('فشل التحقق من المستخدم');
        }

        // Get current user's company_id and role
        const { data: currentUserData, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('company_id, role')
            .eq('id', user.id)
            .single();

        if (fetchError || !currentUserData) {
            console.error('Fetch error:', fetchError);
            throw new Error('لم يتم العثور على بيانات المستخدم');
        }

        // Check permissions
        if (!['owner', 'admin'].includes(currentUserData.role)) {
            throw new Error('غير مصرح لك بإضافة أعضاء جدد');
        }

        // Create new user using admin API
        // Passing metadata here allows the database trigger (handle_new_user) 
        // to correctly populate public.users and link to the same company
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: formData.email,
            password: formData.password,
            email_confirm: true,
            user_metadata: {
                full_name: formData.full_name,
                company_id: currentUserData.company_id,
                role: formData.role
            }
        });

        if (createError) {
            console.error('Create error:', createError);
            throw createError;
        }

        if (!newUser.user) {
            throw new Error('فشل إنشاء الحساب');
        }

        return {
            success: true,
            user: {
                id: newUser.user.id,
                email: formData.email,
                full_name: formData.full_name,
                role: formData.role
            }
        };

    } catch (error: any) {
        console.error('Create team member error:', error);
        return {
            success: false,
            error: error.message || 'حدث خطأ أثناء إنشاء الحساب'
        };
    }
}

export async function deleteTeamMember(authToken: string, memberId: string) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        if (!authToken) throw new Error('يجب تسجيل الدخول أولاً');

        // Check if requester is owner/admin
        const { data: { user } } = await supabaseAdmin.auth.getUser(authToken);
        if (!user) throw new Error('فشل التحقق من الهوية');

        const { data: requester } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!requester || !['owner', 'admin'].includes(requester.role)) {
            throw new Error('غير مصرح لك بحذف أعضاء');
        }

        // Delete from auth.users (cascade will handle public.users)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(memberId);
        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('Delete member error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateTeamMember(
    authToken: string,
    memberId: string,
    updates: {
        full_name?: string;
        role?: 'admin' | 'agent' | 'supervisor';
        status?: 'active' | 'suspended';
    }
) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        if (!authToken) throw new Error('يجب تسجيل الدخول أولاً');

        const { data: { user } } = await supabaseAdmin.auth.getUser(authToken);
        if (!user) throw new Error('فشل التحقق من الهوية');

        const { data: requester } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!requester || !['owner', 'admin'].includes(requester.role)) {
            throw new Error('غير مصرح لك بتعديل بيانات الأعضاء');
        }

        // Update public.users
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update(updates)
            .eq('id', memberId);

        if (updateError) throw updateError;

        // If role changed, sync to auth.users metadata
        if (updates.role) {
            await supabaseAdmin.auth.admin.updateUserById(memberId, {
                user_metadata: { role: updates.role },
                app_metadata: { role: updates.role }
            });
        }

        return { success: true };
    } catch (error: any) {
        console.error('Update member error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateTeamMemberPassword(
    authToken: string,
    memberId: string,
    newPassword: string
) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        if (!authToken) throw new Error('يجب تسجيل الدخول أولاً');

        const { data: { user } } = await supabaseAdmin.auth.getUser(authToken);
        if (!user) throw new Error('فشل التحقق من الهوية');

        const { data: requester } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!requester || !['owner', 'admin'].includes(requester.role)) {
            throw new Error('غير مصرح لك بتغيير كلمات المرور');
        }

        const { error } = await supabaseAdmin.auth.admin.updateUserById(memberId, {
            password: newPassword
        });

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('Update password error:', error);
        return { success: false, error: error.message };
    }
}
