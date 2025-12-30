'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Check, ChevronRight } from 'lucide-react'

interface SiteSettings {
  payment_qr_url: string | null
  bank_info: string | null
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getSubtotal, clearCart } = useCartStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: ''
  })
  
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)

  const subtotal = getSubtotal()
  const discountAmount = (subtotal * couponDiscount) / 100
  const total = subtotal - discountAmount

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart')
      return
    }
    fetchSiteSettings()
  }, [items, router])

  async function fetchSiteSettings() {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('payment_qr_url, bank_info')
        .maybeSingle()

      if (error) throw error
      if (data) {
        setSiteSettings(data)
      }
    } catch (error) {
      console.error('Error fetching site settings:', error)
    }
  }

  async function applyCoupon() {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code')
      return
    }

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle()

      if (error || !data) {
        toast.error('Invalid or expired coupon code')
        return
      }

      setCouponDiscount(data.discount_percent)
      setAppliedCoupon(couponCode.toUpperCase())
      toast.success(`Coupon applied! ${data.discount_percent}% off`)
    } catch (error) {
      console.error('Error applying coupon:', error)
      toast.error('Failed to apply coupon')
    }
  }

  async function handleSubmitOrder() {
    if (step !== 4) return

    setLoading(true)
    try {
      // Step 1: Create customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          full_name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address
        })
        .select()
        .single()

      if (customerError) throw customerError

      // Step 2: Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: customer.id,
          status: 'pending',
          total_amount: total,
          coupon_code: appliedCoupon,
          discount_amount: discountAmount
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Step 3: Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        price: item.price,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        image_url: item.image
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Clear cart
      clearCart()

      // Redirect to thank you page
      router.push(`/checkout/thank-you?orderId=${order.id}`)
    } catch (error: any) {
      console.error('Error creating order:', error)
      toast.error(error.message || 'Failed to create order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Information' },
    { number: 2, title: 'Coupon' },
    { number: 3, title: 'Payment' },
    { number: 4, title: 'Confirm' }
  ]

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <h1 className="text-3xl font-bold text-[#333333] mb-8">Checkout</h1>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s.number
                      ? 'bg-[#333333] text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step > s.number ? <Check className="h-5 w-5" /> : s.number}
                </div>
                <span className="mt-2 text-sm text-gray-600">{s.title}</span>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="h-5 w-5 text-gray-400 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            {/* Step 1: Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-[#333333] mb-6">Shipping Information</h2>
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
                <Button
                  onClick={() => {
                    if (!formData.fullName || !formData.phone || !formData.email || !formData.address) {
                      toast.error('Please fill in all fields')
                      return
                    }
                    setStep(2)
                  }}
                  className="w-full bg-[#333333] text-white hover:bg-[#555555] mt-4"
                >
                  Continue to Coupon
                </Button>
              </div>
            )}

            {/* Step 2: Coupon */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-[#333333] mb-6">Apply Coupon</h2>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={!!appliedCoupon}
                  />
                  {!appliedCoupon ? (
                    <Button onClick={applyCoupon} className="bg-[#333333] text-white hover:bg-[#555555]">
                      Apply
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAppliedCoupon(null)
                        setCouponDiscount(0)
                        setCouponCode('')
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                {appliedCoupon && (
                  <p className="text-sm text-green-600">Coupon {appliedCoupon} applied: {couponDiscount}% off</p>
                )}
                <div className="flex gap-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="flex-1 bg-[#333333] text-white hover:bg-[#555555]"
                  >
                    Continue to Payment
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#333333] mb-6">Payment Information</h2>
                {siteSettings?.payment_qr_url && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">Scan QR code to pay</p>
                    <div className="relative w-64 h-64 mx-auto bg-gray-100 rounded overflow-hidden">
                      <img
                        src={siteSettings.payment_qr_url}
                        alt="Payment QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}
                {siteSettings?.bank_info && (
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-semibold text-[#333333] mb-2">Bank Transfer Details:</h3>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                      {siteSettings.bank_info}
                    </pre>
                  </div>
                )}
                {!siteSettings?.payment_qr_url && !siteSettings?.bank_info && (
                  <p className="text-gray-600">Payment information will be displayed here.</p>
                )}
                <div className="flex gap-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    className="flex-1 bg-[#333333] text-white hover:bg-[#555555]"
                  >
                    Continue to Confirm
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Confirm */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#333333] mb-6">Confirm Order</h2>
                <div className="bg-gray-50 p-4 rounded space-y-2">
                  <p><strong>Name:</strong> {formData.fullName}</p>
                  <p><strong>Phone:</strong> {formData.phone}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Address:</strong> {formData.address}</p>
                </div>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(3)}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmitOrder}
                    disabled={loading}
                    className="flex-1 bg-[#333333] text-white hover:bg-[#555555]"
                  >
                    {loading ? 'Processing...' : 'I have transferred money'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24">
            <h2 className="text-xl font-bold text-[#333333] mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({couponDiscount}%)</span>
                  <span className="font-medium">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold text-[#333333]">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p className="mb-2">Items in cart: {items.length}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

