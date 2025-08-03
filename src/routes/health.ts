import { Router, Request, Response } from 'express';
import { testSupabaseConnection } from '../config/supabase';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const router = Router();

// Health check básico
router.get('/', async (req: Request, res: Response) => {
  try {
    const dbStatus = await testSupabaseConnection();
    
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus ? 'connected' : 'disconnected',
      whatsapp_config: {
        has_access_token: !!process.env.META_ACCESS_TOKEN,
        has_phone_id: !!process.env.META_PHONE_NUMBER_ID,
        has_verify_token: !!process.env.META_VERIFY_TOKEN
      }
    };

    const statusCode = dbStatus ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

export default router;