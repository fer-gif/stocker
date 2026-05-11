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
    where.date = {}
    if (dateFrom) where.date.gte = new Date(dateFrom)
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      where.date.lte = end
    }
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(expenses)
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
    const { description, amount, category, date } = body

    if (!description || !amount || !category) {
      return NextResponse.json(
        { error: 'Descripción, monto y categoría son requeridos' },
        { status: 400 }
      )
    }

    const expense = await prisma.expense.create({
      data: {
        companyId,
        description,
        amount: Number(amount),
        category,
        date: date ? new Date(date) : new Date(),
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Error al crear gasto' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const companyId = (session.user as any).companyId
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  }

  try {
    const existing = await prisma.expense.findFirst({ where: { id, companyId } })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.expense.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar gasto' }, { status: 500 })
  }
}
