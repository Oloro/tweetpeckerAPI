import express from 'express';
import router from './routes';
import dotenv from 'dotenv';
import cors from 'cors';

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  methods: 'GET',
  allowedHeaders: 'Content-Type',
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

dotenv.config();
const app: express.Application = express();

app.use(cors());
app.use(router);

if (process.env.HOST && process.env.PORT) {
  app.listen(parseInt(process.env.PORT), process.env.HOST, () => {
    console.log(`Listening on ${process.env.HOST}:${process.env.PORT}...`);
  });
} else {
  console.log('Required environmental variables not found.');
}
