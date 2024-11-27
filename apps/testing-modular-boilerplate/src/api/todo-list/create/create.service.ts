import { getOrThrow, setupConfiguration } from "@packages/common";
import { getCollection, setupDB } from "@packages/mongodb-connector";
import { Context } from "hono";
import { IClientStore } from "../../../utils/interfaces/todo-list";
setupConfiguration();
const { clientUrl, dbName }: { clientUrl: string; dbName: string } =
    getOrThrow('db.mongodb');

export async function createTodolist(c: Context): Promise<any> {
    const clientStore: IClientStore | null = await setupDB(clientUrl, dbName);
    const collectionTodolist = getCollection(clientStore!.database, "todolist");

    const data = await c.req.json();
    const { title, description } = data;

    await collectionTodolist.insertOne({
        title: title,
        description: description,
        createdAt: new Date()
    });

    const todos = await collectionTodolist.find({}).toArray();
    return c.json({ status: true, msg: "Tạo thành công", data: todos });
}