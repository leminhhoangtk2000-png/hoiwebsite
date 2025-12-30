'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'

function ThankYouContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <Card className="p-8">
          <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-[#333333] mb-4">Thank You for Your Order!</h1>
          <p className="text-gray-600 mb-6">
            Your order has been received and is being processed.
          </p>
          {orderId && (
            <div className="bg-gray-50 p-4 rounded mb-6">
              <p className="text-sm text-gray-600 mb-1">Order ID</p>
              <p className="text-xl font-mono font-bold text-[#333333]">{orderId}</p>
            </div>
          )}
          <p className="text-sm text-gray-600 mb-8">
            We will send you a confirmation email shortly with your order details.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
            <Link href="/admin/orders">
              <Button className="bg-[#333333] text-white hover:bg-[#555555]">
                View Orders
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  )
}
