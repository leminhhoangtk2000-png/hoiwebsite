'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Order, OrderItem } from '@/types/order'

export async function getUserOrders() {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    // Fetch orders with their items
    // Note: This relies on Supabase detecting the foreign key from order_items.order_id -> orders.id
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      items:order_items(*)
    `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching orders:', error)
        return []
    }

    // Cast the data to our Order type
    return (data || []) as Order[]
}

export async function getOrderDetails(orderId: string) {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      items:order_items(*)
    `)
        .eq('id', orderId)
        .single()

    if (error) {
        console.error('Error fetching order details:', error)
        return null
    }

    return data as Order
}
