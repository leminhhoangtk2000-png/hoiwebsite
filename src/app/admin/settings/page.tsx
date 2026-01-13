'use client'

import { useEffect, useState, FormEvent, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { revalidateLayout } from '@/app/actions'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Trash2, Plus, Edit, UploadCloud, X, Loader2 } from 'lucide-react'

// #region --- Types ---
interface SiteSetting {
  key: string
  value: any
}
interface HomeSection {
  id: string
  title: string
  category_slug: string
  display_order: number
  is_active: boolean
}
interface Category {
  id: string
  name: string
  slug: string
}
// THIS IS THE CORRECT TYPE FOR OUR SLIDES
interface CarouselSlide {
  id: number
  created_at: string
  title: string
  subtitle: string | null
  image_path: string
  cta_link: string | null
  cta_text: string | null
  display_order: number
  is_active: boolean
}
const BUCKET_NAME = 'hero-banners'
const LOGO_BUCKET_NAME = 'logos'
// #endregion

// #region --- Child Components ---

function LogoUploader({ initialLogoPath, onUploadSuccess }: { initialLogoPath: string | null, onUploadSuccess: (newPath: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [logoPath, setLogoPath] = useState<string | null>(initialLogoPath);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLogoPath(initialLogoPath);
  }, [initialLogoPath]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(LOGO_BUCKET_NAME)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from(LOGO_BUCKET_NAME).getPublicUrl(uploadData.path);
      
      onUploadSuccess(publicUrlData.publicUrl);

      // If a logo already exists, remove the old one first.
      if (logoPath && logoPath.startsWith('http')) {
        const oldLogoName = logoPath.split('/').pop();
        if (oldLogoName) {
          const { error: deleteError } = await supabase.storage.from(LOGO_BUCKET_NAME).remove([oldLogoName]);
          if (deleteError) {
            console.warn("Could not delete old logo:", deleteError.message);
            toast.warning("Failed to remove the old logo file.");
          }
        }
      }

      toast.success("Logo uploaded successfully!");

    } catch (error: any) {
      toast.error(error.message || "Failed to upload logo.");
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  }

  let displayUrl = logoPath;


  return (
    <div className="space-y-4">
        <Label>Logo</Label>
        <div className="flex items-center gap-6">
            <div className="w-48 h-20 flex items-center justify-center border rounded-lg bg-gray-50 overflow-hidden">
                {displayUrl ? (
                    <Image src={displayUrl} alt="Current Logo" width={160} height={80} className="object-contain" />
                ) : (
                    <span className="text-sm text-gray-500">No Logo</span>
                )}
            </div>
            <div className="space-y-2">
                <Button onClick={triggerFileInput} disabled={uploading}>
                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                    {uploading ? 'Uploading...' : 'Upload New Logo'}
                </Button>
                <p className="text-xs text-gray-500">Recommended size: 240x80px</p>
                <Input 
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleLogoUpload}
                    accept="image/png, image/jpeg, image/svg+xml, image/webp"
                    disabled={uploading}
                />
            </div>
        </div>
    </div>
  );
}
// =================================================================
// NEW, CORRECT CAROUSEL SLIDES MANAGER
// =================================================================
function CarouselSlidesManager() {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);

  async function fetchSlides() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hero_carousel_slides')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setSlides(data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load carousel slides.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleDeleteSlide = async (slide: CarouselSlide) => {
    if (!confirm('Are you sure you want to delete this slide? This action cannot be undone.')) return;

    try {
      // 1. Delete image from storage
      if (slide.image_path) {
        const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([slide.image_path]);
        if (storageError) {
          // Log error but proceed with DB deletion
          console.error('Failed to delete image from storage, but proceeding with DB deletion:', storageError.message);
          toast.warning(`Could not delete image file: ${storageError.message}`);
        }
      }

      // 2. Delete row from database
      const { error: dbError } = await supabase.from('hero_carousel_slides').delete().eq('id', slide.id);
      if (dbError) throw dbError;
      
      toast.success('Slide deleted successfully!');
      fetchSlides(); // Refresh list
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete slide.');
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Hero Banner Carousel</CardTitle>
        <SlideEditDialog
          key={editingSlide?.id || 'new'}
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
          editingSlide={editingSlide}
          setEditingSlide={setEditingSlide}
          onSave={fetchSlides}
        />
      </CardHeader>
      <CardContent>
        {loading ? <p>Loading slides...</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slides.length > 0 ? slides.map(slide => {
                const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(slide.image_path);
                return (
                  <TableRow key={slide.id}>
                    <TableCell>
                      <Image src={publicUrl} alt={slide.title} width={120} height={60} className="rounded-md object-cover bg-gray-200" />
                    </TableCell>
                    <TableCell className="font-medium">{slide.title}</TableCell>
                    <TableCell>{slide.display_order}</TableCell>
                    <TableCell>{slide.is_active ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingSlide(slide); setDialogOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteSlide(slide)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              }) : (
                <TableRow><TableCell colSpan={5} className="text-center h-24">No slides created yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function SlideEditDialog({ dialogOpen, setDialogOpen, editingSlide, setEditingSlide, onSave }: any) {
  const [formData, setFormData] = useState({
    title: editingSlide?.title || '',
    subtitle: editingSlide?.subtitle || '',
    cta_text: editingSlide?.cta_text || '',
    cta_link: editingSlide?.cta_link || '',
    display_order: editingSlide?.display_order || 0,
    is_active: editingSlide?.is_active ?? true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
        toast.error("Title is required.");
        return;
    }
    if (!editingSlide && !imageFile) {
        toast.error("An image is required for a new slide.");
        return;
    }
    setIsSaving(true);
    try {
      let image_path = editingSlide?.image_path || '';

      // Step 1: Handle image upload if a new image is provided
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, imageFile);
        
        if (uploadError) throw uploadError;
        image_path = uploadData.path;

        // If editing and there was an old image, delete it
        if (editingSlide?.image_path) {
          const { error: deleteError } = await supabase.storage.from(BUCKET_NAME).remove([editingSlide.image_path]);
          if (deleteError) {
            console.error("Failed to delete old image:", deleteError.message);
            toast.warning("Could not remove old image file from storage.");
          }
        }
      }

      const slideData = { ...formData, image_path };

      // Step 2: Insert or Update the database record
      if (editingSlide) {
        const { error } = await supabase.from('hero_carousel_slides').update(slideData).eq('id', editingSlide.id);
        if (error) throw error;
        toast.success('Slide updated successfully!');
      } else {
        const { error } = await supabase.from('hero_carousel_slides').insert(slideData);
        if (error) throw error;
        toast.success('New slide created successfully!');
      }

      onSave(); // Trigger a refresh on the parent
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save the slide.");
    } finally {
      setIsSaving(false);
    }
  }

  let previewUrl = null;
  if (imageFile) {
    previewUrl = URL.createObjectURL(imageFile);
  } else if (editingSlide?.image_path) {
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(editingSlide.image_path);
    previewUrl = data.publicUrl;
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={(open) => {
      setDialogOpen(open);
      if (!open) {
        setEditingSlide(null);
        setImageFile(null);
      }
    }}>
      <DialogTrigger asChild>
        <Button onClick={() => { setEditingSlide(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Slide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingSlide ? 'Edit Slide' : 'Add New Slide'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="col-span-2 space-y-2">
             <Label>Image</Label>
             <div 
               className="w-full h-48 border-2 border-dashed rounded-md flex items-center justify-center bg-gray-50 cursor-pointer"
               onClick={() => fileInputRef.current?.click()}
             >
                {previewUrl ? (
                  <Image src={previewUrl} alt="preview" width={300} height={150} className="object-contain h-full w-full" />
                ) : (
                  <div className="text-center text-gray-500">
                    <UploadCloud className="mx-auto h-8 w-8" />
                    <p>Click to upload image</p>
                    <p className="text-xs">1920x800 recommended</p>
                  </div>
                )}
             </div>
             <Input 
                id="image-upload" 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                onChange={handleImageChange}
                accept="image/png, image/jpeg, image/webp"
             />
          </div>
          <div className="col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
          </div>
          <div className="col-span-2">
            <Label htmlFor="subtitle">Subtitle (Optional)</Label>
            <Input id="subtitle" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} />
          </div>
          <div>
            <Label htmlFor="cta_text">Button Text (Optional)</Label>
            <Input id="cta_text" value={formData.cta_text} onChange={e => setFormData({...formData, cta_text: e.target.value})} />
          </div>
          <div>
            <Label htmlFor="cta_link">Button Link (Optional)</Label>
            <Input id="cta_link" value={formData.cta_link} placeholder="/products/some-product" onChange={e => setFormData({...formData, cta_link: e.target.value})} />
          </div>
           <div>
            <Label htmlFor="display_order">Display Order</Label>
            <Input id="display_order" type="number" value={formData.display_order} onChange={e => setFormData({...formData, display_order: parseInt(e.target.value) || 0})} required />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="h-4 w-4 rounded"/>
            <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
          </div>
          <div className="col-span-2 flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Slide'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


// ====== Home Sections Manager (Unchanged) ======
function HomeSectionsManager({ categories }: { categories: Category[] }){
  const [sections, setSections] = useState<HomeSection[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null)

  useEffect(() => {
    fetchSections()
  }, [])

  async function fetchSections() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('home_sections')
        .select('*')
        .order('display_order', { ascending: true })
      if (error) throw error
      setSections(data || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to load home sections.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSaveSection = async (formData: Omit<HomeSection, 'id' | 'is_active'>, is_active: boolean) => {
    try {
      if (editingSection) {
        const { error } = await supabase.from('home_sections').update({...formData, is_active}).eq('id', editingSection.id)
        if (error) throw error
        toast.success('Section updated!')
      } else {
        const { error } = await supabase.from('home_sections').insert({...formData, is_active})
        if (error) throw error
        toast.success('Section created!')
      }
      setDialogOpen(false)
      fetchSections()
    } catch (error: any) {
      toast.error(error.message || "Failed to save section.")
    }
  }

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return
    try {
      const { error } = await supabase.from('home_sections').delete().eq('id', id)
      if (error) throw error
      toast.success('Section deleted.')
      fetchSections()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete section.')
    }
  }

  const handleToggleActive = async (section: HomeSection) => {
    try {
      const { error } = await supabase.from('home_sections').update({ is_active: !section.is_active }).eq('id', section.id)
      if (error) throw error
      toast.success(`Section ${!section.is_active ? 'activated' : 'deactivated'}.`)
      fetchSections()
    } catch(error: any) {
       toast.error(error.message || 'Failed to toggle status.')
    }
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Homepage Sections</CardTitle>
        <SectionDialog
          key={editingSection?.id || 'new'}
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
          editingSection={editingSection}
          setEditingSection={setEditingSection}
          categories={categories}
          onSave={handleSaveSection}
        />
      </CardHeader>
      <CardContent>
        {loading ? <p>Loading sections...</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.length > 0 ? sections.map(section => (
                <TableRow key={section.id}>
                  <TableCell>{section.display_order}</TableCell>
                  <TableCell className="font-medium">{section.title}</TableCell>
                  <TableCell>{categories.find(c => c.slug === section.category_slug)?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Button
                      variant={section.is_active ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleActive(section)}
                      className={section.is_active ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      {section.is_active ? 'Active' : 'Inactive'}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingSection(section); setDialogOpen(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteSection(section.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} className="text-center h-24">No sections created yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function SectionDialog({ dialogOpen, setDialogOpen, editingSection, setEditingSection, categories, onSave}: any) {
  const [formData, setFormData] = useState({
    title: editingSection?.title || '',
    category_slug: editingSection?.category_slug || '',
    display_order: editingSection?.display_order || 0,
  });
  const [is_active, setIsActive] = useState(editingSection?.is_active ?? true);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category_slug) {
        toast.error("Title and category are required.");
        return;
    }
    onSave(formData, is_active);
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={(open) => {
      setDialogOpen(open);
      if (!open) setEditingSection(null);
    }}>
      <DialogTrigger asChild>
        <Button onClick={() => { setEditingSection(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Section
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingSection ? 'Edit Section' : 'Add New Section'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
          </div>
          <div>
            <Label htmlFor="category_slug">Category</Label>
            <Select value={formData.category_slug} onValueChange={value => setFormData({...formData, category_slug: value})}>
              <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="display_order">Display Order</Label>
            <Input id="display_order" type="number" value={formData.display_order} onChange={e => setFormData({...formData, display_order: parseInt(e.target.value) || 0})} required />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={is_active} onChange={e => setIsActive(e.target.checked)} className="rounded"/>
            <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit">Save Section</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GeneralSettings({ settings, onUpdate }: { settings: Record<string, any>, onUpdate: () => void }) {
    const [formData, setFormData] = useState(settings);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = Object.keys(formData).map(key => 
                supabase.from('site_settings').update({ value: formData[key] }).eq('key', key)
            );
            
            await Promise.all(updates);
            
            await revalidateLayout();
            toast.success('General settings saved!');
            onUpdate(); // Refresh data on the page
        } catch (error: any) {
            toast.error(error.message || "Failed to save general settings.");
        } finally {
            setSaving(false);
        }
    }

    // This function will be called by the LogoUploader on a successful upload
    const handleLogoUpdate = (newLogoPath: string) => {
        setFormData(prevData => ({ ...prevData, logo_path: newLogoPath }));
    };

    return (
        <Card>
            <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-2">
                    <Label htmlFor="site_title">Site Title</Label>
                    <Input 
                        id="site_title" 
                        value={formData.site_title || ''} 
                        onChange={e => setFormData({ ...formData, site_title: e.target.value })} 
                        placeholder="e.g., UNIQLO Clone"
                    />
                </div>
                
                <LogoUploader 
                    initialLogoPath={formData.logo_path}
                    onUploadSuccess={handleLogoUpdate}
                />

                <div className="space-y-2">
                    <Label htmlFor="payment_qr_url">Payment QR Code URL</Label>
                    <Input 
                        id="payment_qr_url" 
                        value={formData.payment_qr_url || ''} 
                        onChange={e => setFormData({ ...formData, payment_qr_url: e.target.value })}
                        placeholder="URL to your payment QR code image"
                    />
                     {formData.payment_qr_url && (
                        <div className="pt-2">
                            <Image src={formData.payment_qr_url} alt="Payment QR Code" width={150} height={150} className="rounded-md border"/>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bank_info">Bank Information</Label>
                    <Textarea 
                        id="bank_info" 
                        value={formData.bank_info || ''} 
                        onChange={e => setFormData({ ...formData, bank_info: e.target.value })} 
                        rows={4}
                        placeholder="e.g., Bank Name: ABC Bank, Account: 123456789"
                    />
                </div>
                
                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {saving ? 'Saving...' : 'Save General Settings'}
                </Button>
            </CardContent>
        </Card>
    );
}
// #endregion

// #region --- Main Page Component ---
export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [categories, setCategories] = useState<Category[]>([])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const { data: settingsData, error: settingsError } = await supabase.from('site_settings').select('*');
      if (settingsError) throw settingsError;
      
      const settingsMap = settingsData.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, any>);
      
      // Rename logo_url to logo_path for the client-side state
      if (settingsMap.logo_url) {
        settingsMap.logo_path = settingsMap.logo_url;
        delete settingsMap.logo_url;
      }
      
      setSettings(settingsMap);

      const { data: categoriesData, error: categoriesError } = await supabase.from('categories').select('*');
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

    } catch (error: any) {
      console.error('Error fetching settings page data:', error)
      toast.error(error.message || 'Failed to load page data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  if (loading) {
    return <div className="container mx-auto p-8 text-center">Loading settings...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#333333] mb-8">Site Management</h1>
      <div className="space-y-8">
        <GeneralSettings settings={{
            site_title: settings.site_title,
            logo_path: settings.logo_path,
            payment_qr_url: settings.payment_qr_url,
            bank_info: settings.bank_info,
        }} onUpdate={fetchAllData} />

        {/* REPLACED THE OLD MANAGER WITH THE NEW, CORRECT ONE */}
        <CarouselSlidesManager />
        
        <HomeSectionsManager categories={categories} />
      </div>
    </div>
  )
}
// #endregion
