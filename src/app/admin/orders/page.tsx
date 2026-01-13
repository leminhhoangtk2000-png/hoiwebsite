'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Eye, DollarSign, ShoppingCart, Download } from 'lucide-react'

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
}

interface OrderItem {
  product_name: string
  price: number
  color: string
  size: string
  quantity: number
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
}

const formatUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({ totalRevenue: 0, totalOrders: 0 });


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
          customer:customers(full_name, email, phone, address)
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

      // Calculate dashboard stats
      const totalRevenue = normalizedData
        .filter(order => order.status === 'paid' || order.status === 'shipped')
        .reduce((sum, order) => sum + order.total_amount, 0);
      
      const totalOrders = normalizedData.length;
      
      setDashboardStats({ totalRevenue, totalOrders });

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
              <div className="text-2xl font-bold">{formatUSD.format(dashboardStats.totalRevenue)}</div>
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
              <div className="text-2xl font-bold">+{dashboardStats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">Across all statuses</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#333333]">All Orders</h2>
        <Button onClick={handleExportCSV} disabled={exporting}>
          <Download className="h-4 w-4 mr-2"/>
          {exporting ? "Exporting..." : "Export to CSV"}
        </Button>
      </div>

      {orders.length === 0 ? (
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
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customer?.full_name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{order.customer?.email || ''}</div>
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
                    <div key={index} className="flex justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-gray-500">
                          {item.color} / {item.size} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">{formatUSD.format(item.price * item.quantity)}</p>
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
