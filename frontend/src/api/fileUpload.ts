import { apiClient } from './client'

export const fileUploadApi = {
  async upload(file: File, orgId: string): Promise<{ path: string; url: string }> {
    const form = new FormData()
    form.append('file', file)
    form.append('orgId', orgId)
    const res = await apiClient.post<{ success: boolean; data: { path: string; url: string } }>(
      '/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return res.data.data
  },
}
