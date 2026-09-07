import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import statsRoutes from './routes/statsRoutes';
import { errorHandler } from './middlewares/errorMiddleware';
import { config } from './lib/config';

const app = express();

const openapiSpec = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'openapi.json'), 'utf-8'));

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get('/openapi.json', (_req, res) => {
  res.json(openapiSpec);
});

app.use(
  rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/stats', statsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

export default app;