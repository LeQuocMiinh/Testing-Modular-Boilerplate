import { getOrThrow, setupConfiguration } from "@packages/common";
import { getCollection, setupDB } from "@packages/mongodb-connector";
import { Context } from "hono";
import { ObjectId } from "mongodb";
import { APIError } from "../../../utils/common/error-handler";
import { IClientStore, TodoList } from "../../../utils/interfaces/todo-list";
import { isValidObjectId } from "../../../utils/validate/validate-object-id";
import typia from "typia";

setupConfiguration();
const { clientUrl, dbName }: { clientUrl: string; dbName: string } =
    getOrThrow('db.mongodb');

export async function updateTodolist(c: Context) {
    const clientStore: IClientStore | null = await setupDB(clientUrl, dbName);
    const collectionTodolist = getCollection(clientStore!.database, "todolist");
    const idParam = c.req.param('id')?.trim();
    const params = await c.req.json();

    // Tạo validator
    const validateEmptyField = typia.createValidate<TodoList>();
    const validationResult = validateEmptyField(params);

    if (!validationResult.success) {
        return APIError(c, false, "Vui lòng nhập đúng dữ liệu!");
    }

    if (!idParam || idParam === '') {
        return APIError(c, false, "[ID] bị thiếu!");
    }

    if (!isValidObjectId(idParam)) {
        return APIError(c, false, "[ID] không tồn tại hoặc không đúng định dạng!");
    }

    const existsId: any = await collectionTodolist.findOne({ _id: new ObjectId(idParam) });

    if (!existsId) {
        return APIError(c, false, "Item không tồn tại");
    }

    await collectionTodolist.findOneAndUpdate({ _id: new ObjectId(idParam) }, { $set: params });

    return c.json({ status: true, msg: "Cập nhật dữ liệu thành công" });
}
