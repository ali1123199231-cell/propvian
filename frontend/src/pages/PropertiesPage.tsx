import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Plus, MapPin, Lock, Pencil, Trash2, MoreVertical } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { propertiesApi } from '@/api/properties'
import { useAuthStore } from '@/store/authStore'
import { TopBar } from '@/components/layout/TopBar'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatsSkeleton } from '@/components/ui/Skeleton'
import type { Property } from '@/types'
import { COUNTRIES } from '@/constants/countries'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  timezone: z.string().max(100).optional(),
  description: z.string().optional(),
  maxGuests: z.coerce.number().int().positive().optional().or(z.literal('')),
  bedrooms: z.coerce.number().int().positive().optional().or(z.literal('')),
  bathrooms: z.coerce.number().int().positive().optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

function PropertyCard({ property, onEdit, onDelete }: { property: Property; onEdit: () => void; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="card p-5 flex flex-col gap-3 hover:border-gray-300 hover:shadow-md transition-all border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
            <Building2 size={18} className="text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{property.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              property.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
              property.status === 'INACTIVE' ? 'bg-gray-100 text-gray-500' :
              'bg-amber-50 text-amber-700'
            }`}>{property.status}</span>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-36">
              <button
                onClick={() => { setMenuOpen(false); onEdit() }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDelete() }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-50 w-full"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {(property.city || property.country) && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <MapPin size={13} />
          <span>{[property.city, property.state, property.country].filter(Boolean).join(', ')}</span>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500 pt-1 border-t border-gray-200">
        <span className="flex items-center gap-1"><Lock size={12} />{property.lockCount ?? 0} locks</span>
        {property.bedrooms && <span>{property.bedrooms} bd</span>}
        {property.bathrooms && <span>{property.bathrooms} ba</span>}
        {property.maxGuests && <span>Max {property.maxGuests} guests</span>}
      </div>
    </div>
  )
}

function PropertyForm({ defaultValues, onSubmit, loading }: {
  defaultValues?: Partial<FormData>
  onSubmit: (data: FormData) => void
  loading: boolean
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Property Name *</label>
        <input {...register('name')} className="input-base w-full" placeholder="Beach House" />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input {...register('address')} className="input-base w-full" placeholder="123 Main St" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input {...register('city')} className="input-base w-full" placeholder="Miami" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input {...register('state')} className="input-base w-full" placeholder="FL" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <select {...register('country')} className="input-base w-full appearance-none">
            <option value="">Select a country…</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
          <input {...register('postalCode')} className="input-base w-full" placeholder="33101" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
          <input {...register('timezone')} className="input-base w-full" placeholder="America/New_York" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
          <input {...register('bedrooms')} type="number" className="input-base w-full" placeholder="2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
          <input {...register('bathrooms')} type="number" className="input-base w-full" placeholder="1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Guests</label>
          <input {...register('maxGuests')} type="number" className="input-base w-full" placeholder="4" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea {...register('description')} rows={3} className="input-base w-full resize-none" placeholder="Property description..." />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : 'Save Property'}
        </button>
      </div>
    </form>
  )
}

export function PropertiesPage() {
  const { activeOrg } = useAuthStore()
  const queryClient = useQueryClient()
  const orgId = activeOrg?.id
  const [showCreate, setShowCreate] = useState(false)
  const [editProp, setEditProp] = useState<Property | null>(null)
  const [deleteProp, setDeleteProp] = useState<Property | null>(null)
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['properties', orgId, page],
    queryFn: () => propertiesApi.list(orgId!, page, 12),
    enabled: !!orgId,
  })

  const createMutation = useMutation({
    mutationFn: (body: FormData) => propertiesApi.create(orgId!, {
      name: body.name,
      address: body.address || undefined,
      city: body.city || undefined,
      state: body.state || undefined,
      country: body.country || undefined,
      postalCode: body.postalCode || undefined,
      timezone: body.timezone || undefined,
      description: body.description || undefined,
      maxGuests: body.maxGuests ? Number(body.maxGuests) : undefined,
      bedrooms: body.bedrooms ? Number(body.bedrooms) : undefined,
      bathrooms: body.bathrooms ? Number(body.bathrooms) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', orgId] })
      toast.success('Property created')
      setShowCreate(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (body: FormData) => propertiesApi.update(orgId!, editProp!.id, {
      name: body.name,
      city: body.city || undefined,
      state: body.state || undefined,
      country: body.country || undefined,
      timezone: body.timezone || undefined,
      description: body.description || undefined,
      maxGuests: body.maxGuests ? Number(body.maxGuests) : undefined,
      bedrooms: body.bedrooms ? Number(body.bedrooms) : undefined,
      bathrooms: body.bathrooms ? Number(body.bathrooms) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', orgId] })
      toast.success('Property updated')
      setEditProp(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => propertiesApi.delete(orgId!, deleteProp!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', orgId] })
      toast.success('Property deleted')
      setDeleteProp(null)
    },
    onError: () => toast.error('Failed to delete property'),
  })

  const properties = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div>
      <TopBar
        title="Properties"
        action={{ label: 'Add Property', onClick: () => setShowCreate(true) }}
      />
      <div className="p-6">
        {isLoading ? (
          <StatsSkeleton />
        ) : properties.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No properties yet"
            description="Add your first short-term rental property to get started."
            action={{ label: 'Add Property', onClick: () => setShowCreate(true) }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  onEdit={() => setEditProp(p)}
                  onDelete={() => setDeleteProp(p)}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="btn-secondary disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages - 1}
                  className="btn-secondary disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Property" size="lg">
        <PropertyForm onSubmit={(d) => createMutation.mutate(d)} loading={createMutation.isPending} />
      </Modal>

      <Modal isOpen={!!editProp} onClose={() => setEditProp(null)} title="Edit Property" size="lg">
        {editProp && (
          <PropertyForm
            defaultValues={{
              name: editProp.name,
              address: editProp.address,
              city: editProp.city,
              state: editProp.state,
              country: editProp.country,
              postalCode: editProp.postalCode,
              timezone: editProp.timezone,
              description: editProp.description,
              maxGuests: editProp.maxGuests,
              bedrooms: editProp.bedrooms,
              bathrooms: editProp.bathrooms,
            }}
            onSubmit={(d) => updateMutation.mutate(d)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      <Modal isOpen={!!deleteProp} onClose={() => setDeleteProp(null)} title="Delete Property" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <span className="text-gray-900 font-medium">{deleteProp?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteProp(null)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="btn-danger"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
