import { apiClient } from './client'
import { logger } from '@/lib/logger'

const log = logger.child('SYSTEM')

export const fileUploadApi = {
  async upload(file: File): Promise<{ path: string; url: string }> {
    log.info('fileUpload.upload — name=%s size=%d type=%s', file.name, file.size, file.type)
    const form = new FormData()
    form.append('file', file)
    const res = await apiClient.post<{ success: boolean; data: { path: string; url: string } }>(
      '/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    log.info('fileUpload.upload — success path=%s', res.data.data.path)
    return res.data.data
  },
}
