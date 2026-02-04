import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { UserDashboard } from './UserDashboard'

export default async function AccountPage() {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

    // Fetch orders
    const { getUserOrders } = await import('./order.actions')
    const orders = await getUserOrders()

    return <UserDashboard profile={profile} email={user.email} orders={orders} />
}
