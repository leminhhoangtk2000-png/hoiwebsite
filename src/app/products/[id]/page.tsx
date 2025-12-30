'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/lib/store'
import { toast } from 'sonner'

interface Variant {
  color: string
  hex: string
  sizes: string[]
  image_url: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  main_image_url: string | null
  variants: Variant[]
}

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()

        if (error) throw error

        if (data) {
          const parsedVariants = typeof data.variants === 'string' 
            ? JSON.parse(data.variants) 
            : data.variants || []
          
          setProduct({
            ...data,
            variants: parsedVariants
          })

          // Set default color and image
          if (parsedVariants.length > 0) {
            setSelectedColor(parsedVariants[0].color)
            setCurrentImage(parsedVariants[0].image_url || data.main_image_url)
          } else {
            setCurrentImage(data.main_image_url)
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error)
        toast.error('Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const handleColorSelect = (color: string, variant: Variant) => {
    setSelectedColor(color)
    setSelectedSize(null) // Reset size when color changes
    setCurrentImage(variant.image_url || product?.main_image_url || null)
  }

  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize || !product) {
      toast.error('Please select both color and size')
      return
    }
    
    const variant = product.variants.find(v => v.color === selectedColor)
    const itemId = `${product.id}-${selectedColor}-${selectedSize}`
    
    addItem({
      id: itemId,
      productId: product.id,
      name: product.name,
      price: product.price,
      color: selectedColor,
      size: selectedSize,
      image: variant?.image_url || product.main_image_url,
      quantity: 1
    })
    
    toast.success(`Added to cart: ${product.name} - ${selectedColor} - ${selectedSize}`)
  }

  const availableSizes = product?.variants.find(v => v.color === selectedColor)?.sizes || []

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">Product not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Left Column - Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square relative bg-gray-100 overflow-hidden">
            {currentImage ? (
              <Image
                src={currentImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>
          
          {/* Thumbnail gallery */}
          {product.variants.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {product.variants.map((variant, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(variant.image_url || product.main_image_url)}
                  className={`aspect-square relative border-2 overflow-hidden ${
                    currentImage === (variant.image_url || product.main_image_url)
                      ? 'border-[#333333]' 
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  {variant.image_url || product.main_image_url ? (
                    <Image
                      src={variant.image_url || product.main_image_url || ''}
                      alt={`${variant.color} variant`}
                      fill
                      className="object-cover"
                      sizes="25vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Product Information */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#333333] mb-4">
              {product.name}
            </h1>
            <p className="text-3xl md:text-4xl font-bold text-[#333333] mb-6">
              ${product.price.toFixed(2)}
            </p>
            {product.description && (
              <p className="text-base text-gray-600 leading-relaxed mb-6">
                {product.description}
              </p>
            )}
          </div>

          {/* Color Selector */}
          {product.variants.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#333333]">Color:</span>
                {selectedColor && (
                  <span className="text-sm text-gray-600">{selectedColor}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((variant, index) => (
                  <button
                    key={index}
                    onClick={() => handleColorSelect(variant.color, variant)}
                    className={`w-12 h-12 rounded-full border-2 transition-all ${
                      selectedColor === variant.color
                        ? 'border-[#333333] scale-110'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: variant.hex }}
                    title={variant.color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {selectedColor && availableSizes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#333333]">Size:</span>
                {selectedSize && (
                  <span className="text-sm text-gray-600">{selectedSize}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-6 py-2 border-2 text-sm font-medium transition-all ${
                      selectedSize === size
                        ? 'border-[#333333] bg-[#333333] text-white'
                        : 'border-gray-300 text-[#333333] hover:border-gray-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            className="w-full bg-[#333333] text-white hover:bg-[#555555] py-6 text-lg font-medium"
            size="lg"
          >
            ADD TO CART
          </Button>
        </div>
      </div>
    </div>
  )
}

