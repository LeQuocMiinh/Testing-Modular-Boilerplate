import { getOrThrow, setupConfiguration } from "@packages/common";
import { setupDB } from "@packages/mongodb-connector";
import { Db } from "mongodb";

setupConfiguration();

export async function recievedDbAfterConnect(): Promise<Db> {
    const { clientUrl, dbName }: { clientUrl: string; dbName: string } =
        getOrThrow('db.mongodb');

    const clientStore = await setupDB(clientUrl, dbName);
    if (!clientStore || !clientStore.database) {
        throw new Error(`Failed to connect to the database: ${dbName}`);
    }

    return clientStore.database;
}
