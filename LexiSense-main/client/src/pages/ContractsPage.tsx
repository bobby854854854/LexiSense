import Layout from '@/components/layout/Layout'
import { FileText, Upload } from 'lucide-react'

export default function ContractsPage() {
  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
          <button className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
            <Upload className="w-4 h-4 mr-2" />
            Upload Contract
          </button>
        </div>

        {/* Empty state */}
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No contracts yet
          </h3>
          <p className="text-gray-600 mb-6">
            Upload your first contract to get started with AI-powered analysis
          </p>
          <button className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
            <Upload className="w-4 h-4 mr-2" />
            Upload Contract
          </button>
        </div>
      </div>
    </Layout>
  )
}

// File: client/src/pages/ContractDetailPage.tsx
import { useParams } from 'wouter'
import Layout from '@/components/layout/Layout'

export default function ContractDetailPage() {
  const params = useParams()
  const id = params.id

  return (
    <Layout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Contract Detail: {id}
        </h1>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600">Contract details will appear here</p>
        </div>
      </div>
    </Layout>
  )
}

// File: client/src/pages/TeamPage.tsx
import Layout from '@/components/layout/Layout'
import { useAuth } from '@/hooks/useAuth'
import { Users, UserPlus } from 'lucide-react'

export default function TeamPage() {
  const { user } = useAuth()

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Team</h1>
          {user?.role === 'admin' && (
            <button className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </button>
          )}
        </div>

        {/* Team members list */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Team Members
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    {user?.role === 'admin' ? 'Admin' : user?.role}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                You
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
