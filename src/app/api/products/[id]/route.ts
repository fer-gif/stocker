import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const companyId = (session.user as any).companyId

  const product = await prisma.product.findFirst({
    where: { id, companyId },
    include: { variants: true },
  })

  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(product)
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const companyId = (session.user as any).companyId

  try {
    const body = await request.json()
    const { name, description, category, imageUrl, variants } = body

    // Verify ownership
    const existing = await prisma.product.findFirst({ where: { id, companyId } })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Update product and replace variants
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description: description || null,
        category,
        imageUrl: imageUrl || null,
        variants: {
          deleteMany: {},
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

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const companyId = (session.user as any).companyId

  try {
    const existing = await prisma.product.findFirst({ where: { id, companyId } })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}
