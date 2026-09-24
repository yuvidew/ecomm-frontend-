import { http } from '@/lib/http'
import type { UploadImagesResponse } from '../types/products'

/**
 * uploadImages — calls POST /api/uploads/images (admin only) as multipart
 * form data, one `images` part per file.
 * @param onProgress - called with 0-100 as the upload progresses
 * @returns the public Appwrite URLs of the uploaded files, in input order
 */
export const uploadImages = async (files: File[], onProgress?: (percent: number) => void): Promise<string[]> => {
  const formData = new FormData()
  files.forEach((file) => formData.append('images', file))
  const { data } = await http.post<UploadImagesResponse>('/api/uploads/images', formData, {
    onUploadProgress: (event) => {
      if (!onProgress || !event.total) return
      onProgress(Math.round((event.loaded / event.total) * 100))
    },
  })
  return data.images
}
