import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { ImagePlusIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/http'
import { useUploadImages } from '../hooks/use-upload-images'

// mirror the backend multer limits so bad files are rejected before uploading
const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_FILES_PER_UPLOAD = 10

/**
 * ImageUploader — picks (by click or drag-and-drop) image files, uploads
 * them immediately to POST /api/uploads/images with a real progress bar,
 * and manages the resulting list of URLs (thumbnails with a remove button
 * each).
 * @param id - id for the hidden file input, so a FieldLabel can point at it
 * @param value - current image URLs, in display order
 * @param onChange - called with the next list of URLs after an upload or removal
 * @param onUploadingChange - called with true/false as an upload starts/ends, so the parent can block submit
 */
export const ImageUploader = ({
  id,
  value,
  onChange,
  onUploadingChange,
}: {
  id: string
  value: string[]
  onChange: (urls: string[]) => void
  onUploadingChange: (uploading: boolean) => void
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const { mutateAsync, isPending, isError, error, reset } = useUploadImages()

  const validate = (files: File[]) => {
    if (files.length > MAX_FILES_PER_UPLOAD) {
      return `Select at most ${MAX_FILES_PER_UPLOAD} images at a time.`
    }
    const invalid = files.find((file) => !file.type.startsWith('image/') || file.size > MAX_FILE_BYTES)
    if (invalid) {
      return `"${invalid.name}" must be an image of 5 MB or less.`
    }
    return null
  }

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return
    reset()
    const validationMessage = validate(files)
    if (validationMessage) {
      setValidationError(validationMessage)
      return
    }
    setValidationError(null)

    onUploadingChange(true)
    setProgress(0)
    try {
      const urls = await mutateAsync({ files, onProgress: setProgress })
      onChange([...value, ...urls])
    } catch {
      // surfaced below via the mutation's `error`
    } finally {
      onUploadingChange(false)
    }
  }

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    // allow re-selecting the same file after removing it
    event.target.value = ''
    uploadFiles(files)
  }

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    if (isPending) return
    uploadFiles(Array.from(event.dataTransfer.files))
  }

  const handleRemove = (url: string) => onChange(value.filter((current) => current !== url))

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((url, index) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
            <img
              src={url}
              alt={`Product image ${index + 1}`}
              width={400}
              height={400}
              className="size-full object-cover"
            />
            {index === 0 && (
              <span className="absolute bottom-1 left-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">
                Cover
              </span>
            )}
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute top-1 right-1 size-6 opacity-90"
              onClick={() => handleRemove(url)}
              aria-label={`Remove image ${index + 1}`}
            >
              <XIcon className="size-3.5" />
            </Button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            if (!isPending) setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          disabled={isPending}
          className={cn(
            'flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed p-2 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-60',
            isDragOver && 'border-primary bg-primary/5 text-primary',
          )}
        >
          {isPending ? (
            <>
              <span>Uploading…</span>
              <Progress value={progress} className="w-full max-w-20" />
            </>
          ) : (
            <>
              <ImagePlusIcon className="size-5" />
              <span>Add images</span>
            </>
          )}
        </button>
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleFiles}
      />
      <p className="text-xs text-muted-foreground">
        Drag and drop or click to add up to 10 images per upload, 5 MB each. The first image is the cover.
      </p>
      {validationError && <FieldError>{validationError}</FieldError>}
      {isError && <FieldError>{getApiErrorMessage(error, 'Image upload failed')}</FieldError>}
    </div>
  )
}
