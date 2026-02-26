// client/src/constants.ts - Application-wide constants
/**
 * API base URL - uses relative path for Vite proxy in development
 * In production, expects reverse proxy or VITE_API_URL environment variable
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Navigation drawer width
 */
export const DRAWER_WIDTH = 260
