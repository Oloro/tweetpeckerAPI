import express from 'express';

const app: express.Application = express();

app.get('/', (req, res) => res.send('hello world'));

app.listen(51242, () => {
  console.log('Listening on 51242...');
});
