import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function getStats() {
  const supabase = await createServerSupabaseClient()
  const [productsResult, ordersResult, customersResult] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('customers').select('id', { count: 'exact', head: true }),
  ])

  return {
    products: productsResult.count || 0,
    orders: ordersResult.count || 0,
    customers: customersResult.count || 0,
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#333333] mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Products</h3>
          <p className="text-3xl font-bold text-[#333333]">{stats.products}</p>
          <Link href="/admin/products" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            View all →
          </Link>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-[#333333]">{stats.orders}</p>
          <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            View all →
          </Link>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Customers</h3>
          <p className="text-3xl font-bold text-[#333333]">{stats.customers}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-[#333333] mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/admin/products">
            <Button variant="outline">Manage Products</Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="outline">View Orders</Button>
          </Link>
          <Link href="/admin/categories">
            <Button variant="outline">Manage Categories</Button>
          </Link>
          <Link href="/admin/coupons">
            <Button variant="outline">Manage Coupons</Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="outline">Site Settings</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

