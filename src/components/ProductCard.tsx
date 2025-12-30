import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'

interface Product {
  id: string
  name: string
  price: number
  main_image_url: string | null
}

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group overflow-hidden border-0 hover:opacity-90 transition-opacity cursor-pointer">
        <div className="aspect-square relative bg-gray-100 overflow-hidden">
          {product.main_image_url ? (
            <Image
              src={product.main_image_url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-sm font-medium text-[#333333] mb-1 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-base font-semibold text-[#333333]">
            ${product.price.toFixed(2)}
          </p>
        </div>
      </Card>
    </Link>
  )
}

