'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Building2,
  BarChart3,
  LogOut,
  UserCircle,
  Users,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/stock', label: 'Stock', icon: Package },
  { href: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { href: '/gastos', label: 'Gastos', icon: Receipt },
  { href: '/empresa', label: 'Empresa', icon: Building2 },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.role === 'superadmin'

  return (
    <aside className="flex h-full w-64 flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-gray-700">
        <BarChart3 className="h-7 w-7 text-blue-400" />
        <span className="text-xl font-bold text-white tracking-tight">Stocker</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}

        {isSuperAdmin && (
          <>
            <div className="pt-3 pb-1">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Administración</p>
            </div>
            <Link
              href="/admin/usuarios"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                pathname.startsWith('/admin')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Users className="h-5 w-5 flex-shrink-0" />
              Usuarios
            </Link>
          </>
        )}
      </nav>

      {/* Bottom: Profile + Sign out */}
      <div className="p-4 border-t border-gray-700 space-y-1">
        <Link
          href="/perfil"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            pathname === '/perfil'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          )}
        >
          <UserCircle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="truncate">{session?.user?.name ?? 'Mi perfil'}</p>
          </div>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
