// client/src/constants.ts - Application-wide constants
/**
 * API base URL (including `/api` prefix).
 *
 * - In development, uses a relative path (`/api`) so Vite's proxy can forward
 *   requests to the backend.
 * - In production, `VITE_API_URL` should be set to the API origin
 *   (e.g. `https://api.example.com`), and we append `/api` here.
 */
const API_ORIGIN = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

export const API_BASE_URL =
  `${API_ORIGIN.replace(/\/+$/, '')}/api`
/**
 * Navigation drawer width
 */
export const DRAWER_WIDTH = 260
