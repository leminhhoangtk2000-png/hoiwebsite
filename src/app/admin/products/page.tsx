'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Trash2, Upload, Loader2, X, PlusCircle, Pencil } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// Data Interfaces
interface Product {
  id: string
  name: string
  description: string
  price_usd: number
  price_vnd: number
  category_id: string
  variants: any // This is the old JSONB, will be removed from inserts
  // Joined data
  categories: { name: string } | null
  product_images: { image_url: string }[]
  product_variants: Variant[]
}

interface Category {
  id: string
  name: string
}

interface ImageAsset {
  preview: string;
  url: string;
  file?: File;
}

// Variant interfaces for the new dynamic UI
interface VariantOption {
  value: string;
  // Future fields: additional_price_usd, additional_price_vnd
}
interface Variant {
  id: string; // For React key prop
  name: string;
  options: VariantOption[];
}


const formatUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const formatVND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });


export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [imageAssets, setImageAssets] = useState<ImageAsset[]>([])
  const [variants, setVariants] = useState<Variant[]>([]);
  const [newOptions, setNewOptions] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_usd: '',
    price_vnd: '',
    category_id: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      await Promise.all([fetchProducts(), fetchCategories()])
    } catch (error) {
      console.error('Error fetching initial data:', error)
      toast.error('Failed to load page data.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories ( name ),
          product_images ( image_url ),
          product_variants ( id, name, product_variant_options ( id, value ) )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase.from('categories').select('id, name').order('name')
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    }
  }

  // --- Variant Handlers ---
  const addVariant = () => {
    setVariants([...variants, { id: Date.now().toString(), name: '', options: [] }]);
  };

  const removeVariant = (variantId: string) => {
    setVariants(variants.filter(v => v.id !== variantId));
  };

  const handleVariantNameChange = (variantId: string, newName: string) => {
    setVariants(variants.map(v => v.id === variantId ? { ...v, name: newName } : v));
  };

  const addVariantOption = (variantId: string) => {
    const optionValue = newOptions[variantId]?.trim();
    if (!optionValue) return;

    setVariants(variants.map(v => {
      if (v.id === variantId) {
        // Prevent duplicate options
        if (v.options.some(opt => opt.value.toLowerCase() === optionValue.toLowerCase())) {
          toast.warning(`Option "${optionValue}" already exists for this variant.`);
          return v;
        }
        return { ...v, options: [...v.options, { value: optionValue }] };
      }
      return v;
    }));
    setNewOptions({ ...newOptions, [variantId]: '' }); // Clear input after adding
  };

  const removeVariantOption = (variantId: string, optionValue: string) => {
    setVariants(variants.map(v => 
      v.id === variantId 
        ? { ...v, options: v.options.filter(opt => opt.value !== optionValue) }
        : v
    ));
  };

  // --- Image Handlers ---
  async function handleImageUpload(files: FileList) {
    if (!files || files.length === 0) return
    setUploading(true)

    const uploadPromises = Array.from(files).map(async file => {
      if (!file.type.startsWith('image/')) { toast.warning(`Skipping non-image file: ${file.name}`); return null; }
      if (file.size > 5 * 1024 * 1024) { toast.warning(`Skipping large file: ${file.name} ( > 5MB)`); return null; }

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `product-images/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
        if (!urlData.publicUrl) throw new Error('Failed to get public URL');
        return { preview: URL.createObjectURL(file), url: urlData.publicUrl, file } as ImageAsset;
      } catch (error: any) {
        console.error('Error uploading image:', file.name, error);
        toast.error(`Failed to upload ${file.name}`);
        return null;
      }
    });
    
    try {
      const results = await Promise.all(uploadPromises);
      const newAssets = results.filter((asset): asset is ImageAsset => asset !== null);
      setImageAssets(prevAssets => [...prevAssets, ...newAssets]);
      if(newAssets.length > 0) toast.success(`${newAssets.length} image(s) uploaded successfully!`);
    } catch(err) {
      toast.error('An error occurred during upload.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) { fileInputRef.current.value = ''; }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) { handleImageUpload(e.target.files); }
  }

  function handleRemoveImage(index: number) {
    const assetToRemove = imageAssets[index];
    if (assetToRemove && assetToRemove.preview.startsWith('blob:')) { URL.revokeObjectURL(assetToRemove.preview); }
    setImageAssets(prev => prev.filter((_, i) => i !== index));
  }

  // --- Main Form Submission ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (imageAssets.length === 0) { toast.error('Please upload at least one image.'); return; }
    if (!formData.category_id) { toast.error('Please select a category.'); return; }

    let productId: string;

    try {
      // Step 1: Insert product to get ID
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          description: formData.description || null,
          price_usd: parseFloat(formData.price_usd) || 0,
          price_vnd: parseInt(formData.price_vnd, 10) || 0,
          category_id: formData.category_id,
          discount_type: formData.discount_value ? formData.discount_type : null,
          discount_value: formData.discount_value ? parseFloat(formData.discount_value) : null,
          variants: '[]' // No longer used, but schema might still require it
        })
        .select('id').single();

      if (productError) throw productError;
      productId = productData.id;

      // Step 2: Insert images
      const imagesToInsert = imageAssets.map((asset, index) => ({ product_id: productId, image_url: asset.url, display_order: index }));
      const { error: imageError } = await supabase.from('product_images').insert(imagesToInsert);
      if (imageError) throw imageError;

      // Step 3: Insert variants and options
      for (const variant of variants) {
        if (!variant.name.trim() || variant.options.length === 0) continue; // Skip empty variants
        const { data: variantData, error: variantError } = await supabase
          .from('product_variants')
          .insert({ product_id: productId, name: variant.name.trim() })
          .select('id').single();
        
        if (variantError) throw variantError;
        const variantId = variantData.id;

        const optionsToInsert = variant.options.map(opt => ({ variant_id: variantId, value: opt.value }));
        const { error: optionError } = await supabase.from('product_variant_options').insert(optionsToInsert);
        if (optionError) throw optionError;
      }

      toast.success('Product added successfully!');
      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast.error(error.message || 'Failed to add product');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) { return; }
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success('Product deleted successfully!');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Failed to delete product');
    }
  }
  
  const resetForm = () => {
    imageAssets.forEach(asset => { if (asset.preview.startsWith('blob:')) { URL.revokeObjectURL(asset.preview); }});
    setImageAssets([]);
    setVariants([]);
    setNewOptions({});
    setFormData({
      name: '', description: '', price_usd: '', price_vnd: '', category_id: '',
      discount_type: 'percentage', discount_value: '',
    });
    if (fileInputRef.current) { fileInputRef.current.value = ''; }
  }

  if (loading) { return <div className="container mx-auto px-4 py-16"><div className="text-center">Loading...</div></div> }

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#333333]">Product Management</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { resetForm(); }}}>
          <DialogTrigger asChild><Button className="bg-[#333333] text-white hover:bg-[#555555]">Add New Product</Button></DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Details */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price_usd">Price (USD) *</Label>
                    <Input id="price_usd" type="number" step="0.01" value={formData.price_usd} onChange={(e) => setFormData({ ...formData, price_usd: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="price_vnd">Price (VND) *</Label>
                    <Input id="price_vnd" type="number" step="1000" value={formData.price_vnd} onChange={(e) => setFormData({ ...formData, price_vnd: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}><SelectTrigger id="category"><SelectValue placeholder="Select a category" /></SelectTrigger><SelectContent>{categories.map((category) => (<SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>))}</SelectContent></Select>
                  </div>
                </div>
              </div>
              
              {/* Sales Off */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Sales Off</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="discount_type">Discount Type</Label>
                        <Select value={formData.discount_type} onValueChange={(value: 'percentage' | 'fixed') => setFormData({ ...formData, discount_type: value })}><SelectTrigger id="discount_type"><SelectValue placeholder="Select discount type" /></SelectTrigger><SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="fixed">Fixed Amount (USD)</SelectItem></SelectContent></Select>
                    </div>
                    <div>
                        <Label htmlFor="discount_value">Discount Value</Label>
                        <Input id="discount_value" type="number" step="0.01" value={formData.discount_value} onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })} placeholder={formData.discount_type === 'percentage' ? 'e.g., 10 for 10%' : 'e.g., 5 for $5 off'} />
                    </div>
                </div>
              </div>

              {/* Product Images */}
              <div className="border-t pt-6">
                 <Label htmlFor="product_images" className="text-lg font-medium">Product Images *</Label>
                 <p className="text-sm text-gray-500 mb-4">The first image will be the main display image. You can drag to reorder.</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {imageAssets.map((asset, index) => (
                      <div key={asset.preview} className="relative aspect-square border rounded-lg overflow-hidden group">
                        <Image src={asset.preview} alt={`Product image ${index + 1}`} fill className="object-cover" sizes="(max-width: 640px) 33vw, 25vw, 20vw" />
                        <div className="absolute top-1 right-1 flex flex-col gap-1"><Button type="button" variant="destructive" size="icon" className="h-7 w-7 opacity-70 group-hover:opacity-100" onClick={() => handleRemoveImage(index)}><X className="h-4 w-4" /></Button></div>
                         <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center p-1">{index + 1}</div>
                      </div>
                    ))}
                    <Label htmlFor="product_images_input" className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">{uploading ? (<><Loader2 className="h-6 w-6 animate-spin text-gray-500" /><span className="mt-2 text-sm text-gray-600">Uploading...</span></>) : (<><Upload className="h-6 w-6 text-gray-500" /><span className="mt-2 text-sm text-center text-gray-600">Add Images</span></>)}</Label>
                     <Input ref={fileInputRef} id="product_images_input" type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} multiple className="sr-only" />
                  </div>
              </div>
              
              {/* Variants */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Product Variants</h3>
                <div className="space-y-4">
                  {variants.map((variant, variantIndex) => (
                    <div key={variant.id} className="p-4 border rounded-lg bg-gray-50/50">
                      <div className="flex justify-between items-center mb-2">
                        <Input
                          placeholder="Variant Name (e.g., Size, Color)"
                          value={variant.name}
                          onChange={(e) => handleVariantNameChange(variant.id, e.target.value)}
                          className="font-semibold"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(variant.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                      <div className="pl-4">
                        <div className="flex gap-2 items-center">
                          <Input
                            placeholder="Add new option (e.g., S, M, Red)"
                            value={newOptions[variant.id] || ''}
                            onChange={(e) => setNewOptions({ ...newOptions, [variant.id]: e.target.value })}
                             onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addVariantOption(variant.id); } }}
                          />
                          <Button type="button" size="icon" onClick={() => addVariantOption(variant.id)}><PlusCircle className="h-5 w-5" /></Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {variant.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-sm">
                              {option.value}
                              <button type="button" onClick={() => removeVariantOption(variant.id, option.value)} className="ml-1 text-gray-600 hover:text-black"><X className="h-3 w-3"/></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" onClick={addVariant} className="mt-4"><PlusCircle className="h-4 w-4 mr-2"/>Add Variant Type</Button>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 border-t pt-6">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#333333] text-white hover:bg-[#555555]">Add Product</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Table */}
      {products.length === 0 ? (
        <div className="text-center py-12"><p className="text-gray-600">No products found.</p><p className="text-sm text-gray-500 mt-2">Click "Add New Product" to get started.</p></div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const mainImage = product.product_images?.[0]?.image_url
                const variantCount = product.product_variants?.length || 0;
                
                return (
                  <TableRow key={product.id}>
                    <TableCell>{mainImage ? (<Image src={mainImage} alt={product.name} width={40} height={40} className="rounded-md object-cover" />) : (<div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">?</div>)}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.categories?.name || 'N/A'}</TableCell>
                    <TableCell><div className="flex flex-col"><span>{formatUSD.format(product.price_usd)}</span><span className="text-xs text-gray-600">{formatVND.format(product.price_vnd)}</span></div></TableCell>
                    <TableCell>{variantCount} variant(s)</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/admin/products/edit/${product.id}`} passHref>
                          <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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