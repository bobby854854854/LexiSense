export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export async function handleAPIResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    let errorDetails

    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorMessage
      errorDetails = errorData.details
    } catch {
      // If response is not JSON, use status text
    }

    throw new APIError(errorMessage, response.status, errorDetails)
  }

  return response.json()
}

export function logError(error: Error, context?: string) {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  }

  console.error('Application Error:', errorInfo)

  // In production, you might want to send this to an error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: sendToErrorTrackingService(errorInfo);
  }
}
