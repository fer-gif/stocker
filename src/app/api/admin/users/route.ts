import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user) return null
  if (session.user.role !== 'superadmin') return null
  return session.user
}

export async function GET() {
  const admin = await requireSuperAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const users = await prisma.user.findMany({
    where: { createdBy: admin.id },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const admin = await requireSuperAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await request.json()
  const { name, email, password, phone, role } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Nombre, email y contraseña son requeridos' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 10)

  // Cada usuario nuevo tiene su propia empresa vacía
  const company = await prisma.company.create({
    data: {
      name: `Empresa de ${name}`,
      currency: 'ARS',
    },
  })

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      phone: phone || null,
      role: role === 'superadmin' ? 'superadmin' : 'admin',
      companyId: company.id,
      createdBy: admin.id,
    },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
  })

  return NextResponse.json(user, { status: 201 })
}
