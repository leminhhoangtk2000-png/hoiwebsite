'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Trash2, Plus } from 'lucide-react'

interface Coupon {
  id: string
  code: string
  discount_percent: number
  is_active: boolean
  created_at: string
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ code: '', discount_percent: '' })

  useEffect(() => {
    fetchCoupons()
  }, [])

  async function fetchCoupons() {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCoupons(data || [])
    } catch (error: any) {
      console.error('Error fetching coupons:', error)
      toast.error(error.message || 'Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.code.trim() || !formData.discount_percent) {
      toast.error('Please fill in all fields')
      return
    }

    const discount = parseFloat(formData.discount_percent)
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      toast.error('Discount must be between 0 and 100')
      return
    }

    try {
      const { error } = await supabase
        .from('coupons')
        .insert({
          code: formData.code.toUpperCase().trim(),
          discount_percent: discount,
          is_active: true
        })

      if (error) throw error

      toast.success('Coupon added successfully!')
      setDialogOpen(false)
      setFormData({ code: '', discount_percent: '' })
      fetchCoupons()
    } catch (error: any) {
      console.error('Error adding coupon:', error)
      toast.error(error.message || 'Failed to add coupon')
    }
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error

      toast.success(`Coupon ${!currentStatus ? 'activated' : 'deactivated'}`)
      fetchCoupons()
    } catch (error: any) {
      console.error('Error updating coupon:', error)
      toast.error(error.message || 'Failed to update coupon')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this coupon?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Coupon deleted successfully!')
      fetchCoupons()
    } catch (error: any) {
      console.error('Error deleting coupon:', error)
      toast.error(error.message || 'Failed to delete coupon')
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#333333]">Coupons</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#333333] text-white hover:bg-[#555555]">
              <Plus className="h-4 w-4 mr-2" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Coupon</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">Coupon Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="WELCOME10"
                  required
                />
              </div>
              <div>
                <Label htmlFor="discount_percent">Discount Percentage *</Label>
                <Input
                  id="discount_percent"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                  placeholder="10.00"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Enter a value between 0 and 100</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#333333] text-white hover:bg-[#555555]">
                  Add Coupon
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {coupons.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600">No coupons found.</p>
          <p className="text-sm text-gray-500 mt-2">Click "Add Coupon" to get started.</p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-medium font-mono">{coupon.code}</TableCell>
                  <TableCell>{coupon.discount_percent}%</TableCell>
                  <TableCell>
                    <Button
                      variant={coupon.is_active ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleActive(coupon.id, coupon.is_active)}
                      className={coupon.is_active ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {new Date(coupon.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(coupon.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

