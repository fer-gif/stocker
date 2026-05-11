'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Building2, Loader2, Save, Upload } from 'lucide-react'
import { toast } from 'sonner'

const companySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.string().email('Email inválido'), z.literal('')]).optional(),
  taxId: z.string().optional(),
  currency: z.string().optional(),
  businessHours: z.string().optional(),
  logo: z.string().optional(),
})

type CompanyFormData = z.infer<typeof companySchema>

export default function EmpresaPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  })

  const logoValue = watch('logo')

  useEffect(() => {
    fetch('/api/company')
      .then((r) => r.json())
      .then((data) => {
        reset({
          name: data.name ?? '',
          address: data.address ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
          taxId: data.taxId ?? '',
          currency: data.currency ?? 'ARS',
          businessHours: data.businessHours ?? '',
          logo: data.logo ?? '',
        })
      })
      .finally(() => setLoading(false))
  }, [reset])

  const onSubmit = async (data: CompanyFormData) => {
    setSaving(true)
    try {
      const res = await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success('Empresa actualizada correctamente')
      reset(data)
    } catch {
      toast.error('Error al guardar cambios')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Header title="Empresa" />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Empresa" />
      <div className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-5 w-5 text-blue-600" />
                Información básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="name">Nombre de empresa *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Mi Empresa S.A."
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">CUIT</Label>
                  <Input
                    id="taxId"
                    {...register('taxId')}
                    placeholder="30-12345678-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <select
                    {...register('currency')}
                    className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ARS">ARS - Peso Argentino</option>
                    <option value="USD">USD - Dólar Estadounidense</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="BRL">BRL - Real Brasileño</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  {...register('address')}
                  placeholder="Av. Corrientes 1234, Buenos Aires"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="+54 11 1234-5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="contacto@empresa.com"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="h-5 w-5 text-blue-600" />
                Logo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {logoValue && (
                <div className="flex items-center gap-4">
                  <img
                    src={logoValue}
                    alt="Logo"
                    className="h-20 w-20 rounded-lg object-contain border border-gray-200 p-2"
                    onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                  />
                  <p className="text-sm text-gray-500">Vista previa del logo</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="logo">URL del logo</Label>
                <Input
                  id="logo"
                  {...register('logo')}
                  placeholder="https://ejemplo.com/logo.png o /uploads/logo.png"
                />
                <p className="text-xs text-gray-400">
                  Ingresá la URL de tu logo o subí el archivo a /public/uploads/
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Business hours */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Horarios de atención</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="businessHours">Horarios</Label>
                <Textarea
                  id="businessHours"
                  {...register('businessHours')}
                  placeholder="Lunes a Viernes: 9:00 - 18:00&#10;Sábados: 9:00 - 13:00"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving || !isDirty}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
