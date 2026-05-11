'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Plus, Edit, Trash2, Package, ChevronDown, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface ProductVariant {
  id: string
  size: string
  color: string
  quantity: number
  price: number
  cost: number
  sku: string | null
}

interface Product {
  id: string
  name: string
  description: string | null
  category: string
  imageUrl: string | null
  variants: ProductVariant[]
}

interface ProductListProps {
  products: Product[]
  categories: string[]
  onEdit: (product: Product) => void
  onRefresh: () => void
}

export function ProductList({ products, categories, onEdit, onRefresh }: ProductListProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
    const totalStock = p.variants.reduce((s, v) => s + v.quantity, 0)
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'low' && totalStock > 0 && totalStock < 10) ||
      (stockFilter === 'out' && totalStock === 0) ||
      (stockFilter === 'ok' && totalStock >= 10)
    return matchesSearch && matchesCategory && matchesStock
  })

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Producto eliminado')
      onRefresh()
    } catch {
      toast.error('Error al eliminar producto')
    }
  }

  const getTotalStock = (variants: ProductVariant[]) =>
    variants.reduce((s, v) => s + v.quantity, 0)

  const getMinPrice = (variants: ProductVariant[]) =>
    variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : 0

  const getAvgMarginPct = (variants: ProductVariant[]) => {
    const valid = variants.filter((v) => v.price > 0)
    if (valid.length === 0) return 0
    return valid.reduce((s, v) => s + ((v.price - v.cost) / v.price) * 100, 0) / valid.length
  }

  const getStockBadge = (total: number) => {
    if (total === 0) return <Badge variant="danger">Sin stock</Badge>
    if (total < 5) return <Badge variant="danger">Crítico ({total})</Badge>
    if (total < 10) return <Badge variant="warning">Bajo ({total})</Badge>
    return <Badge variant="success">{total} uds</Badge>
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo el stock</SelectItem>
            <SelectItem value="ok">Stock OK</SelectItem>
            <SelectItem value="low">Stock bajo</SelectItem>
            <SelectItem value="out">Sin stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Product count */}
      <p className="text-sm text-gray-500">
        {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Products */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Package className="h-12 w-12 mb-3" />
          <p className="text-lg font-medium">No se encontraron productos</p>
          <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((product) => {
            const totalStock = getTotalStock(product.variants)
            const avgMargin = getAvgMarginPct(product.variants)
            const isExpanded = expandedProduct === product.id
            return (
              <Card key={product.id}>
                <CardContent className="p-0">
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() =>
                      setExpandedProduct(isExpanded ? null : product.id)
                    }
                  >
                    {/* Expand toggle */}
                    <div className="text-gray-400">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>

                    {/* Image placeholder */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-gray-400" />
                      )}
                    </div>

                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <Badge variant="secondary" className="text-xs">
                          {product.category}
                        </Badge>
                      </div>
                      {product.description && (
                        <p className="text-sm text-gray-500 truncate">{product.description}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {product.variants.length} variante{product.variants.length !== 1 ? 's' : ''} •
                        Desde {formatCurrency(getMinPrice(product.variants))}
                      </p>
                    </div>

                    {/* Margin badge */}
                    <div className="flex-shrink-0 text-right">
                      <span className="text-sm font-semibold text-emerald-600">
                        {avgMargin.toFixed(1)}%
                      </span>
                      <p className="text-xs text-gray-400">margen</p>
                    </div>

                    {/* Stock badge */}
                    <div className="flex-shrink-0">{getStockBadge(totalStock)}</div>

                    {/* Actions */}
                    <div
                      className="flex items-center gap-2 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(product)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id, product.name)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded variants */}
                  {isExpanded && product.variants.length > 0 && (
                    <div className="border-t border-gray-100 px-4 pb-4">
                      <table className="w-full mt-3 text-sm">
                        <thead>
                          <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                            <th className="pb-2 font-medium">Talle</th>
                            <th className="pb-2 font-medium">Color</th>
                            <th className="pb-2 font-medium">SKU</th>
                            <th className="pb-2 font-medium text-right">Costo</th>
                            <th className="pb-2 font-medium text-right">Precio</th>
                            <th className="pb-2 font-medium text-right">Margen $</th>
                            <th className="pb-2 font-medium text-right">Margen %</th>
                            <th className="pb-2 font-medium text-right">Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {product.variants.map((v) => (
                            <tr key={v.id} className="border-b border-gray-50 last:border-0">
                              <td className="py-2 font-medium">{v.size}</td>
                              <td className="py-2 text-gray-600">{v.color}</td>
                              <td className="py-2 text-gray-400">{v.sku ?? '-'}</td>
                              <td className="py-2 text-right text-gray-500">
                                {formatCurrency(v.cost)}
                              </td>
                              <td className="py-2 text-right font-medium">
                                {formatCurrency(v.price)}
                              </td>
                              <td className="py-2 text-right font-medium text-emerald-600">
                                {formatCurrency(v.price - v.cost)}
                              </td>
                              <td className="py-2 text-right font-medium text-emerald-600">
                                {v.price > 0
                                  ? (((v.price - v.cost) / v.price) * 100).toFixed(1) + '%'
                                  : '-'}
                              </td>
                              <td className="py-2 text-right">
                                <span
                                  className={
                                    v.quantity === 0
                                      ? 'text-red-600 font-medium'
                                      : v.quantity < 5
                                      ? 'text-orange-600 font-medium'
                                      : 'text-green-600 font-medium'
                                  }
                                >
                                  {v.quantity}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
