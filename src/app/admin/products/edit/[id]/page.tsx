// src/app/admin/products/edit/[id]/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Trash2, Upload, Loader2, X, PlusCircle, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// Re-using interfaces from the main products page for consistency
interface Category {
  id: string
  name: string
}

interface ImageAsset {
  id?: string; // ID from product_images table
  preview: string;
  url: string;
  file?: File;
}

interface VariantOption {
  id?: string; // ID from product_variant_options table
  value: string;
}
interface Variant {
  id: string; // Can be UUID from DB or new Date().toString() for new ones
  name: string;
  options: VariantOption[];
}

export default function AdminProductEditPage() {
  const router = useRouter()
  const params = useParams()
  const { id: productId } = params

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  
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
    if (!productId) return
    
    async function fetchInitialData() {
      setLoading(true)
      try {
        // Fetch categories first
        const { data: catData, error: catError } = await supabase
          .from('categories').select('id, name').order('name');
        if (catError) throw catError;
        setCategories(catData || []);

        // Fetch the specific product and its related data
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select(`
            *,
            product_images ( id, image_url, display_order ),
            product_variants ( id, name, product_variant_options ( id, value ) )
          `)
          .eq('id', productId)
          .single()

        if (productError) throw productError
        if (!productData) {
          toast.error("Product not found.")
          router.push('/admin/products')
          return
        }

        // Populate form states
        setFormData({
          name: productData.name,
          description: productData.description || '',
          price_usd: productData.price_usd?.toString() || '',
          price_vnd: productData.price_vnd?.toString() || '',
          category_id: productData.category_id || '',
          discount_type: productData.discount_type || 'percentage',
          discount_value: productData.discount_value?.toString() || '',
        });

        const loadedImages = productData.product_images
          .sort((a, b) => a.display_order - b.display_order)
          .map(img => ({ id: img.id, preview: img.image_url, url: img.image_url }));
        setImageAssets(loadedImages);

        const loadedVariants = productData.product_variants.map(v => ({
          id: v.id,
          name: v.name,
          options: v.product_variant_options.map(opt => ({ id: opt.id, value: opt.value }))
        }));
        setVariants(loadedVariants);

      } catch (error: any) {
        console.error("Failed to load product data:", error)
        toast.error("Failed to load product data. " + error.message)
        router.push('/admin/products')
      } finally {
        setLoading(false)
      }
    }
    
    fetchInitialData()
  }, [productId, router])

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || typeof productId !== 'string') {
        toast.error("Invalid Product ID.");
        return;
    }
    
    setSaving(true);

    try {
        // Step 1: Handle new image uploads.
        const newFiles = imageAssets.filter(asset => asset.file);
        const uploadedUrls: { [key: string]: string } = {};

        if (newFiles.length > 0) {
            toast.info(`Uploading ${newFiles.length} new image(s)...`);
            const uploadPromises = newFiles.map(async asset => {
                if (!asset.file) return null;
                const fileExt = asset.file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `product-images/${fileName}`;

                const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, asset.file);
                if (uploadError) throw new Error(`Failed to upload ${asset.file.name}: ${uploadError.message}`);

                const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
                if (!urlData.publicUrl) throw new Error('Failed to get public URL for new image');
                
                // Keep track of which blob URL corresponds to which final URL
                uploadedUrls[asset.preview] = urlData.publicUrl;
                return true;
            });
            await Promise.all(uploadPromises);
        }

        // Step 2: Update the core product details.
        const { error: productUpdateError } = await supabase
            .from('products')
            .update({
                name: formData.name,
                description: formData.description || null,
                price_usd: parseFloat(formData.price_usd) || 0,
                price_vnd: parseInt(formData.price_vnd, 10) || 0,
                category_id: formData.category_id,
                discount_type: formData.discount_value ? formData.discount_type : null,
                discount_value: formData.discount_value ? parseFloat(formData.discount_value) : null,
            })
            .eq('id', productId);

        if (productUpdateError) throw productUpdateError;

        // Step 3: Reconcile images (delete all and re-insert).
        // First delete all existing images for the product.
        const { error: deleteImagesError } = await supabase.from('product_images').delete().eq('product_id', productId);
        if (deleteImagesError) throw deleteImagesError;

        // Then insert the new list of images.
        const finalImageAssets = imageAssets.map((asset, index) => ({
            product_id: productId,
            image_url: uploadedUrls[asset.preview] || asset.url, // Use newly uploaded URL if available
            display_order: index
        }));
        
        if (finalImageAssets.length > 0) {
            const { error: insertImagesError } = await supabase.from('product_images').insert(finalImageAssets);
            if (insertImagesError) throw insertImagesError;
        }

        // Step 4: Reconcile variants (delete all and re-insert).
        const { error: deleteVariantsError } = await supabase.from('product_variants').delete().eq('product_id', productId);
        if (deleteVariantsError) throw deleteVariantsError;

        for (const variant of variants) {
            if (!variant.name.trim() || variant.options.length === 0) continue;

            const { data: variantData, error: variantError } = await supabase
                .from('product_variants')
                .insert({ product_id: productId, name: variant.name.trim() })
                .select('id')
                .single();
            
            if (variantError) throw variantError;
            const variantId = variantData.id;

            const optionsToInsert = variant.options.map(opt => ({ variant_id: variantId, value: opt.value }));
            const { error: optionError } = await supabase.from('product_variant_options').insert(optionsToInsert);
            if (optionError) throw optionError;
        }

        toast.success("Product updated successfully!");
        router.push('/admin/products');

    } catch (error: any) {
        console.error("Error updating product:", error);
        toast.error(error.message || "An unexpected error occurred.");
    } finally {
        setSaving(false);
    }
  }

  // All other handlers (variants, images) can be reused, but need slight adjustments
  // for the edit context if we were to implement complex diffing. For now, they are ok.
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
        if (v.options.some(opt => opt.value.toLowerCase() === optionValue.toLowerCase())) {
          toast.warning(`Option "${optionValue}" already exists for this variant.`);
          return v;
        }
        return { ...v, options: [...v.options, { value: optionValue }] };
      }
      return v;
    }));
    setNewOptions({ ...newOptions, [variantId]: '' });
  };

  const removeVariantOption = (variantId: string, optionValue: string) => {
    setVariants(variants.map(v => 
      v.id === variantId 
        ? { ...v, options: v.options.filter(opt => opt.value !== optionValue) }
        : v
    ));
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-16"><div className="text-center">Loading product...</div></div>
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/admin/products" className="flex items-center text-sm text-gray-600 hover:text-black">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Products
          </Link>
          <h1 className="text-3xl font-bold text-[#333333] mt-2">Edit Product</h1>
        </div>
        
        <form onSubmit={handleUpdate} className="space-y-8">
            {/* Form content is identical to the dialog, so we just copy it over */}
            {/* Product Details */}
            <div className="space-y-4 p-6 border rounded-lg">
                <h2 className="text-xl font-semibold">Product Details</h2>
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
              <div className="p-6 border rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Sales Off</h2>
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

            {/* Variants */}
             <div className="p-6 border rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Product Variants</h2>
                <div className="space-y-4">
                  {variants.map((variant, variantIndex) => (
                    <div key={variant.id} className="p-4 border rounded-lg bg-gray-50/50">
                      <div className="flex justify-between items-center mb-2">
                        <Input placeholder="Variant Name (e.g., Size, Color)" value={variant.name} onChange={(e) => handleVariantNameChange(variant.id, e.target.value)} className="font-semibold" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(variant.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                      <div className="pl-4">
                        <div className="flex gap-2 items-center">
                          <Input placeholder="Add new option (e.g., S, M, Red)" value={newOptions[variant.id] || ''} onChange={(e) => setNewOptions({ ...newOptions, [variant.id]: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addVariantOption(variant.id); } }} />
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

            <div className="flex justify-end gap-2 border-t pt-6">
              <Link href="/admin/products" passHref>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={saving} className="bg-[#333333] text-white hover:bg-[#555555]">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
            </div>
        </form>
      </div>
    </div>
  )
}
