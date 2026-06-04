import { useQuery, useMutation } from '@tanstack/react-query'
import { Loader2, Home, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { websiteBuilderApi, type WebsiteConfig } from '@/api/websiteBuilder'
import { organizationsApi } from '@/api/organizations'
import { propertiesApi } from '@/api/properties'
import { SetupWizard } from './website/SetupWizard'
import { WebsiteBuilder } from './website/WebsiteBuilder'

export function WebsitePage() {
  const { activeOrg, setActiveOrg } = useAuthStore()
  const orgId = activeOrg?.id ?? ''

  const { data: config, isLoading: configLoading, refetch } = useQuery({
    queryKey: ['website-config', orgId],
    queryFn: () => websiteBuilderApi.getConfig(orgId),
    enabled: !!orgId,
  })

  const { data: propertiesPage, isLoading: propsLoading } = useQuery({
    queryKey: ['properties', orgId],
    queryFn: () => propertiesApi.list(orgId),
    enabled: !!orgId,
  })

  const property = propertiesPage?.content?.[0] ?? null

  const completeMut = useMutation({
    mutationFn: async ({ data, siteSlug }: { data: Partial<WebsiteConfig>; siteSlug: string }) => {
      // Update the org slug first so the public URL is set before the site goes live
      const updatedOrg = await organizationsApi.updateSlug(orgId, siteSlug)
      // Sync the updated slug into the auth store so the builder shows the correct URL immediately
      if (activeOrg) setActiveOrg({ ...activeOrg, slug: updatedOrg.slug })
      await websiteBuilderApi.updateConfig(orgId, { ...data, setupCompleted: true })
    },
    onSuccess: () => {
      refetch()
      toast.success('Your website is ready!')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to save setup'),
  })

  if (configLoading || propsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-primary-500" />
      </div>
    )
  }

  if (!propsLoading && (propertiesPage?.content?.length ?? 0) === 0) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Home size={28} className="text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Add a property first</h2>
          <p className="text-sm text-gray-500 mb-6">
            You need at least one property before you can build your website. Your listings will appear on your site automatically.
          </p>
          <Link to="/properties" className="btn-primary justify-center gap-2">
            Go to Properties <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    )
  }

  if (!config || !config.setupCompleted) {
    return (
      <SetupWizard
        property={property}
        orgName={activeOrg?.name ?? 'My Property'}
        existingSlug={activeOrg?.slug?.startsWith('org-') ? undefined : activeOrg?.slug}
        onComplete={(data, siteSlug) => completeMut.mutate({ data, siteSlug })}
        isSubmitting={completeMut.isPending}
      />
    )
  }

  return (
    <WebsiteBuilder
      orgId={orgId}
      orgSlug={activeOrg?.slug}
      property={property}
      initialConfig={config}
    />
  )
}
