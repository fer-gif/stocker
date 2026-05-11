'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { ProductList } from '@/components/stock/ProductList'
import { ProductForm } from '@/components/stock/ProductForm'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

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

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const categories = [...new Set(products.map((p) => p.category))].sort()

  const handleEdit = (product: Product) => {
    setEditProduct(product)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditProduct(null)
  }

  return (
    <div>
      <Header title="Stock" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Gestión de productos</h2>
            <p className="text-sm text-gray-500">
              {products.length} productos en inventario
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo producto
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <ProductList
            products={products}
            categories={categories}
            onEdit={handleEdit}
            onRefresh={fetchProducts}
          />
        )}
      </div>

      <ProductForm
        open={formOpen}
        onClose={handleFormClose}
        onSaved={fetchProducts}
        editProduct={editProduct}
      />
    </div>
  )
}
