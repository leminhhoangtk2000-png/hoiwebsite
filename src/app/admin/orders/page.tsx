'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase-client'
import { toast } from 'sonner'
import { Eye, DollarSign, ShoppingCart, Download, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Order {
  id: string
  created_at: string
  status: 'pending' | 'paid' | 'shipped' | 'cancelled'
  total_amount: number
  coupon_code: string | null
  discount_amount: number
  customer: {
    full_name: string
    email: string
    phone: string
    address: string
  } | null
  order_items: { product_name: string; quantity: number }[]
}

interface OrderItem {
  product_name: string
  price: number
  color: string | null
  size: string | null
  quantity: number
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
}

const formatUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function AdminOrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false

    if (startDate) {
      const orderDate = new Date(order.created_at)
      const start = new Date(startDate)
      // Comparison: we want orders FROM the start date (inclusive)
      // new Date('YYYY-MM-DD') is UTC midnight. order.created_at is UTC.
      // So orderDate >= start works if start is truly midnight UTC of that day.
      // But let's be safe and normalized to simplified day comparison or just timestamp.
      if (orderDate < start) return false
    }

    if (endDate) {
      const orderDate = new Date(order.created_at)
      const end = new Date(endDate)
      // Set end date to end of that day (23:59:59.999)
      end.setHours(23, 59, 59, 999)

      // Fix for timezone offset issue with simple string construction?
      // Actually, input date gives YYYY-MM-DD. 
      // If we treat everything as UTC, new Date('2024-01-01') is 2024-01-01T00:00:00Z.
      // If I want to include the whole endDate, comparing < end (which is 23:59:59) covers it.
      if (orderDate > end) return false
    }
    return true
  })

  const stats = {
    totalRevenue: filteredOrders.filter(o => o.status === 'paid' || o.status === 'shipped').reduce((sum, o) => sum + o.total_amount, 0),
    totalOrders: filteredOrders.length
  }


  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(full_name, email, phone, address),
          order_items ( product_name, quantity )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const normalizedData = (data || []).map((order: any) => ({
        ...order,
        customer: Array.isArray(order.customer)
          ? (order.customer[0] || null)
          : order.customer || null
      }))

      setOrders(normalizedData)

      setOrders(normalizedData)

    } catch (error: any) {
      console.error('Error fetching orders:', error)
      toast.error(error.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  async function fetchOrderItems(orderId: string) {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)

      if (error) throw error
      setOrderItems(data || [])
    } catch (error: any) {
      console.error('Error fetching order items:', error)
      toast.error('Failed to load order items')
    }
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      toast.success('Order status updated')
      fetchOrders() // Refetch to update dashboard and table
    } catch (error: any) {
      console.error('Error updating order status:', error)
      toast.error(error.message || 'Failed to update order status')
    }
  }

  async function handleViewOrder(order: Order) {
    setSelectedOrder(order)
    setDialogOpen(true)
    await fetchOrderItems(order.id)
  }

  async function handleExportCSV() {
    setExporting(true);
    toast.info("Exporting data, please wait...");

    try {
      // For a real app, you might want to fetch ALL orders, not just the currently loaded ones.
      // This is a simplified example using the orders already in state.
      const dataToExport = orders;

      if (dataToExport.length === 0) {
        toast.warning("No data to export.");
        return;
      }

      const headers = [
        "Order ID", "Date", "Status", "Customer Name", "Customer Email", "Customer Phone",
        "Customer Address", "Total Amount (USD)", "Coupon Code", "Discount Amount (USD)"
      ];

      const csvRows = [headers.join(',')];

      dataToExport.forEach(order => {
        const row = [
          order.id,
          new Date(order.created_at).toISOString(),
          order.status,
          `"${order.customer?.full_name || 'N/A'}"`,
          order.customer?.email || '',
          order.customer?.phone || '',
          `"${order.customer?.address || 'N/A'}"`,
          order.total_amount,
          order.coupon_code || '',
          order.discount_amount || 0
        ];
        csvRows.push(row.join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Data exported successfully!");

    } catch (error: any) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export data.");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#333333] mb-8">Orders Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <div className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total Revenue</h3>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatUSD.format(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">From completed orders</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total Orders</h3>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold">+{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">Across all statuses</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-[#333333]">All Orders</h2>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-auto"
              placeholder="Start Date"
            />
            <span className="text-gray-500">-</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-auto"
              placeholder="End Date"
            />
            {(startDate || endDate) && (
              <Button variant="ghost" size="icon" onClick={() => { setStartDate(''); setEndDate(''); }}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button onClick={handleExportCSV} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exporting..." : "Export to CSV"}
          </Button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600">No orders found.</p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customer?.full_name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{order.customer?.email || ''}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate text-sm text-gray-500" title={order.order_items?.map(i => `${i.product_name} (${i.quantity})`).join(', ')}>
                      {order.order_items?.map(i => i.product_name).slice(0, 2).join(', ')}
                      {(order.order_items?.length || 0) > 2 && '...'}
                    </div>
                  </TableCell>
                  <TableCell>{formatUSD.format(order.total_amount)}</TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusChange(order.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-mono text-sm">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium">{selectedOrder.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{selectedOrder.customer?.full_name || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.customer?.email || ''}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.customer?.phone || ''}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">Shipping Address</p>
                <p className="font-medium">{selectedOrder.customer?.address || 'N/A'}</p>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Items:</p>
                <div className="space-y-2">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex gap-4 border-b pb-4 last:border-0">
                      <div className="h-16 w-16 bg-gray-100 rounded overflow-hidden flex-shrink-0 relative border border-gray-200">
                        {/* Assuming check_order_schema confirmed image_url exists in order_items. It should. */}
                        {/* Need to add image_url to OrderItem interface and fetch it in fetchOrderItems? */}
                        {/* fetchOrderItems selects '*'. OrderItem interface needs image_url? */}
                        {/* Wait, I updated OrderItem earlier? No. I need to update OrderItem too if I use it here. */}
                        {/* But this is using `orderItems` state, which comes from `fetchOrderItems`. */}
                        {/* I should check if `item` has `image_url`. */}
                        {(item as any).image_url ? (
                          <img src={(item as any).image_url} alt={item.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-[#333333]">{item.product_name}</p>
                            <p className="text-sm text-gray-500">
                              {[
                                item.color && `Color: ${item.color}`,
                                item.size && `Size: ${item.size}`
                              ].filter(Boolean).join(', ')}
                            </p>
                          </div>
                          <p className="font-medium">{formatUSD.format(item.price * item.quantity)}</p>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                {selectedOrder.coupon_code && (
                  <div className="flex justify-between text-sm mb-2">
                    <span>Discount ({selectedOrder.coupon_code})</span>
                    <span>-{formatUSD.format(selectedOrder.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatUSD.format(selectedOrder.total_amount)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
