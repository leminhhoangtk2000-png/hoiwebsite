'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/lib/store'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

// --- Interfaces ---
interface VariantOption {
  id: string
  value: string
}
interface Variant {
  id: string
  name: string
  product_variant_options: VariantOption[]
}
interface ProductImage {
  id: string
  image_url: string
}
interface Product {
  id: string
  name: string
  description: string
  price_usd: number
  price_vnd: number
  category_id: string
  discount_type?: 'percentage' | 'fixed' | null
  discount_value?: number | null
  product_images: ProductImage[]
  product_variants: Variant[]
}

const formatUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const formatVND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function calculateDiscountedPrice(price: number, type: 'percentage' | 'fixed', value: number) {
  if (type === 'percentage') return price * (1 - value / 100);
  if (type === 'fixed') return price - value;
  return price;
}

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const addItemToCart = useCartStore((state) => state.addItem)

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [currentImage, setCurrentImage] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return;
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            product_images ( id, image_url, display_order ),
            product_variants ( id, name, product_variant_options ( id, value ) )
          `)
          .eq('id', productId)
          .single()

        if (error) throw error
        
        if (data) {
          // Sort images by display order
          data.product_images.sort((a, b) => a.display_order - b.display_order);
          setProduct(data)
          
          // Set initial state
          setCurrentImage(data.product_images?.[0]?.image_url || null)
          const initialSelections: Record<string, string> = {};
          data.product_variants.forEach(variant => {
            if (variant.product_variant_options?.[0]) {
              initialSelections[variant.name] = variant.product_variant_options[0].value;
            }
          });
          setSelectedOptions(initialSelections);
        }

      } catch (error) {
        console.error('Error fetching product:', error)
        toast.error('Failed to load product')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [productId])

  const handleOptionSelect = (variantName: string, optionValue: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [variantName]: optionValue
    }));
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Check if all variants are selected
    const allVariantsSelected = product.product_variants.every(v => selectedOptions[v.name]);
    if (!allVariantsSelected) {
      toast.error('Please select all options');
      return;
    }

    const cartItem_id = `${product.id}-${Object.values(selectedOptions).join('-')}`;
    const description = Object.entries(selectedOptions).map(([key, value]) => `${key}: ${value}`).join(', ');

    addItemToCart({
      id: cartItem_id,
      productId: product.id,
      name: product.name,
      price: product.price_usd, // Assuming cart uses USD
      image: currentImage,
      quantity: 1,
      variantDescription: description
    });

    toast.success(`Added to cart: ${product.name}`);
  };

  if (loading) return <div className="container text-center py-16">Loading...</div>
  if (!product) return <div className="container text-center py-16">Product not found</div>

  const hasDiscount = product.discount_type && product.discount_value && product.discount_value > 0;
  let discountedPriceUSD: number | null = null;
  if (hasDiscount) {
    discountedPriceUSD = calculateDiscountedPrice(product.price_usd, product.discount_type!, product.discount_value!);
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square relative bg-gray-100 overflow-hidden rounded-lg">
            {currentImage ? (
              <Image src={currentImage} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
            )}
          </div>
          {product.product_images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.product_images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentImage(img.image_url)}
                  className={`aspect-square relative border-2 rounded-md overflow-hidden ${currentImage === img.image_url ? 'border-[#333]' : 'border-transparent hover:border-gray-300'}`}
                >
                  <Image src={img.image_url} alt="thumbnail" fill className="object-cover" sizes="20vw" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#333333] mb-4">{product.name}</h1>
            <div className="flex items-baseline gap-4 mb-6">
              {hasDiscount && discountedPriceUSD !== null ? (
                <>
                  <p className="text-3xl md:text-4xl font-bold text-red-600">{formatUSD.format(discountedPriceUSD)}</p>
                  <p className="text-xl md:text-2xl font-medium text-gray-500 line-through">{formatUSD.format(product.price_usd)}</p>
                </>
              ) : (
                <p className="text-3xl md:text-4xl font-bold text-[#333333]">{formatUSD.format(product.price_usd)}</p>
              )}
               <p className="text-lg text-gray-500">{formatVND.format(product.price_vnd)}</p>
            </div>
            {product.description && <p className="text-base text-gray-600 leading-relaxed mb-6">{product.description}</p>}
          </div>

          {/* Dynamic Variant Selectors */}
          <div className="space-y-6">
            {product.product_variants.map(variant => (
              <div key={variant.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#333333]">{variant.name}:</span>
                  <span className="text-sm text-gray-600">{selectedOptions[variant.name]}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {variant.product_variant_options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(variant.name, option.value)}
                      className={`px-4 py-2 border-2 text-sm font-medium transition-colors duration-200 rounded-md ${
                        selectedOptions[variant.name] === option.value
                          ? 'border-[#333] bg-[#333] text-white'
                          : 'border-gray-300 text-[#333] hover:border-gray-500'
                      }`}
                    >
                      {option.value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleAddToCart}
            className="w-full bg-[#333333] text-white hover:bg-[#555555] py-6 text-lg font-medium"
            size="lg"
            disabled={product.product_variants.length > 0 && !product.product_variants.every(v => selectedOptions[v.name])}
          >
            ADD TO CART
          </Button>
        </div>
      </div>
    </div>
  )
}