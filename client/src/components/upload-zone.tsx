import { useCallback, useState } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface UploadZoneProps {
  onFileSelect?: (file: File) => void
  acceptedTypes?: string
  testId?: string
}

export function UploadZone({
  onFileSelect,
  acceptedTypes = '.pdf,.doc,.docx',
  testId,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) {
        setSelectedFile(file)
        onFileSelect?.(file)
      }
    },
    [onFileSelect]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        setSelectedFile(file)
        onFileSelect?.(file)
      }
    },
    [onFileSelect]
  )

  const clearFile = useCallback(() => {
    setSelectedFile(null)
  }, [])

  return (
    <Card
      className={`p-8 border-2 border-dashed transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-border'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid={testId}
    >
      {selectedFile ? (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium" data-testid="text-filename">
                {selectedFile.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFile}
            data-testid="button-clear-file"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <p className="font-medium mb-1">Upload Contract Document</p>
            <p className="text-sm text-muted-foreground">
              Drag and drop your file here, or click to browse
            </p>
          </div>
          <div>
            <Button variant="outline" asChild data-testid="button-browse-file">
              <label className="cursor-pointer">
                Browse Files
                <input
                  type="file"
                  className="hidden"
                  accept={acceptedTypes}
                  onChange={handleFileInput}
                />
              </label>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Supported formats: PDF, DOC, DOCX (Max 50MB)
          </p>
        </div>
      )}
    </Card>
  )
}
