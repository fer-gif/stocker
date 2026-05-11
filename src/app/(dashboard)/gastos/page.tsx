'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { StatsCard } from '@/components/dashboard/StatsCard'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash2, Loader2, Receipt, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate, EXPENSE_CATEGORIES } from '@/lib/utils'

const expenseSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'El monto debe ser mayor a 0'),
  category: z.string().min(1, 'La categoría es requerida'),
  date: z.string().min(1, 'La fecha es requerida'),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  createdAt: string
}

const categoryColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'danger'> = {
  alquiler: 'danger',
  servicios: 'warning',
  mercaderia: 'default',
  otros: 'secondary',
}

export default function GastosPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  })

  const fetchExpenses = async () => {
    const params = new URLSearchParams()
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    try {
      const res = await fetch(`/api/expenses?${params}`)
      const data = await res.json()
      setExpenses(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [dateFrom, dateTo])

  const onSubmit = async (data: ExpenseFormData) => {
    setSaving(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, amount: Number(data.amount) }),
      })
      if (!res.ok) throw new Error()
      toast.success('Gasto registrado')
      reset({ date: new Date().toISOString().split('T')[0] })
      setFormOpen(false)
      fetchExpenses()
    } catch {
      toast.error('Error al registrar gasto')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Gasto eliminado')
      fetchExpenses()
    } catch {
      toast.error('Error al eliminar gasto')
    }
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  const byCategory = Object.keys(EXPENSE_CATEGORIES).reduce(
    (acc, cat) => {
      acc[cat] = expenses
        .filter((e) => e.category === cat)
        .reduce((s, e) => s + e.amount, 0)
      return acc
    },
    {} as Record<string, number>
  )

  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      <Header title="Gastos" />
      <div className="p-6 space-y-6">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Registro de gastos</h2>
            <p className="text-sm text-gray-500">{expenses.length} gastos registrados</p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo gasto
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total gastos"
            value={formatCurrency(total)}
            subtitle={`${expenses.length} registros`}
            icon={TrendingDown}
            color="red"
          />
          {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
            <StatsCard
              key={key}
              title={label}
              value={formatCurrency(byCategory[key] ?? 0)}
              icon={Receipt}
              color={
                key === 'alquiler' ? 'red' :
                key === 'servicios' ? 'orange' :
                key === 'mercaderia' ? 'blue' :
                'purple'
              }
            />
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-500 whitespace-nowrap">Desde:</span>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-500 whitespace-nowrap">Hasta:</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
            />
          </div>
          {(dateFrom || dateTo) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setDateFrom(''); setDateTo('') }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-400">
                      No hay gastos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>
                        <Badge variant={categoryColors[expense.category] ?? 'secondary'}>
                          {EXPENSE_CATEGORIES[expense.category] ?? expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(expense.date)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(expense.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Form dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) { reset({ date: today }); setFormOpen(false) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar gasto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Input
                id="description"
                {...register('description')}
                placeholder="Ej: Factura de luz"
              />
              {errors.description && (
                <p className="text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto (ARS) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('amount')}
                  placeholder="0"
                />
                {errors.amount && (
                  <p className="text-xs text-red-500">{errors.amount.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input id="date" type="date" {...register('date')} />
                {errors.date && (
                  <p className="text-xs text-red-500">{errors.date.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <select
                {...register('category')}
                className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar categoría...</option>
                {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-red-500">{errors.category.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { reset({ date: today }); setFormOpen(false) }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar gasto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
