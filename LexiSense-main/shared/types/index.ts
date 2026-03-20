// User Roles
export type UserRole = 'admin' | 'member' | 'viewer'

// User
export interface User {
  id: string
  email: string
  organizationId: string
  role: UserRole
  createdAt: Date
}

// Organization
export interface Organization {
  id: string
  name: string
  createdAt: Date
}

// AI Analysis Result
export interface AIAnalysisResult {
  summary: string
  parties: Array<{ name: string; role: string }>
  dates: Array<{ name: string; date: string }>
  risks: Array<{
    level: 'high' | 'medium' | 'low'
    description: string
  }>
}

// Contract
export interface Contract {
  id: string
  organizationId: string
  uploadedBy: string | null
  originalName: string
  storageKey: string
  mimeType: string
  sizeBytes: number
  extractedText: string | null
  aiAnalysis: AIAnalysisResult | null
  createdAt: Date
  updatedAt: Date
}

// Contract with uploader info (for list views)
export interface ContractWithUploader extends Contract {
  uploader: {
    id: string
    email: string
  } | null
}

// Invitation
export interface Invitation {
  id: string
  organizationId: string
  email: string
  role: UserRole
  token: string
  expiresAt: Date
  createdBy: string
  createdAt: Date
}

// Invitation with creator info
export interface InvitationWithCreator extends Invitation {
  creator: {
    id: string
    email: string
  }
}

// Team Member (User without sensitive data)
export interface TeamMember {
  id: string
  email: string
  role: UserRole
  createdAt: Date
}

// API Request/Response Types

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  organizationName: string
}

export interface AcceptInviteRequest {
  email: string
  password: string
  token: string
}

export interface InviteMemberRequest {
  email: string
  role: UserRole
}

export interface UpdateMemberRoleRequest {
  role: UserRole
}

export interface ChatRequest {
  question: string
}

export interface ChatResponse {
  answer: string
}

// API Error Response
export interface ApiError {
  message: string
  errors?: Array<{
    field: string
    message: string
  }>
}
