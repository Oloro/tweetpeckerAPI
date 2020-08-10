import express from 'express';
import router from './routes';
import dotenv from 'dotenv';
import cors from 'cors';
import slowDown from 'express-slow-down';

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  methods: 'GET',
  allowedHeaders: 'Content-Type',
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

dotenv.config();
const app: express.Application = express();

app.enable('trust proxy');

const speedLimiter = slowDown({
  windowMs: 60 * 1000, // 1 minute
  delayAfter: 50, // allow 100 requests per 15 minutes, then...
  delayMs: 500, // begin adding 500ms of delay per request above 100:
});

app.use(cors());
app.use(router);
app.use(speedLimiter);

if (process.env.HOST && process.env.PORT) {
  app.listen(parseInt(process.env.PORT), () => {
    console.log(`Listening on ${process.env.HOST}:${process.env.PORT}...`);
  });
} else {
  console.log('Required environmental variables not found.');
}
