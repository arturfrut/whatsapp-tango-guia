import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Importar rutas
import webhookRoutes from './routes/webhook';
import healthRoutes from './routes/health';

// Importar servicios para test inicial
import { testSupabaseConnection } from './config/supabase';

console.log('🧪 Variables cargadas:', {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '***hidden***' : undefined
});

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================
// MIDDLEWARES
// =============================================

// Seguridad básica
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://tu-frontend-domain.vercel.app'] // Cambiar por tu dominio real
    : ['http://localhost:3000'],
  credentials: true
}));

// Parse JSON con límite para webhooks
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging básico
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// =============================================
// RUTAS
// =============================================

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: '🤖 WhatsApp Bot Backend API',
    status: 'running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rutas principales
app.use('/webhook', webhookRoutes);
app.use('/health', healthRoutes);

// Ruta para 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// =============================================
// ERROR HANDLER GLOBAL
// =============================================

app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Global error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// =============================================
// INICIAR SERVIDOR
// =============================================

async function startServer() {
  try {
    // Test de conexiones antes de iniciar
    console.log('🔧 Testing connections...');
   
    const dbConnection = await testSupabaseConnection();
    if (!dbConnection) {
      console.error('❌ Database connection failed!');
      process.exit(1);
    }

    // Verificar variables de entorno críticas
    const requiredEnvVars = [
      'META_ACCESS_TOKEN',
      'META_PHONE_NUMBER_ID',
      'META_VERIFY_TOKEN',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingVars);
      process.exit(1);
    }

    console.log('✅ All connections and environment variables OK');

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📱 Webhook URL: ${process.env.NODE_ENV === 'production' ? 'https://tu-app.onrender.com' : `http://localhost:${PORT}`}/webhook`);
      console.log(`💚 Health check: ${process.env.NODE_ENV === 'production' ? 'https://tu-app.onrender.com' : `http://localhost:${PORT}`}/health`);
      console.log(`\n📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Manejar cierre graceful
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Iniciar el servidor
startServer();