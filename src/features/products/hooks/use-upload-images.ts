import { useMutation } from '@tanstack/react-query'
import { uploadImages } from '../api/uploads'

/**
 * useUploadImages — mutation hook for POST /api/uploads/images.
 * @returns TanStack mutation result: call `mutateAsync({ files, onProgress })` to get the uploaded URLs.
 */
export const useUploadImages = () => {
  return useMutation({
    mutationFn: ({ files, onProgress }: { files: File[]; onProgress?: (percent: number) => void }) =>
      uploadImages(files, onProgress),
  })
}
