import { apiClient } from './client'

export const fileUploadApi = {
  async upload(file: File): Promise<{ path: string; url: string }> {
    const form = new FormData()
    form.append('file', file)
    // orgId is no longer passed from the client — the server derives it from the JWT
    const res = await apiClient.post<{ success: boolean; data: { path: string; url: string } }>(
      '/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return res.data.data
  },
}
