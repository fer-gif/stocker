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

  const products = await prisma.product.findMany({
    where: { companyId },
    include: { variants: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(products)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const companyId = (session.user as any).companyId
  if (!companyId) {
    return NextResponse.json({ error: 'No company' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { name, description, category, imageUrl, variants } = body

    if (!name || !category) {
      return NextResponse.json({ error: 'Nombre y categoría son requeridos' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        category,
        imageUrl: imageUrl || null,
        companyId,
        variants: {
          create: (variants ?? []).map((v: any) => ({
            size: v.size,
            color: v.color,
            quantity: Number(v.quantity) || 0,
            price: Number(v.price) || 0,
            cost: Number(v.cost) || 0,
            sku: v.sku || null,
          })),
        },
      },
      include: { variants: true },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}
