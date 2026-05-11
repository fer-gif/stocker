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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const { name, email, phone, role, password } = body

  const target = await prisma.user.findUnique({ where: { id } })
  if (!target || target.createdBy !== admin.id) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  if (email && email !== target.email) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'El email ya está en uso' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if (name) updateData.name = name
  if (email) updateData.email = email
  updateData.phone = phone || null
  if (role) updateData.role = role === 'superadmin' ? 'superadmin' : 'admin'
  if (password) {
    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }
    updateData.password = await bcrypt.hash(password, 10)
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params

  if (id === admin.id) {
    return NextResponse.json({ error: 'No podés eliminar tu propio usuario' }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id } })
  if (!target || target.createdBy !== admin.id) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  // Eliminar también la empresa del usuario si está vacía
  await prisma.user.delete({ where: { id } })
  if (target.companyId) {
    const hasOthers = await prisma.user.count({ where: { companyId: target.companyId } })
    if (hasOthers === 0) {
      await prisma.company.delete({ where: { id: target.companyId } }).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true })
}
