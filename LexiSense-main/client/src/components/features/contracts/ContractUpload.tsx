import { useState, useCallback } from 'react'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { formatBytes } from '@/lib/utils'

interface ContractUploadProps {
  onUploadComplete?: () => void
}

export default function ContractUpload({
  onUploadComplete,
}: ContractUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const validateFile = (file: File): string | null => {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760')
    const allowedTypes = ['application/pdf', 'text/plain']

    if (!allowedTypes.includes(file.type)) {
      return 'Only PDF and TXT files are supported'
    }

    if (file.size > maxSize) {
      return `File size must be less than ${formatBytes(maxSize)}`
    }

    return null
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      const error = validateFile(droppedFile)
      if (error) {
        toast.error(error)
        return
      }
      setFile(droppedFile)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const error = validateFile(selectedFile)
      if (error) {
        toast.error(error)
        return
      }
      setFile(selectedFile)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setUploadProgress(0)
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      await api.uploadContract(file)

      clearInterval(progressInterval)
      setUploadProgress(100)

      toast.success('Contract uploaded and analyzed successfully')
      setFile(null)
      setUploadProgress(0)

      if (onUploadComplete) {
        onUploadComplete()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {!file ? (
          <>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload a contract
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Drag and drop your file here, or click to browse
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Supported formats: PDF, TXT (Max 10MB)
            </p>
            <label className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 cursor-pointer transition-colors">
              <Upload className="w-4 h-4 mr-2" />
              Browse Files
              <input
                type="file"
                className="hidden"
                accept=".pdf,.txt"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
            </label>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <FileText className="w-8 h-8 text-primary" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatBytes(file.size)}
                </p>
              </div>
              {!isUploading && (
                <button
                  onClick={handleRemoveFile}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  {uploadProgress < 100
                    ? 'Uploading and analyzing...'
                    : 'Processing complete'}
                </p>
              </div>
            )}

            {!isUploading && (
              <button
                onClick={handleUpload}
                className="inline-flex items-center px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload and Analyze
              </button>
            )}

            {isUploading && (
              <div className="flex items-center justify-center text-sm text-gray-600">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          What happens after upload?
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Text is extracted from your document</li>
          <li>• AI analyzes the contract for key information</li>
          <li>• Summary, parties, dates, and risks are identified</li>
          <li>• You can chat with the contract to ask questions</li>
        </ul>
      </div>
    </div>
  )
}
