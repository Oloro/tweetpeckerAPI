import express from 'express';
import router from './routes';

const app: express.Application = express();

app.use(router);

app.listen(51253, () => {
  console.log('Listening on 51253...');
});
