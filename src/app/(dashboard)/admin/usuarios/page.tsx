'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, Users, Mail, Phone } from 'lucide-react'

type UserRow = {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  createdAt: string
}

const userSchema = z.object({
  name: z.string().min(2, 'Al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'superadmin']),
  password: z.string().min(6, 'Al menos 6 caracteres').optional().or(z.literal('')),
})

type UserForm = z.infer<typeof userSchema>

export default function AdminUsuariosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null)

  const form = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', email: '', phone: '', role: 'admin', password: '' },
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || session.user.role !== 'superadmin') {
      router.replace('/dashboard')
    }
  }, [session, status, router])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const openCreate = () => {
    setEditingUser(null)
    form.reset({ name: '', email: '', phone: '', role: 'admin', password: '' })
    setModalOpen(true)
  }

  const openEdit = (user: UserRow) => {
    setEditingUser(user)
    form.reset({ name: user.name, email: user.email, phone: user.phone ?? '', role: user.role as 'admin' | 'superadmin', password: '' })
    setModalOpen(true)
  }

  const onSubmit = async (data: UserForm) => {
    setSaving(true)
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users'
      const method = editingUser ? 'PATCH' : 'POST'
      const payload = { ...data, password: data.password || undefined }

      if (editingUser && !data.password) delete payload.password

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Error'); return }

      toast.success(editingUser ? 'Usuario actualizado' : 'Usuario creado')
      setModalOpen(false)
      loadUsers()
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user: UserRow) => {
    setDeletingId(user.id)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Error'); return }
      toast.success('Usuario eliminado')
      loadUsers()
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeletingId(null)
      setConfirmDelete(null)
    }
  }

  if (status === 'loading' || (session?.user?.role !== 'superadmin')) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6" /> Gestión de usuarios
          </h1>
          <p className="text-sm text-gray-500 mt-1">Creá, editá y eliminá usuarios que usan la app</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nuevo usuario
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Teléfono</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No hay usuarios</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{u.name}</span>
                      {u.id === session?.user?.id && (
                        <span className="text-xs text-gray-400">(vos)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      {u.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {u.phone ? (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        {u.phone}
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.role === 'superadmin' ? 'default' : 'secondary'}>
                      {u.role === 'superadmin' ? 'Admin' : 'Usuario'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        disabled={u.id === session?.user?.id}
                        onClick={() => setConfirmDelete(u)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input {...form.register('name')} placeholder="Juan García" />
              {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...form.register('email')} placeholder="juan@empresa.com" />
              {form.formState.errors.email && <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Teléfono <span className="text-gray-400">(opcional)</span></Label>
              <Input type="tel" {...form.register('phone')} placeholder="+54 11 1234-5678" />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={form.watch('role')} onValueChange={(v) => form.setValue('role', v as 'admin' | 'superadmin')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Usuario</SelectItem>
                  <SelectItem value="superadmin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                {editingUser ? 'Nueva contraseña' : 'Contraseña'}
                {editingUser && <span className="text-gray-400 ml-1">(dejar vacío para no cambiar)</span>}
              </Label>
              <Input type="password" {...form.register('password')} placeholder="••••••••" />
              {form.formState.errors.password && <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>}
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingUser ? 'Guardar cambios' : 'Crear usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar usuario</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            ¿Estás seguro que querés eliminar a <strong>{confirmDelete?.name}</strong>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={!!deletingId}
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              {deletingId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
