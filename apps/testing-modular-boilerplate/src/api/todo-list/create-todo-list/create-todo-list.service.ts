import { getOrThrow, setupConfiguration } from "@packages/common";
import { getCollection, setupDB } from "@packages/mongodb-connector";
import { Context } from "hono";
import { IClientStore, TodoList } from "../../../utils/interfaces/todo-list";
import typia from "typia";
import { APIError } from "../../../utils/common/error-handler";

setupConfiguration();
const { clientUrl, dbName }: { clientUrl: string; dbName: string } =
    getOrThrow('db.mongodb');

export async function createTodolist(c: Context): Promise<any> {
    // Tạo validator từ typia
    const validateEmptyField = typia.createValidate<TodoList>();

    // Lấy dữ liệu từ request body
    const data = await c.req.json();

    // Validate dữ liệu
    const validationResult = validateEmptyField(data);
    if (!validationResult.success) {
        return APIError(c, false, "Vui lòng nhập đúng dữ liệu!");
    }

    // Kết nối tới cơ sở dữ liệu
    const clientStore: IClientStore | null = await setupDB(clientUrl, dbName);
    const collectionTodolist = getCollection(clientStore!.database, "todolist");

    const { title, description } = data;

    // Chèn dữ liệu vào MongoDB
    await collectionTodolist.insertOne({
        title: title,
        description: description,
        createdAt: new Date(),
    });

    // Lấy danh sách tất cả các todo sau khi chèn
    const todos = await collectionTodolist.find({}).toArray();

    // Trả về kết quả
    return c.json({ status: true, msg: "Tạo thành công", data: todos });
}
