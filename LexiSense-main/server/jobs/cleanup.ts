import { pool } from '../db/index.js'
import { logger } from '../utils/logger.js'

export async function cleanupExpiredInvitations() {
  try {
    logger.info('Starting cleanup of expired invitations')

    // Delete invitations older than 7 days
    const result = await pool.query(`
      DELETE FROM team_invitations 
      WHERE created_at < NOW() - INTERVAL '7 days'
      AND status = 'pending'
    `)

    const deletedCount = result.rowCount || 0

    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} expired invitations`)
    }

    return deletedCount
  } catch (error) {
    logger.error('Failed to cleanup expired invitations:', error)
    throw error
  }
}

// Run cleanup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupExpiredInvitations()
    .then((count) => {
      console.log(`Cleanup completed. Removed ${count} expired invitations.`)
      process.exit(0)
    })
    .catch((error) => {
      console.error('Cleanup failed:', error)
      process.exit(1)
    })
}
