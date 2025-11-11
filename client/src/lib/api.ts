
import type {
  User,
  LoginRequest,
  RegisterRequest,
  AcceptInviteRequest,
  Contract,
  ContractWithUploader,
  InviteMemberRequest,
  TeamMember,
  InvitationWithCreator,
  UpdateMemberRoleRequest,
  ChatRequest,
  ChatResponse,
} from '@shared/types'

class ApiClient {
  private csrfToken: string | null = null

  async fetchCsrfToken() {
    const response = await fetch('/api/csrf-token')
    const data = await response.json()
    this.csrfToken = data.csrfToken
  }

  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      ...options.headers,
    }

    // Add CSRF token for non-GET requests
    if (options.method && options.method !== 'GET' && this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken
    }

    // Add Content-Type for JSON requests
    if (options.body && typeof options.body === 'string') {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }))
      throw new Error(error.message || 'Request failed')
    }

    return response.json()
  }

  // Auth
  async login(data: LoginRequest): Promise<User> {
    return this.request<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async register(data: RegisterRequest): Promise<User> {
    return this.request<User>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async acceptInvite(data: AcceptInviteRequest): Promise<User> {
    return this.request<User>('/api/auth/accept-invite', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async logout(): Promise<void> {
    await this.request('/api/auth/logout', { method: 'POST' })
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/api/auth/me')
  }

  // Contracts
  async getContracts(): Promise<ContractWithUploader[]> {
    return this.request<ContractWithUploader[]>('/api/contracts')
  }

  async getContract(id: string): Promise<ContractWithUploader> {
    return this.request<ContractWithUploader>(`/api/contracts/${id}`)
  }

  async uploadContract(file: File): Promise<Contract> {
    const formData = new FormData()
    formData.append('file', file)

    const headers: HeadersInit = {}
    if (this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken
    }

    const response = await fetch('/api/contracts', {
      method: 'POST',
      body: formData,
      headers,
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Upload failed',
      }))
      throw new Error(error.message || 'Upload failed')
    }

    return response.json()
  }

  async chatWithContract(id: string, question: string): Promise<ChatResponse> {
    return this.request<ChatResponse>(`/api/contracts/${id}/chat`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    })
  }

  async deleteContract(id: string): Promise<void> {
    await this.request(`/api/contracts/${id}`, { method: 'DELETE' })
  }

  // Team
  async getTeamMembers(): Promise<TeamMember[]> {
    return this.request<TeamMember[]>('/api/team/members')
  }

  async getInvitations(): Promise<InvitationWithCreator[]> {
    return this.request<InvitationWithCreator[]>('/api/team/invitations')
  }

  async inviteMember(data: InviteMemberRequest): Promise<InvitationWithCreator> {
    return this.request<InvitationWithCreator>('/api/team/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async cancelInvitation(id: string): Promise<void> {
    await this.request(`/api/team/invitations/${id}`, { method: 'DELETE' })
  }

  async updateMemberRole(
    id: string,
    data: UpdateMemberRoleRequest
  ): Promise<TeamMember> {
    return this.request<TeamMember>(`/api/team/members/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async removeMember(id: string): Promise<void> {
    await this.request(`/api/team/members/${id}`, { method: 'DELETE' })
  }
}

export const api = new ApiClient()