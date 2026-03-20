import { useState, useEffect } from 'react'
import { useParams, useLocation } from 'wouter'
import Layout from '@/components/layout/Layout'
import ChatInterface from '@/components/features/chat/ChatInterface'
import {
  FileText,
  Calendar,
  Users,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  MessageSquare,
  Trash2,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { ContractWithUploader } from '@shared/types'
import { formatDate, formatBytes, getRiskColor } from '@/lib/utils'
import { toast } from 'sonner'

export default function ContractDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [, setLocation] = useLocation()

  const [contract, setContract] = useState<ContractWithUploader | null>(null)
  const [loading, setLoading] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchContract()
  }, [id])

  const fetchContract = async () => {
    try {
      setLoading(true)
      const data = await api.getContract(id)
      setContract(data)
    } catch (error) {
      toast.error('Failed to load contract')
      setLocation('/contracts')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this contract?')) {
      return
    }

    try {
      setDeleting(true)
      await api.deleteContract(id)
      toast.success('Contract deleted successfully')
      setLocation('/contracts')
    } catch (error) {
      toast.error('Failed to delete contract')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </Layout>
    )
  }

  if (!contract) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Contract not found</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <button
              onClick={() => setLocation('/contracts')}
              className="mt-1 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {contract.originalName}
              </h1>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(contract.createdAt)}
                </span>
                <span className="flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  {formatBytes(contract.sizeBytes)}
                </span>
                {contract.uploader && (
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {contract.uploader.email}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {showChat ? 'Hide Chat' : 'Ask Questions'}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </button>
          </div>
        </div>

        {/* Chat Interface */}
        {showChat && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <ChatInterface contractId={contract.id} />
          </div>
        )}

        {/* AI Analysis */}
        {contract.aiAnalysis ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Summary */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Contract Summary
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {contract.aiAnalysis.summary}
                </p>
              </div>

              {/* Risks */}
              {contract.aiAnalysis.risks.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                    Identified Risks
                  </h2>
                  <div className="space-y-3">
                    {contract.aiAnalysis.risks.map((risk, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${getRiskColor(risk.level)}`}
                      >
                        <div className="flex items-start">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-white/50 mr-3">
                            {risk.level}
                          </span>
                          <p className="text-sm flex-1">{risk.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Parties */}
              {contract.aiAnalysis.parties.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Parties
                  </h2>
                  <div className="space-y-3">
                    {contract.aiAnalysis.parties.map((party, index) => (
                      <div
                        key={index}
                        className="pb-3 border-b border-gray-200 last:border-0 last:pb-0"
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {party.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {party.role}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Dates */}
              {contract.aiAnalysis.dates.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Key Dates
                  </h2>
                  <div className="space-y-3">
                    {contract.aiAnalysis.dates.map((date, index) => (
                      <div
                        key={index}
                        className="pb-3 border-b border-gray-200 last:border-0 last:pb-0"
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {date.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {date.date}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Analyzing Contract
            </h3>
            <p className="text-gray-600">
              AI analysis is in progress. This may take a few moments.
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
