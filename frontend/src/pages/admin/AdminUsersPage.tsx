import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, type AdminUser } from '@/api/admin'
import { Search, ChevronLeft, ChevronRight, Shield, UserX, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLES = ['USER', 'ADMIN', 'SUPER_ADMIN']

function RoleBadge({ role }: { role: string }) {
  const cfg: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-900/40 text-purple-300 border border-purple-700/40',
    ADMIN:       'bg-amber-900/40 text-amber-300 border border-amber-700/40',
    USER:        'bg-gray-700 text-gray-300 border border-gray-600',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg[role] ?? cfg['USER']}`}>
      {role}
    </span>
  )
}

function UserRow({ user, onRoleChange, onDeactivate }: {
  user: AdminUser
  onRoleChange: (userId: string, role: string) => void
  onDeactivate: (userId: string) => void
}) {
  const [showRoleMenu, setShowRoleMenu] = useState(false)

  return (
    <tr className="border-b border-gray-700 hover:bg-gray-800/50">
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-200">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {user.emailVerified
            ? <CheckCircle size={14} className="text-green-500" />
            : <XCircle size={14} className="text-red-500" />}
          <span className="text-xs text-gray-400">{user.emailVerified ? 'Verified' : 'Unverified'}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">
        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '—'}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Role change */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
              title="Change role"
            >
              <Shield size={14} />
            </button>
            {showRoleMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-10">
                {ROLES.filter(r => r !== user.role).map(r => (
                  <button
                    key={r}
                    onClick={() => { onRoleChange(user.id, r); setShowRoleMenu(false) }}
                    className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                  >
                    Set {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Deactivate */}
          <button
            onClick={() => onDeactivate(user.id)}
            className="p-1.5 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"
            title="Deactivate user"
          >
            <UserX size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export function AdminUsersPage() {
  const qc = useQueryClient()
  const [q, setQ]     = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', q, page],
    queryFn: () => adminApi.listUsers(q || undefined, page),
  })

  const roleMut = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => adminApi.changeUserRole(userId, role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Role updated') },
    onError: () => toast.error('Failed to update role'),
  })

  const deactivateMut = useMutation({
    mutationFn: (userId: string) => adminApi.deactivateUser(userId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User deactivated') },
    onError: () => toast.error('Failed to deactivate user'),
  })

  const handleDeactivate = (userId: string) => {
    if (confirm('Deactivate this user? They will no longer be able to log in.')) {
      deactivateMut.mutate(userId)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {data ? `${data.totalElements} total` : ''}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={q}
          onChange={e => { setQ(e.target.value); setPage(0) }}
          className="w-full max-w-sm pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800/80">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Login</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            ) : data?.content.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">No users found</td>
              </tr>
            ) : data?.content.map(user => (
              <UserRow
                key={user.id}
                user={user}
                onRoleChange={(userId, role) => roleMut.mutate({ userId, role })}
                onDeactivate={handleDeactivate}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Page {page + 1} of {data.totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={data.first}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={data.last}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
