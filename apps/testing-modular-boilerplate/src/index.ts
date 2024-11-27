import { Hono } from 'hono'
import routes from './routes/index';
import { serve } from '@hono/node-server';
import { createServer } from 'http';

const app = new Hono();

app.post('/test', async (c) => {
  const data = await c.req.json();
  return c.json({ status: true, data: data });
});

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

routes(app);

serve({ ...app, port: 3000 }, info => {
  console.log(`Listening on http://localhost:${info.port}`)
})
