'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { SIZES } from '@/lib/utils'

const variantSchema = z.object({
  size: z.string().min(1),
  color: z.string().min(1),
  quantity: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  cost: z.coerce.number().min(0),
  sku: z.string().optional(),
})

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  category: z.string().min(1, 'La categoría es requerida'),
  imageUrl: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>
type VariantFormData = z.infer<typeof variantSchema>

interface ProductFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editProduct?: any
}

export function ProductForm({ open, onClose, onSaved, editProduct }: ProductFormProps) {
  const isEditing = !!editProduct
  const [loading, setLoading] = useState(false)
  const [variants, setVariants] = useState<VariantFormData[]>(
    editProduct?.variants ?? [{ size: 'M', color: 'Negro', quantity: 0, price: 0, cost: 0, sku: '' }]
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: editProduct
      ? {
          name: editProduct.name,
          description: editProduct.description ?? '',
          category: editProduct.category,
          imageUrl: editProduct.imageUrl ?? '',
        }
      : {},
  })

  const addVariant = () => {
    setVariants([
      ...variants,
      { size: 'M', color: 'Negro', quantity: 0, price: 0, cost: 0, sku: '' },
    ])
  }

  const removeVariant = (index: number) => {
    if (variants.length === 1) return
    setVariants(variants.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, field: keyof VariantFormData, value: string | number) => {
    const updated = [...variants]
    updated[index] = { ...updated[index], [field]: value }
    setVariants(updated)
  }

  const onSubmit = async (data: ProductFormData) => {
    if (variants.some((v) => !v.size || !v.color)) {
      toast.error('Complete todos los campos de variantes')
      return
    }
    setLoading(true)
    try {
      const body = { ...data, variants }
      const url = isEditing ? `/api/products/${editProduct.id}` : '/api/products'
      const method = isEditing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Error')
      }
      toast.success(isEditing ? 'Producto actualizado' : 'Producto creado')
      reset()
      setVariants([{ size: 'M', color: 'Negro', quantity: 0, price: 0, cost: 0, sku: '' }])
      onSaved()
      onClose()
    } catch (e: any) {
      toast.error(e.message ?? 'Error al guardar producto')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setVariants([{ size: 'M', color: 'Negro', quantity: 0, price: 0, cost: 0, sku: '' }])
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Product info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" {...register('name')} placeholder="Ej: Remera básica" />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Input id="category" {...register('category')} placeholder="Ej: Remeras" />
              {errors.category && (
                <p className="text-xs text-red-500">{errors.category.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descripción del producto..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL de imagen</Label>
              <Input
                id="imageUrl"
                {...register('imageUrl')}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">Variantes</Label>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus className="h-4 w-4 mr-1" /> Agregar variante
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="pb-2 pr-2 font-medium w-24">Talle</th>
                    <th className="pb-2 pr-2 font-medium w-32">Color</th>
                    <th className="pb-2 pr-2 font-medium w-20">Stock</th>
                    <th className="pb-2 pr-2 font-medium w-28">Costo ($)</th>
                    <th className="pb-2 pr-2 font-medium w-28">Precio ($)</th>
                    <th className="pb-2 pr-2 font-medium w-28">SKU</th>
                    <th className="pb-2 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-1.5 pr-2">
                        <select
                          value={v.size}
                          onChange={(e) => updateVariant(i, 'size', e.target.value)}
                          className="w-full h-9 rounded-md border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {SIZES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-1.5 pr-2">
                        <Input
                          value={v.color}
                          onChange={(e) => updateVariant(i, 'color', e.target.value)}
                          placeholder="Negro"
                          className="h-9"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <Input
                          type="number"
                          min="0"
                          value={v.quantity}
                          onChange={(e) => updateVariant(i, 'quantity', Number(e.target.value))}
                          className="h-9"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={v.cost}
                          onChange={(e) => updateVariant(i, 'cost', Number(e.target.value))}
                          className="h-9"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={v.price}
                          onChange={(e) => updateVariant(i, 'price', Number(e.target.value))}
                          className="h-9"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <Input
                          value={v.sku ?? ''}
                          onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                          placeholder="ABC-001"
                          className="h-9"
                        />
                      </td>
                      <td className="py-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVariant(i)}
                          disabled={variants.length === 1}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
