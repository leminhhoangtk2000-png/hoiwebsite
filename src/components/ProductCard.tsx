import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// This interface should be kept in sync with the data fetched for the cards
interface Product {
  id: string
  name: string
  price_usd: number
  price_vnd: number
  discount_type?: 'percentage' | 'fixed' | null
  discount_value?: number | null
  product_images: { image_url: string }[]
}

interface ProductCardProps {
  product: Product
}

const formatUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const formatVND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function calculateDiscountedPrice(price: number, type: 'percentage' | 'fixed', value: number) {
  if (type === 'percentage') {
    return price * (1 - value / 100);
  }
  if (type === 'fixed') {
    return price - value;
  }
  return price;
}


export default function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.product_images?.[0]?.image_url

  const hasDiscount = product.discount_type && product.discount_value && product.discount_value > 0;
  let discountedPriceUSD: number | null = null;
  let discountedPriceVND: number | null = null;

  if (hasDiscount) {
    // Note: 'fixed' discount is assumed to be in USD. A more robust system might need a currency field for the discount itself.
    discountedPriceUSD = calculateDiscountedPrice(product.price_usd, product.discount_type!, product.discount_value!);
    
    // For VND, if the discount is a fixed USD amount, we cannot directly apply it.
    // This is a simplification: we'll only show a VND discount if the type is 'percentage'.
    if (product.discount_type === 'percentage') {
      discountedPriceVND = calculateDiscountedPrice(product.price_vnd, product.discount_type, product.discount_value!);
    } else {
      // Or we could try to convert, but without an exchange rate, that's not possible.
      // For now, we'll just not show a VND discount for fixed amounts.
      discountedPriceVND = null;
    }
  }

  return (
    <Link href={`/products/${product.id}`} className="flex flex-col h-full">
      <Card className="group overflow-hidden border-0 hover:opacity-90 transition-opacity cursor-pointer flex-grow flex flex-col">
        <div className="aspect-[4/5] relative bg-gray-100 overflow-hidden">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
          {hasDiscount && <Badge variant="destructive" className="absolute top-2 left-2">SALE</Badge>}
        </div>
        <div className="p-4 flex-grow flex flex-col">
          <h3 className="text-sm font-medium text-[#333333] mb-2 line-clamp-2 flex-grow">
            {product.name}
          </h3>
          <div className="mt-auto">
            {hasDiscount && discountedPriceUSD !== null ? (
              <div>
                <p className="text-base font-semibold text-red-600">
                  {formatUSD.format(discountedPriceUSD)}
                  {discountedPriceVND !== null && <span className="text-xs text-gray-500 ml-2">{formatVND.format(discountedPriceVND)}</span>}
                </p>
                <p className="text-sm text-gray-500 line-through">
                  {formatUSD.format(product.price_usd)}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-base font-semibold text-[#333333]">
                  {formatUSD.format(product.price_usd)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatVND.format(product.price_vnd)}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}

