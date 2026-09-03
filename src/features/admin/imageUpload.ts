import { adminApi } from './api'
export { resolveImageUrl } from '../../lib/imageUrl'
import type { RoomImageType, UploadedImage } from './types'

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024
export const MAX_ROOM_IMAGE_COUNT = 10
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

export type UploadStatus = 'selected' | 'uploading' | 'uploaded' | 'failed'

export type PendingImage = {
  clientId: string
  file: File
  previewUrl: string
  status: UploadStatus
  progress: number
  uploaded?: UploadedImage
  errorMessage?: string
  imageType: RoomImageType
  sortOrder: number
}

export function validateImageFile(file: File) {
  if (!allowedTypes.has(file.type)) return 'JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.'
  if (file.size > MAX_IMAGE_SIZE) return '이미지는 한 장당 10MB 이하여야 합니다.'
  return null
}

export function createPendingImage(file: File, sortOrder = 0): PendingImage {
  return {
    clientId: crypto.randomUUID(),
    file,
    previewUrl: URL.createObjectURL(file),
    status: 'selected',
    progress: 0,
    imageType: sortOrder === 0 ? 'MAIN' : 'ETC',
    sortOrder,
  }
}

export async function uploadPendingImage(
  image: PendingImage,
  category: 'rooms' | 'facilities',
  update: (patch: Partial<PendingImage>) => void,
) {
  update({ status: 'uploading', progress: 0, errorMessage: undefined })
  try {
    const uploaded = await adminApi.uploadImage(image.file, category, (progress) =>
      update({ progress }),
    )
    update({ status: 'uploaded', progress: 100, uploaded })
    return uploaded
  } catch (error) {
    const message = error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.'
    update({ status: 'failed', errorMessage: message })
    throw error
  }
}
