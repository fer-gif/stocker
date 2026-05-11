import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const companyId = (session.user as any).companyId
  if (!companyId) {
    return NextResponse.json({ error: 'No company' }, { status: 400 })
  }

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const start30Days = new Date()
  start30Days.setDate(start30Days.getDate() - 29)
  start30Days.setHours(0, 0, 0, 0)

  // Sales today
  const salesToday = await prisma.sale.aggregate({
    where: { companyId, createdAt: { gte: startOfDay } },
    _sum: { total: true },
    _count: true,
  })

  // Sales this week
  const salesWeek = await prisma.sale.aggregate({
    where: { companyId, createdAt: { gte: startOfWeek } },
    _sum: { total: true },
    _count: true,
  })

  // Sales this month
  const salesMonth = await prisma.sale.aggregate({
    where: { companyId, createdAt: { gte: startOfMonth } },
    _sum: { total: true },
    _count: true,
  })

  // Total expenses this month
  const expensesMonth = await prisma.expense.aggregate({
    where: { companyId, date: { gte: startOfMonth } },
    _sum: { amount: true },
  })

  // Total products
  const totalProducts = await prisma.product.count({ where: { companyId } })

  // Low stock variants
  const lowStockVariants = await prisma.productVariant.findMany({
    where: {
      quantity: { lt: 5 },
      product: { companyId },
    },
    include: { product: { select: { name: true } } },
    orderBy: { quantity: 'asc' },
    take: 10,
  })

  // Sales last 30 days grouped by day
  const salesLast30 = await prisma.sale.findMany({
    where: { companyId, createdAt: { gte: start30Days } },
    select: { createdAt: true, total: true },
    orderBy: { createdAt: 'asc' },
  })

  // Group by date
  const salesByDay: Record<string, { total: number; count: number }> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(start30Days)
    d.setDate(d.getDate() + i)
    const key = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
    salesByDay[key] = { total: 0, count: 0 }
  }

  for (const sale of salesLast30) {
    const key = new Date(sale.createdAt).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
    })
    if (salesByDay[key]) {
      salesByDay[key].total += sale.total
      salesByDay[key].count += 1
    }
  }

  const salesChartData = Object.entries(salesByDay).map(([date, data]) => ({
    date,
    total: data.total,
    count: data.count,
  }))

  // Top products by sales (this month)
  const topProductItems = await prisma.saleItem.findMany({
    where: { sale: { companyId, createdAt: { gte: startOfMonth } } },
    include: { product: { select: { name: true } } },
  })

  const productTotals: Record<string, { name: string; total: number; quantity: number }> = {}
  for (const item of topProductItems) {
    const key = item.productId
    if (!productTotals[key]) {
      productTotals[key] = { name: item.product.name, total: 0, quantity: 0 }
    }
    productTotals[key].total += item.price * item.quantity
    productTotals[key].quantity += item.quantity
  }

  const topProducts = Object.values(productTotals)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // Margin analysis by product
  const allProducts = await prisma.product.findMany({
    where: { companyId },
    select: { name: true, variants: { select: { price: true, cost: true } } },
  })

  const marginByProduct = allProducts
    .map((p) => {
      const variants = p.variants.filter((v) => v.price > 0)
      if (variants.length === 0) return { name: p.name, marginPct: 0, marginAbs: 0 }
      const avgPct =
        variants.reduce((s, v) => s + ((v.price - v.cost) / v.price) * 100, 0) / variants.length
      const avgAbs =
        variants.reduce((s, v) => s + (v.price - v.cost), 0) / variants.length
      return {
        name: p.name,
        marginPct: Math.round(avgPct * 10) / 10,
        marginAbs: Math.round(avgAbs),
      }
    })
    .sort((a, b) => b.marginPct - a.marginPct)

  const bestMarginProduct = marginByProduct[0] ?? null

  // Recent sales (last 5)
  const recentSales = await prisma.sale.findMany({
    where: { companyId },
    include: {
      items: {
        include: { product: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return NextResponse.json({
    salesToday: salesToday._sum.total ?? 0,
    salesTodayCount: salesToday._count,
    salesWeek: salesWeek._sum.total ?? 0,
    salesWeekCount: salesWeek._count,
    salesMonth: salesMonth._sum.total ?? 0,
    salesMonthCount: salesMonth._count,
    expensesMonth: expensesMonth._sum.amount ?? 0,
    totalProducts,
    lowStockCount: lowStockVariants.length,
    lowStockItems: lowStockVariants.map((v) => ({
      id: v.id,
      productName: v.product.name,
      size: v.size,
      color: v.color,
      quantity: v.quantity,
    })),
    salesChartData,
    topProducts,
    recentSales,
    marginByProduct,
    bestMarginProduct,
  })
}
