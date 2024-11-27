import { logger } from '@packages/common';
import { Collection, Db, Document, MongoClient } from 'mongodb';

export interface IClientStore {
  client: MongoClient;
  database: Db;
  url: string;
  dbName: string;
}

const clientStore: IClientStore[] = [];

export async function setupDB(url: string, dbName: string): Promise<null | IClientStore> {
  try {
    const clientStoreFilter = clientStore.find((client) => client.url == url && client.dbName == dbName);

    if (clientStoreFilter) {
      return clientStoreFilter;
    }

    const client = new MongoClient(url);
    await client.connect();
    const database = client.db(dbName);

    logger?.info(`MongoDB connected with ${dbName}!`);
    const clientElement = {
      client,
      database,
      dbName,
      url,
    };
    clientStore.push(clientElement);
    return clientElement;
  } catch (error) {
    logger?.error(`Fail to connection!`);
    logger.error(error);

    return null;
  }
}

async function collectionExists(db: Db, collectionName: string): Promise<boolean> {
  const collections = await db.listCollections({ name: collectionName }).toArray();
  return collections.length > 0;
}

export async function ensureCollection(db: Db, collectionName: string): Promise<void> {
  if (!(await collectionExists(db, collectionName))) {
    await db.createCollection(collectionName);
  }
}

export function getCollection<T extends Document>(database: Db, collectionName: string): Collection<T> {
  if (database == undefined) {
    throw new Error(`MongoDB database instance doesn't exist`);
  }

  return database.collection(collectionName);
}

export async function indexExists(collection: Collection<any>, indexName: string): Promise<boolean> {
  const existingIndexes = await collection.indexes();
  return existingIndexes.some((index) => index.name === indexName);
}

export async function ensureIndex(collection: Collection<any>, fields: any, options: any, indexName: string) {
  if (!(await indexExists(collection, indexName))) {
    await collection.createIndex(fields, options);
  }
}
