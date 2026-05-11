import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create company
  const company = await prisma.company.upsert({
    where: { id: 'demo-company' },
    update: {},
    create: {
      id: 'demo-company',
      name: 'Mi Empresa S.A.',
      address: 'Av. Corrientes 1234, Buenos Aires',
      phone: '+54 11 1234-5678',
      email: 'contacto@miempresa.com',
      taxId: '30-12345678-9',
      currency: 'ARS',
    },
  })

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'admin@stocker.com' },
    update: { role: 'superadmin' },
    create: {
      email: 'admin@stocker.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'superadmin',
      companyId: company.id,
    },
  })

  // Create products
  const categories = ['Remeras', 'Pantalones', 'Camperas', 'Accesorios']
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  const colors = ['Negro', 'Blanco', 'Azul', 'Rojo', 'Verde']

  const products = [
    {
      name: 'Remera Básica',
      description: 'Remera de algodón 100%',
      category: 'Remeras',
      variants: [
        { size: 'S', color: 'Negro', quantity: 15, price: 3500, cost: 1800 },
        { size: 'M', color: 'Negro', quantity: 20, price: 3500, cost: 1800 },
        { size: 'L', color: 'Negro', quantity: 8, price: 3500, cost: 1800 },
        { size: 'S', color: 'Blanco', quantity: 12, price: 3500, cost: 1800 },
        { size: 'M', color: 'Blanco', quantity: 3, price: 3500, cost: 1800 },
        { size: 'L', color: 'Blanco', quantity: 25, price: 3500, cost: 1800 },
      ],
    },
    {
      name: 'Jeans Clásico',
      description: 'Jean de denim resistente',
      category: 'Pantalones',
      variants: [
        { size: 'S', color: 'Azul', quantity: 10, price: 8500, cost: 4500 },
        { size: 'M', color: 'Azul', quantity: 15, price: 8500, cost: 4500 },
        { size: 'L', color: 'Azul', quantity: 4, price: 8500, cost: 4500 },
        { size: 'XL', color: 'Azul', quantity: 2, price: 8500, cost: 4500 },
        { size: 'M', color: 'Negro', quantity: 8, price: 8500, cost: 4500 },
        { size: 'L', color: 'Negro', quantity: 6, price: 8500, cost: 4500 },
      ],
    },
    {
      name: 'Campera Deportiva',
      description: 'Campera liviana para deportes',
      category: 'Camperas',
      variants: [
        { size: 'S', color: 'Negro', quantity: 5, price: 12000, cost: 6500 },
        { size: 'M', color: 'Negro', quantity: 7, price: 12000, cost: 6500 },
        { size: 'L', color: 'Azul', quantity: 3, price: 12000, cost: 6500 },
        { size: 'XL', color: 'Rojo', quantity: 2, price: 12000, cost: 6500 },
      ],
    },
    {
      name: 'Gorra Snapback',
      description: 'Gorra ajustable con visera plana',
      category: 'Accesorios',
      variants: [
        { size: 'UNICO', color: 'Negro', quantity: 20, price: 2500, cost: 1200 },
        { size: 'UNICO', color: 'Blanco', quantity: 15, price: 2500, cost: 1200 },
        { size: 'UNICO', color: 'Azul', quantity: 8, price: 2500, cost: 1200 },
      ],
    },
    {
      name: 'Buzo Hoodie',
      description: 'Buzo con capucha de felpa',
      category: 'Camperas',
      variants: [
        { size: 'S', color: 'Gris', quantity: 4, price: 9500, cost: 5000 },
        { size: 'M', color: 'Gris', quantity: 10, price: 9500, cost: 5000 },
        { size: 'L', color: 'Negro', quantity: 6, price: 9500, cost: 5000 },
        { size: 'XL', color: 'Negro', quantity: 1, price: 9500, cost: 5000 },
      ],
    },
  ]

  const createdProducts = []
  for (const p of products) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        category: p.category,
        companyId: company.id,
        variants: {
          create: p.variants.map((v) => ({
            size: v.size,
            color: v.color,
            quantity: v.quantity,
            price: v.price,
            cost: v.cost,
          })),
        },
      },
      include: { variants: true },
    })
    createdProducts.push(product)
  }

  // Create sample sales for the last 30 days
  const paymentMethods = ['cash', 'card', 'transfer']
  const customerNames = ['Juan García', 'María López', 'Carlos Rodríguez', null, null, 'Ana Martínez']

  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const saleDate = new Date()
    saleDate.setDate(saleDate.getDate() - daysAgo)

    const numSales = Math.floor(Math.random() * 3) + 1

    for (let j = 0; j < numSales; j++) {
      const product = createdProducts[Math.floor(Math.random() * createdProducts.length)]
      const variant = product.variants[Math.floor(Math.random() * product.variants.length)]
      const quantity = Math.floor(Math.random() * 3) + 1
      const total = variant.price * quantity

      await prisma.sale.create({
        data: {
          companyId: company.id,
          userId: user.id,
          customerName: customerNames[Math.floor(Math.random() * customerNames.length)] as string | null,
          total,
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          createdAt: saleDate,
          items: {
            create: [
              {
                productId: product.id,
                variantId: variant.id,
                quantity,
                price: variant.price,
              },
            ],
          },
        },
      })
    }
  }

  // Create sample expenses
  const expenseCategories = ['alquiler', 'servicios', 'mercaderia', 'otros']
  const expenseDescriptions: Record<string, string[]> = {
    alquiler: ['Alquiler local mes anterior', 'Alquiler depósito'],
    servicios: ['Factura luz', 'Factura internet', 'Factura gas'],
    mercaderia: ['Compra remeras proveedor A', 'Compra jeans proveedor B', 'Compra accesorios'],
    otros: ['Material de limpieza', 'Útiles de oficina', 'Publicidad redes sociales'],
  }

  for (let i = 0; i < 20; i++) {
    const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)]
    const descriptions = expenseDescriptions[category]
    const description = descriptions[Math.floor(Math.random() * descriptions.length)]
    const amount = Math.floor(Math.random() * 50000) + 5000

    const daysAgo = Math.floor(Math.random() * 60)
    const expenseDate = new Date()
    expenseDate.setDate(expenseDate.getDate() - daysAgo)

    await prisma.expense.create({
      data: {
        companyId: company.id,
        description,
        amount,
        category,
        date: expenseDate,
      },
    })
  }

  console.log('Seeding complete!')
  console.log('Login credentials:')
  console.log('  Email: admin@stocker.com')
  console.log('  Password: admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
