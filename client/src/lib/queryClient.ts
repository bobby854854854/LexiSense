import { QueryClient, QueryFunction } from '@tanstack/react-query'

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText
    throw new Error(`${res.status}: ${text}`)
  }
}

function validateUrl(url: string): void {
  if (!url.startsWith('/') && !url.startsWith('./')) {
    throw new Error('Only relative URLs are allowed')
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<Response> {
  validateUrl(url)
  const res = await fetch(url, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include',
  })

  await throwIfResNotOk(res)
  return res
}

type UnauthorizedBehavior = 'returnNull' | 'throw'
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const url = queryKey.join('/') as string
      validateUrl(url)

      const res = await fetch(url, {
        credentials: 'include',
      })

      if (unauthorizedBehavior === 'returnNull' && res.status === 401) {
        return null
      }

      await throwIfResNotOk(res)
      return await res.json()
    } catch (error) {
      console.error('Query function error: - queryClient.ts:54', error)
      throw error
    }
  }

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: 'throw' }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
})
