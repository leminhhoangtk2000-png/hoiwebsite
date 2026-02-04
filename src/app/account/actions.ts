'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Not authenticated' }
    }

    const full_name = formData.get('full_name') as string
    const phone = formData.get('phone') as string
    const gender = formData.get('gender') as string
    const address = formData.get('address') as string
    const date_of_birth = formData.get('date_of_birth') as string // Handle date conversion if needed

    const updates = {
        id: user.id,
        full_name,
        phone,
        gender,
        address,
        date_of_birth: date_of_birth || null,
        updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('profiles').upsert(updates)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/account')
    return { success: true, message: 'Profile updated successfully' }
}

export async function updatePassword(formData: FormData) {
    const supabase = await createServerSupabaseClient()
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
        return { error: "Passwords do not match" }
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
        return { error: error.message }
    }

    return { success: true, message: "Password updated successfully" }
}

export async function signOut() {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut()
}
