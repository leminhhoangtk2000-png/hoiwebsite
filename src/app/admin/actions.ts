
'use server'

import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

// Note: We need a Service Role client for Admin operations (inviteUserByEmail)
// NEVER expose this key to the client.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function inviteAdmin(formData: FormData) {
    const email = formData.get('email') as string;

    if (!email) {
        return { error: 'Email is required' };
    }

    // 1. Security Check: Ensure the requester is an Admin
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (requesterProfile?.role !== 'admin') {
        return { error: 'Forbidden: Only Admins can invite other Admins.' };
    }

    // 2. Send Invitation via Supabase Admin API
    // We pass data: { role: 'admin' } so that our trigger (if we had one) or the logic 
    // knows this user is intended to be an admin. 
    // However, since `handle_new_user` relies on `raw_user_meta_data`, this is perfect.

    // Check if we need to update handle_new_user function to respect metadata role?
    // The current `handle_new_user` in `create_profiles_table.sql` pulls `full_name` and `avatar_url`.
    // It does NOT pull `role`. We might need to update the trigger function or manually update the profile after invite.

    // Creating user via Admin API
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
            role: 'admin', // This goes into raw_user_meta_data
            full_name: 'Admin User' // Default name
        }
    });

    if (error) {
        console.error('Error inviting admin:', error);
        return { error: error.message };
    }

    // 3. Manually ensure the profile has 'admin' role. 
    // The trigger `handle_new_user` might run, but it won't set the role column unless we updated the function.
    // So let's force update it here to be safe (if the user already existed or if the trigger defaults to 'user').
    // Note: If the user didn't exist, the trigger runs on INSERT to profiles.

    // Let's rely on the metadata + a small fix to the trigger function, OR just update it here.
    // Updating here is safer since the trigger runs asynchronously/concurrently typically, but in Postgres it's transactional within the request?
    // Actually, `inviteUserByEmail` creates the user in `auth.users`. The trigger fires. 
    // If the trigger `handle_new_user` inserts into `profiles` with default role 'user', we need to update it.

    if (data.user) {
        // Wait a moment for trigger? Or just update.
        // Since we are using Service Role, we can update `profiles` directly.
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', data.user.id);

        if (updateError) {
            console.error('Error setting admin role:', updateError);
            // Verify if profile exists yet?
        }
    }

    revalidatePath('/admin/settings/admins');
    return { success: true, message: `Invitation sent to ${email}` };
}

export async function removeAdmin(adminId: string) {
    // Similar security check
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };
    const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    if (requesterProfile?.role !== 'admin') return { error: 'Forbidden' };

    // Prevent removing yourself
    if (adminId === user.id) {
        return { error: 'You cannot remove your own admin access.' };
    }

    // Downgrade to 'user'
    const { error } = await supabase
        .from('profiles')
        .update({ role: 'user' })
        .eq('id', adminId);

    if (error) return { error: error.message };

    revalidatePath('/admin/settings/admins');
    return { success: true };
}
