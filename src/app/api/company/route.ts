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

  const company = await prisma.company.findUnique({ where: { id: companyId } })
  if (!company) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(company)
}

export async function PUT(request: NextRequest) {
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
    const { name, address, phone, email, taxId, currency, businessHours, logo } = body

    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: name || undefined,
        address: address || null,
        phone: phone || null,
        email: email || null,
        taxId: taxId || null,
        currency: currency || 'ARS',
        businessHours: businessHours || null,
        logo: logo || null,
      },
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error updating company:', error)
    return NextResponse.json({ error: 'Error al actualizar empresa' }, { status: 500 })
  }
}
