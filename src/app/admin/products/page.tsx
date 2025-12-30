'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Trash2, Upload, Loader2, X } from 'lucide-react'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  main_image_url: string | null
  variants: any
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    main_image_url: '',
    variants: '[]'
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  async function handleImageUpload(file: File) {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setUploading(true)

    try {
      // Create unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `product-images/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      // Supabase getPublicUrl returns { publicUrl: string }
      const publicUrl = urlData.publicUrl

      if (!publicUrl) {
        throw new Error('Failed to get public URL')
      }

      // Update form data with the public URL
      setFormData({ ...formData, main_image_url: publicUrl })
      setImagePreview(publicUrl)
      toast.success('Image uploaded successfully!')
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error(error.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  function handleRemoveImage() {
    setFormData({ ...formData, main_image_url: '' })
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      // Parse variants JSON
      let parsedVariants
      try {
        parsedVariants = JSON.parse(formData.variants)
      } catch {
        parsedVariants = []
        toast.error('Invalid JSON format for variants. Using empty array.')
      }

      const { error } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price),
          category: formData.category,
          main_image_url: formData.main_image_url || null,
          variants: parsedVariants
        })

      if (error) throw error

      toast.success('Product added successfully!')
      setDialogOpen(false)
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        main_image_url: '',
        variants: '[]'
      })
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      fetchProducts()
    } catch (error: any) {
      console.error('Error adding product:', error)
      toast.error(error.message || 'Failed to add product')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Product deleted successfully!')
      fetchProducts()
    } catch (error: any) {
      console.error('Error deleting product:', error)
      toast.error(error.message || 'Failed to delete product')
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
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#333333]">Product Management</h1>
        <Dialog 
          open={dialogOpen} 
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              // Reset form when dialog closes
              setFormData({
                name: '',
                description: '',
                price: '',
                category: '',
                main_image_url: '',
                variants: '[]'
              })
              setImagePreview(null)
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-[#333333] text-white hover:bg-[#555555]">
              Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Men, Women, Kids"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="main_image">Main Image</Label>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Input
                      ref={fileInputRef}
                      id="main_image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={uploading}
                      className="cursor-pointer"
                    />
                    {uploading && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading...</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Image Preview */}
                  {(imagePreview || formData.main_image_url) && (
                    <div className="relative w-48 h-48 border rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={imagePreview || formData.main_image_url}
                        alt="Product preview"
                        fill
                        className="object-cover"
                        sizes="192px"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Manual URL input as fallback */}
                  <div>
                    <Label htmlFor="main_image_url" className="text-sm text-gray-600">
                      Or enter image URL manually:
                    </Label>
                    <Input
                      id="main_image_url"
                      type="url"
                      value={formData.main_image_url}
                      onChange={(e) => {
                        setFormData({ ...formData, main_image_url: e.target.value })
                        if (e.target.value) {
                          setImagePreview(e.target.value)
                        } else {
                          setImagePreview(null)
                        }
                      }}
                      placeholder="https://..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="variants">Variants (JSON) *</Label>
                <Textarea
                  id="variants"
                  value={formData.variants}
                  onChange={(e) => setFormData({ ...formData, variants: e.target.value })}
                  rows={8}
                  placeholder='[{"color": "Black", "hex": "#000000", "sizes": ["S", "M", "L"], "image_url": "https://..."}]'
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a JSON array of variant objects. Each variant should have: color, hex, sizes (array), and image_url.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#333333] text-white hover:bg-[#555555]">
                  Add Product
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No products found.</p>
          <p className="text-sm text-gray-500 mt-2">
            Click "Add New Product" to get started.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const variants = typeof product.variants === 'string' 
                  ? JSON.parse(product.variants) 
                  : product.variants || []
                
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      {Array.isArray(variants) ? `${variants.length} variant(s)` : '0 variants'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

