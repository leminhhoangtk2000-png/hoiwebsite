// src/app/admin/categories/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase-client'
import { toast } from 'sonner'
import { Trash2, Plus, Edit2, ChevronRight } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  created_at: string
  children?: Category[]
}

export default function AdminCategoriesPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [flatCategories, setFlatCategories] = useState<Category[]>([]) // For parent select
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const [formData, setFormData] = useState({ name: '', slug: '', parent_id: 'none' })

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      const all: Category[] = data || [];
      setFlatCategories(all);
      setCategories(buildTree(all));
    } catch (error: any) {
      console.error('Error fetching categories:', error)
      toast.error(error.message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  function buildTree(items: Category[], parentId: string | null = null): Category[] {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: buildTree(items, item.id)
      }));
  }

  function generateSlug(name: string) {
    return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim()) return

    const slug = formData.slug || generateSlug(formData.name)
    const payload = {
      name: formData.name.trim(),
      slug: slug,
      parent_id: formData.parent_id === 'none' ? null : formData.parent_id
    }

    try {
      if (editingCategory) {
        // Update
        const { error } = await supabase.from('categories').update(payload).eq('id', editingCategory.id)
        if (error) throw error
        toast.success('Category updated!')
      } else {
        // Create
        const { error } = await supabase.from('categories').insert(payload)
        if (error) throw error
        toast.success('Category added!')
      }

      setDialogOpen(false)
      resetForm()
      fetchCategories()
    } catch (error: any) {
      toast.error(error.message || 'Operation failed')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category?')) return
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
      toast.success('Category deleted!')
      fetchCategories()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  function resetForm() {
    setFormData({ name: '', slug: '', parent_id: 'none' })
    setEditingCategory(null)
  }

  function openEdit(cat: Category) {
    setEditingCategory(cat)
    setFormData({
      name: cat.name,
      slug: cat.slug,
      parent_id: cat.parent_id || 'none'
    })
    setDialogOpen(true)
  }

  // Recursive renderer for table rows
  function renderRows(cats: Category[], depth = 0) {
    return cats.flatMap(cat => [
      <TableRow key={cat.id}>
        <TableCell className="font-medium">
          <div className="flex items-center" style={{ paddingLeft: `${depth * 24}px` }}>
            {depth > 0 && <ChevronRight className="h-4 w-4 text-gray-400 mr-1" />}
            {cat.name}
          </div>
        </TableCell>
        <TableCell className="text-gray-600">{cat.slug}</TableCell>
        <TableCell>{new Date(cat.created_at).toLocaleDateString()}</TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="icon" onClick={() => openEdit(cat)} className="mr-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>,
      ...renderRows(cat.children || [], depth + 1)
    ])
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#333333]">Categories</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#333333] text-white hover:bg-[#555555]">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Parent Category</Label>
                <Select
                  value={formData.parent_id}
                  onValueChange={(val) => setFormData({ ...formData, parent_id: val })}
                >
                  <SelectTrigger><SelectValue placeholder="None (Top Level)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Top Level)</SelectItem>
                    {flatCategories
                      .filter(c => c.id !== editingCategory?.id) // Prevent self-parenting
                      .map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Category Name *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: formData.slug || generateSlug(e.target.value) })} required />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#333333] text-white hover:bg-[#555555]">{editingCategory ? 'Update' : 'Add'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderRows(categories)}
            {categories.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8">No categories found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

