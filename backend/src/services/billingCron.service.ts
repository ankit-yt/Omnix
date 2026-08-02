import cron from 'node-cron';
import mongoose from 'mongoose';
import paymentService from './payment.service.js';
import { logger } from '@/utils/logger.js';

class BillingCronService {
  public start() {
    // Run this job every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      logger.info('[CRON] Starting pending payment fallback sync...');
      try {
        await this.syncPendingOrders();
      } catch (error) {
        logger.error('[CRON_ERROR] Failed to execute billing cron job', error);
      }
    });
  }

  private async syncPendingOrders() {
    // Calculate time threshold: 15 minutes ago
    const timeThreshold = new Date(Date.now() - 15 * 60 * 1000);

    const pendingOrders = await mongoose.model('PaymentOrder').find({
      status: 'pending',
      createdAt: { $lte: timeThreshold } 
    });

    
        
    if (pendingOrders.length === 0) {
      logger.info('[CRON] No stuck pending payments found.');
      return;
    }

    logger.info(`[CRON] Found ${pendingOrders.length} pending orders. Attempting sync...`);

    for (const order of pendingOrders) {
      try {
        const result = await paymentService.syncRazorpaySubscription(order.razorpaySubscriptionId);
        logger.info(`[CRON] Synced order ${order._id}: ${result.message}`);
      } catch (error: any) {
        logger.error(`[CRON] Failed to sync order ${order._id}:`, error.message);
      }
    }
  }
}

export default new BillingCronService();