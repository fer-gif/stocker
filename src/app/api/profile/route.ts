import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
  })

  return NextResponse.json(user)
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { name, phone, currentPassword, newPassword } = body

  const updateData: Record<string, unknown> = {}

  if (name) updateData.name = name
  updateData.phone = phone || null

  if (newPassword) {
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }
    if (!currentPassword) {
      return NextResponse.json({ error: 'Ingresá tu contraseña actual' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    const valid = await bcrypt.compare(currentPassword, user!.password)
    if (!valid) {
      return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 })
    }
    updateData.password = await bcrypt.hash(newPassword, 10)
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { id: true, name: true, email: true, phone: true, role: true },
  })

  return NextResponse.json(updated)
}
