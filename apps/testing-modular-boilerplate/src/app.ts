import { Hono } from 'hono'
import routes from './route/app';
import { serve } from '@hono/node-server';
import { getOrThrow, logger, setupConfiguration } from '@packages/common';
import { Db } from 'mongodb';
import { setupDB } from '@packages/mongodb-connector';

const app = new Hono();

setupConfiguration();
export default async function recievedDbAfterConnect(): Promise<Db> {
  const { clientUrl, dbName }: { clientUrl: string; dbName: string } =
    getOrThrow('db.mongodb');

  const clientStore = await setupDB(clientUrl, dbName);
  if (!clientStore || !clientStore.database) {
    throw new Error(`Failed to connect to the database: ${dbName}`);
  }
  return clientStore.database;
}

recievedDbAfterConnect();

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

routes(app);

serve({ ...app, port: 3000 }, info => {
  logger.info(`Listening on http://localhost:${info.port}`);
})
