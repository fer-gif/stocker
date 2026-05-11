'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Loader2, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

const saleSchema = z.object({
  customerName: z.string().optional(),
  paymentMethod: z.enum(['cash', 'card', 'transfer']),
  notes: z.string().optional(),
})

type SaleFormData = z.infer<typeof saleSchema>

interface SaleItem {
  productId: string
  productName: string
  variantId: string
  variantLabel: string
  quantity: number
  price: number
  maxQuantity: number
}

interface Product {
  id: string
  name: string
  variants: {
    id: string
    size: string
    color: string
    quantity: number
    price: number
  }[]
}

interface SaleFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  products: Product[]
}

export function SaleForm({ open, onClose, onSaved, products }: SaleFormProps) {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<SaleItem[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [addQty, setAddQty] = useState(1)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: { paymentMethod: 'cash' },
  })

  const selectedProduct = products.find((p) => p.id === selectedProductId)
  const selectedVariant = selectedProduct?.variants.find((v) => v.id === selectedVariantId)

  const addItem = () => {
    if (!selectedProduct || !selectedVariant) {
      toast.error('Selecciona un producto y variante')
      return
    }
    if (addQty < 1 || addQty > selectedVariant.quantity) {
      toast.error(`Cantidad inválida. Stock disponible: ${selectedVariant.quantity}`)
      return
    }

    const existingIndex = items.findIndex((i) => i.variantId === selectedVariantId)
    if (existingIndex >= 0) {
      const updated = [...items]
      const newQty = updated[existingIndex].quantity + addQty
      if (newQty > selectedVariant.quantity) {
        toast.error(`No hay suficiente stock`)
        return
      }
      updated[existingIndex].quantity = newQty
      setItems(updated)
    } else {
      setItems([
        ...items,
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          variantId: selectedVariant.id,
          variantLabel: `${selectedVariant.size} / ${selectedVariant.color}`,
          quantity: addQty,
          price: selectedVariant.price,
          maxQuantity: selectedVariant.quantity,
        },
      ])
    }
    setSelectedVariantId('')
    setAddQty(1)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0)

  const onSubmit = async (data: SaleFormData) => {
    if (items.length === 0) {
      toast.error('Agrega al menos un producto')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          total,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            price: i.price,
          })),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Error')
      }
      toast.success('Venta registrada exitosamente')
      reset()
      setItems([])
      setSelectedProductId('')
      setSelectedVariantId('')
      onSaved()
      onClose()
    } catch (e: any) {
      toast.error(e.message ?? 'Error al registrar venta')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setItems([])
    setSelectedProductId('')
    setSelectedVariantId('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Nueva venta
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Add item */}
          <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700 mb-3">Agregar producto</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value)
                    setSelectedVariantId('')
                  }}
                  className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar producto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <select
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  disabled={!selectedProductId}
                  className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">Seleccionar variante...</option>
                  {selectedProduct?.variants
                    .filter((v) => v.quantity > 0)
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.size} / {v.color} — Stock: {v.quantity} — {formatCurrency(v.price)}
                      </option>
                    ))}
                </select>
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  min="1"
                  max={selectedVariant?.quantity ?? 999}
                  value={addQty}
                  onChange={(e) => setAddQty(Number(e.target.value))}
                />
              </div>
              <Button type="button" onClick={addItem} className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Items list */}
          {items.length > 0 && (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-200">
                    <th className="px-4 py-2 font-medium">Producto</th>
                    <th className="px-4 py-2 font-medium">Variante</th>
                    <th className="px-4 py-2 font-medium text-center">Cant.</th>
                    <th className="px-4 py-2 font-medium text-right">Precio</th>
                    <th className="px-4 py-2 font-medium text-right">Subtotal</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-2">{item.productName}</td>
                      <td className="px-4 py-2 text-gray-500">{item.variantLabel}</td>
                      <td className="px-4 py-2 text-center">{item.quantity}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-2 text-right font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                      <td className="px-2 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(i)}
                          className="h-7 w-7"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={4} className="px-4 py-2 text-right">
                      Total:
                    </td>
                    <td className="px-4 py-2 text-right text-blue-600">
                      {formatCurrency(total)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Sale details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nombre del cliente</Label>
              <Input
                id="customerName"
                {...register('customerName')}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2">
              <Label>Método de pago *</Label>
              <select
                {...register('paymentMethod')}
                className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Notas adicionales..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || items.length === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar venta ({formatCurrency(total)})
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
