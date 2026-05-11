import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, companyName } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Create company and user together
    const company = await prisma.company.create({
      data: {
        name: companyName || `Empresa de ${name}`,
        currency: 'ARS',
      },
    })

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'admin',
        companyId: company.id,
      },
    })

    return NextResponse.json(
      { message: 'Usuario creado exitosamente', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error registering user:', error)
    return NextResponse.json({ error: 'Error al registrar usuario' }, { status: 500 })
  }
}
