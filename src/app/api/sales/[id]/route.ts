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

  const sale = await prisma.sale.findFirst({
    where: { id, companyId },
    include: {
      user: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true } },
          variant: { select: { size: true, color: true } },
        },
      },
    },
  })

  if (!sale) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(sale)
}
