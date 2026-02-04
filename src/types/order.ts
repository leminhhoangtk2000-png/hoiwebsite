export interface OrderItem {
    id: string
    order_id: string
    product_id: string | null
    product_name: string
    quantity: number
    price: number
    color?: string | null
    size?: string | null
    image_url?: string | null
}

export interface Order {
    id: string
    user_id: string | null
    customer_id?: string
    total_amount: number
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
    created_at: string
    items?: OrderItem[]
}
