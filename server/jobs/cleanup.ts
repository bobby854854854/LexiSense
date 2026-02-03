import { db } from '../db'
import { invitations } from '../db/schema'
import { lt, eq, and } from 'drizzle-orm'
import { logger } from '../logger'

/**
 * Background job to clean up expired invitations
 * Runs periodically to mark expired invitations as expired
 */
export async function cleanupExpiredInvitations(): Promise<{
  success: boolean
  expiredCount: number
  error?: string
}> {
  try {
    logger.info('Starting cleanup of expired invitations')
    
    const now = new Date()
    
    // Find all pending invitations that have expired
    const expiredInvitations = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.status, 'pending'),
          lt(invitations.expiresAt, now)
        )
      )
    
    if (expiredInvitations.length === 0) {
      logger.info('No expired invitations found')
      return { success: true, expiredCount: 0 }
    }
    
    // Update status to expired
    await db
      .update(invitations)
      .set({
        status: 'expired',
        updatedAt: now,
      })
      .where(
        and(
          eq(invitations.status, 'pending'),
          lt(invitations.expiresAt, now)
        )
      )
    
    logger.info('Expired invitations cleaned up', {
      count: expiredInvitations.length,
      expiredIds: expiredInvitations.map(inv => inv.id),
    })
    
    return {
      success: true,
      expiredCount: expiredInvitations.length,
    }
  } catch (error) {
    logger.error('Failed to cleanup expired invitations', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    return {
      success: false,
      expiredCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete old expired and accepted invitations (older than 90 days)
 * to keep the table size manageable
 */
export async function deleteOldInvitations(): Promise<{
  success: boolean
  deletedCount: number
  error?: string
}> {
  try {
    logger.info('Starting deletion of old invitations')
    
    // Delete invitations older than 90 days that are expired or accepted
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 90)
    
    const oldInvitations = await db
      .select()
      .from(invitations)
      .where(
        and(
          lt(invitations.updatedAt, cutoffDate),
          // Only delete expired or accepted invitations, keep cancelled for audit
          eq(invitations.status, 'expired')
        )
      )
    
    if (oldInvitations.length === 0) {
      logger.info('No old invitations to delete')
      return { success: true, deletedCount: 0 }
    }
    
    // Delete old invitations
    await db
      .delete(invitations)
      .where(
        and(
          lt(invitations.updatedAt, cutoffDate),
          eq(invitations.status, 'expired')
        )
      )
    
    logger.info('Old invitations deleted', {
      count: oldInvitations.length,
      deletedIds: oldInvitations.map(inv => inv.id),
    })
    
    return {
      success: true,
      deletedCount: oldInvitations.length,
    }
  } catch (error) {
    logger.error('Failed to delete old invitations', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    return {
      success: false,
      deletedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Scheduler for background jobs
 */
export class BackgroundJobScheduler {
  private cleanupIntervalId: NodeJS.Timeout | null = null
  private deleteIntervalId: NodeJS.Timeout | null = null
  
  /**
   * Start the background job scheduler
   */
  start() {
    // Run cleanup every hour
    this.cleanupIntervalId = setInterval(
      () => {
        cleanupExpiredInvitations().catch(error => {
          logger.error('Cleanup job failed', { error })
        })
      },
      60 * 60 * 1000 // 1 hour
    )
    
    // Run deletion every day at 3 AM
    const scheduleDelete = () => {
      const now = new Date()
      const next3AM = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        3,
        0,
        0,
        0
      )
      
      // If it's already past 3 AM, schedule for tomorrow
      if (now.getHours() >= 3) {
        next3AM.setDate(next3AM.getDate() + 1)
      }
      
      const timeUntil3AM = next3AM.getTime() - now.getTime()
      
      this.deleteIntervalId = setTimeout(() => {
        deleteOldInvitations().catch(error => {
          logger.error('Delete old invitations job failed', { error })
        })
        
        // Schedule next run (24 hours later)
        scheduleDelete()
      }, timeUntil3AM)
    }
    
    scheduleDelete()
    
    logger.info('Background job scheduler started', {
      cleanupInterval: '1 hour',
      deleteSchedule: '3 AM daily',
    })
    
    // Run cleanup immediately on start
    cleanupExpiredInvitations().catch(error => {
      logger.error('Initial cleanup job failed', { error })
    })
  }
  
  /**
   * Stop the background job scheduler
   */
  stop() {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId)
      this.cleanupIntervalId = null
    }
    
    if (this.deleteIntervalId) {
      clearTimeout(this.deleteIntervalId)
      this.deleteIntervalId = null
    }
    
    logger.info('Background job scheduler stopped')
  }
}

// Export a singleton instance
export const backgroundJobScheduler = new BackgroundJobScheduler()
