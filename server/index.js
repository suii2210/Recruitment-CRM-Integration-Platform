import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import fs from 'fs';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import roleRoutes from './routes/roles.js';
import blogRoutes from './routes/blogs.js';
import contentRoutes from './routes/contentCreation.js';
import jobRoutes from './routes/jobs.js';
import jobApplicationRoutes from './routes/jobApplications.js';
import permissionRoutes from './routes/permissions.js';
import uploadRoutes from './routes/upload.js';
import cloudinaryUploadRoutes from './routes/cloudinaryUpload.js';
import publicBlogRoutes from './routes/publicBlogs.js';
import publicJobRoutes from './routes/publicJobs.js';
import publicApplicationRoutes from './routes/publicApplications.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeDefaultData } from './utils/initializeData.js';
import homeContentRoutes from './routes/homeContent.js';












const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;




// Middleware
const parseOrigins = (value, fallback) =>
  (value || fallback)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? parseOrigins(process.env.CORS_ORIGINS, 'https://admin.prashantkumar.co.uk,https://app.matvchannel.co.uk,https://matvchannel.co.uk')
  : parseOrigins(process.env.CORS_ORIGINS, 'http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175');

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));




app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/job-applications', jobApplicationRoutes);
app.use('/api/contents', contentRoutes);
app.use('/api/home-contents', homeContentRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/cloudinary', cloudinaryUploadRoutes);
app.use('/api/public/blogs', publicBlogRoutes);
app.use('/api/public/jobs', publicJobRoutes);
app.use('/api/public/applications', publicApplicationRoutes);



// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize default data after database connection is established
const initializeApp = async () => {
  try {
    await initializeDefaultData();
    console.log('🎉 Application initialized successfully');
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
  }
};

// Start server and initialize app
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();
    
    // Start the server
    app.listen(PORT, async () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Dashboard API: http://localhost:${PORT}/api`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN}`);
      
      // Initialize app data after database is connected
      await initializeApp();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
