import { UploadZone } from '../upload-zone'

export default function UploadZoneExample() {
  return (
    <div className="p-8 bg-background max-w-2xl">
      <UploadZone
        onFileSelect={(file) => {
          console.log('File upload event:', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            timestamp: new Date().toISOString(),
          })
        }}
        testId="upload-zone-contract"
      />
    </div>
  )
}
