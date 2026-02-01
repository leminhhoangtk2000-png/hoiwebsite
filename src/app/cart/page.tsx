'use client'

import { useCartStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeItem, getSubtotal, clearCart } = useCartStore()
  const subtotal = getSubtotal()

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          <ShoppingBag className="h-24 w-24 mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-[#333333] mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link href="/">
            <Button className="bg-[#333333] text-white hover:bg-[#555555]">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <h1 className="text-3xl font-bold text-[#333333] mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="relative w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.productId}`}>
                    <h3 className="font-medium text-[#333333] mb-1 hover:underline">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-600 mb-2">
                    {item.variantDescription}
                  </p>
                  <p className="text-lg font-semibold text-[#333333] mb-1">
                    ${item.price.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * 25400)}
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-300 rounded">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="px-4 py-1 text-sm font-medium min-w-[3rem] text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Item Total */}
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-semibold text-[#333333]">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity * 25400)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24">
            <h2 className="text-xl font-bold text-[#333333] mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold text-[#333333]">
                  <span>Total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <Button
              className="w-full bg-[#333333] text-white hover:bg-[#555555] py-6 text-lg"
              onClick={() => router.push('/checkout')}
            >
              Proceed to Checkout
            </Button>
            <Link href="/" className="block mt-4 text-center text-sm text-gray-600 hover:text-[#333333]">
              Continue Shopping
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}

