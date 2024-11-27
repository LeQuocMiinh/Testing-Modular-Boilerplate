import { Hono } from 'hono'
import routes from './routes/app';
import { serve } from '@hono/node-server';
import { testingMiddleWare } from './libs/middlewares/test';
import { logger } from '@packages/common';

const app = new Hono();

app.post('/test', testingMiddleWare, async (c) => {
  const data = await c.req.json();
  return c.json({ status: true, data: data });
});

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

routes(app);

serve({ ...app, port: 3000 }, info => {
  logger.info(`Listening on http://localhost:${info.port}`);
})
