import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, UserPlus, Trash2, Mail, Crown, Shield, Eye, Brush } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { organizationsApi } from '@/api/organizations'
import { useAuthStore } from '@/store/authStore'
import { TopBar } from '@/components/layout/TopBar'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import type { OrganizationMember } from '@/types'

const inviteSchema = z.object({
  email: z.string().email('Valid email required'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER', 'CLEANER']),
})
type InviteFormData = z.infer<typeof inviteSchema>

const ROLE_ICONS: Record<string, React.ElementType> = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: Users,
  VIEWER: Eye,
  CLEANER: Brush,
}
const ROLE_COLORS: Record<string, string> = {
  OWNER: 'text-amber-700 bg-amber-50',
  ADMIN: 'text-blue-700 bg-blue-50',
  MEMBER: 'text-gray-700 bg-gray-100',
  VIEWER: 'text-gray-500 bg-gray-50',
  CLEANER: 'text-emerald-700 bg-emerald-50',
}

export function OrganizationPage() {
  const { activeOrg, user } = useAuthStore()
  const queryClient = useQueryClient()
  const orgId = activeOrg?.id
  const [showInvite, setShowInvite] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<OrganizationMember | null>(null)

  const { data: org } = useQuery({
    queryKey: ['org', orgId],
    queryFn: () => organizationsApi.getById(orgId!),
    enabled: !!orgId,
  })

  const { data: members, isLoading } = useQuery({
    queryKey: ['members', orgId],
    queryFn: () => organizationsApi.getMembers(orgId!),
    enabled: !!orgId,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'MEMBER' },
  })

  const inviteMutation = useMutation({
    mutationFn: (d: InviteFormData) => organizationsApi.inviteMember(orgId!, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', orgId] })
      toast.success('Invitation sent')
      setShowInvite(false)
      reset()
    },
  })

  const removeMutation = useMutation({
    mutationFn: () => organizationsApi.removeMember(orgId!, removeTarget!.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', orgId] })
      toast.success('Member removed')
      setRemoveTarget(null)
    },
    onError: () => toast.error('Failed to remove member'),
  })

  const isOwner = members?.find(m => m.userId === user?.id)?.role === 'OWNER'

  return (
    <div>
      <TopBar
        title="Team"
        action={isOwner ? { label: 'Invite Member', onClick: () => setShowInvite(true) } : undefined}
      />
      <div className="p-6 space-y-6">
        {/* Org info */}
        {org && (
          <div className="card p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center text-2xl font-bold text-primary-600">
              {org.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{org.name}</h2>
              <p className="text-sm text-gray-500">/{org.slug}</p>
            </div>
          </div>
        )}

        {/* Members list */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Members ({members?.length ?? 0})</h3>
          </div>
          {isLoading ? (
            <div className="p-4"><TableSkeleton rows={3} /></div>
          ) : !members?.length ? (
            <EmptyState icon={Users} title="No members" description="Invite teammates to collaborate." />
          ) : (
            <div className="divide-y divide-gray-200">
              {members.map(m => {
                const RoleIcon = ROLE_ICONS[m.role] ?? Users
                const roleColor = ROLE_COLORS[m.role] ?? ROLE_COLORS.MEMBER
                return (
                  <div key={m.userId} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-gray-600">
                        {(m.email || m.userId).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{m.email || m.userId}</p>
                      {(m.joinedAt || m.acceptedAt) ? (
                        <p className="text-xs text-gray-500">Member</p>
                      ) : (
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                          <Mail size={11} /> Invitation pending
                        </p>
                      )}
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${roleColor}`}>
                      <RoleIcon size={12} />
                      {m.role}
                    </div>
                    {isOwner && m.role !== 'OWNER' && (
                      <button
                        onClick={() => setRemoveTarget(m)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite Team Member" size="sm">
        <form onSubmit={handleSubmit(d => inviteMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input {...register('email')} type="email" className="input-base w-full" placeholder="colleague@example.com" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select {...register('role')} className="input-base w-full">
              <option value="ADMIN">Admin — full access except billing</option>
              <option value="MEMBER">Member — manage reservations and locks</option>
              <option value="VIEWER">Viewer — read-only access</option>
              <option value="CLEANER">Cleaner — assigned tasks only</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowInvite(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={inviteMutation.isPending} className="btn-primary flex items-center gap-2">
              <UserPlus size={16} />
              {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!removeTarget} onClose={() => setRemoveTarget(null)} title="Remove Member" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600">
            Remove <span className="text-gray-900 font-medium">{removeTarget?.email}</span> from the organization?
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setRemoveTarget(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => removeMutation.mutate()} disabled={removeMutation.isPending} className="btn-danger">
              {removeMutation.isPending ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
