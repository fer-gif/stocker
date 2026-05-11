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

  const { searchParams } = new URL(request.url)
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  const where: any = { companyId }

  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      where.createdAt.lte = end
    }
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      user: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true } },
          variant: { select: { size: true, color: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(sales)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const companyId = (session.user as any).companyId
  const userId = (session.user as any).id

  if (!companyId || !userId) {
    return NextResponse.json({ error: 'No company or user' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { customerName, paymentMethod, notes, total, items } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'La venta necesita al menos un producto' }, { status: 400 })
    }

    // Verify all variants exist and have enough stock
    for (const item of items) {
      const variant = await prisma.productVariant.findFirst({
        where: {
          id: item.variantId,
          product: { companyId },
        },
      })
      if (!variant) {
        return NextResponse.json(
          { error: `Variante no encontrada: ${item.variantId}` },
          { status: 400 }
        )
      }
      if (variant.quantity < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${item.variantId}` },
          { status: 400 }
        )
      }
    }

    // Create sale and decrement stock atomically
    const sale = await prisma.$transaction(async (tx) => {
      // Decrement stock
      for (const item of items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { quantity: { decrement: item.quantity } },
        })
      }

      // Create sale
      return tx.sale.create({
        data: {
          companyId,
          userId,
          customerName: customerName || null,
          total,
          paymentMethod,
          notes: notes || null,
          items: {
            create: items.map((i: any) => ({
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity,
              price: i.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: { select: { name: true } },
              variant: { select: { size: true, color: true } },
            },
          },
        },
      })
    })

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    console.error('Error creating sale:', error)
    return NextResponse.json({ error: 'Error al registrar venta' }, { status: 500 })
  }
}
