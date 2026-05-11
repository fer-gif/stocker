'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { User, Mail, Phone, Shield, Loader2, KeyRound } from 'lucide-react'

const profileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresá tu contraseña actual'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function PerfilPage() {
  const { data: session, update } = useSession()
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [profileData, setProfileData] = useState<{ name: string; email: string; phone: string | null; role: string } | null>(null)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', phone: '' },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        setProfileData(data)
        profileForm.reset({ name: data.name, phone: data.phone ?? '' })
      })
  }, [])

  const onSaveProfile = async (data: ProfileForm) => {
    setSavingProfile(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, phone: data.phone }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Error al guardar'); return }
      setProfileData((prev) => prev ? { ...prev, name: json.name, phone: json.phone } : prev)
      await update({ name: json.name })
      toast.success('Perfil actualizado')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSavingProfile(false)
    }
  }

  const onChangePassword = async (data: PasswordForm) => {
    setSavingPassword(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Error al cambiar contraseña'); return }
      toast.success('Contraseña actualizada')
      passwordForm.reset()
    } catch {
      toast.error('Error al cambiar contraseña')
    } finally {
      setSavingPassword(false)
    }
  }

  const roleLabel = (role: string) => role === 'superadmin' ? 'Administrador' : 'Usuario'

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-sm text-gray-500 mt-1">Gestioná tu información personal</p>
      </div>

      {/* Avatar + info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white text-2xl font-bold flex-shrink-0">
              {profileData?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{profileData?.name ?? '...'}</p>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                <Mail className="h-3.5 w-3.5" />
                <span>{profileData?.email ?? '...'}</span>
              </div>
              {profileData?.phone && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{profileData.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                <Shield className="h-3.5 w-3.5" />
                <span>{profileData ? roleLabel(profileData.role) : '...'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Datos personales
          </CardTitle>
          <CardDescription>Tu nombre y teléfono de contacto</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" {...profileForm.register('name')} />
              {profileForm.formState.errors.name && (
                <p className="text-xs text-red-500">{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-display">Email</Label>
              <Input id="email-display" value={profileData?.email ?? ''} disabled className="bg-gray-50 text-gray-500" />
              <p className="text-xs text-gray-400">El email no se puede modificar</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" type="tel" placeholder="+54 11 1234-5678" {...profileForm.register('phone')} />
            </div>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> Cambiar contraseña
          </CardTitle>
          <CardDescription>Usá una contraseña segura de al menos 6 caracteres</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña actual</Label>
              <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-xs text-red-500">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-red-500">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
              <Input id="confirmPassword" type="password" {...passwordForm.register('confirmPassword')} />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cambiar contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
