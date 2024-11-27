import { getOrThrow, setupConfiguration } from "@packages/common";
import { getCollection, setupDB } from "@packages/mongodb-connector";
import { Context } from "hono";
import { ObjectId } from "mongodb";
import { APIError } from "../../../utils/common/error-handler";
import { IClientStore } from "../../../utils/interfaces/todo-list";
import { isValidObjectId } from "../../../utils/validate/validate-object-id";
setupConfiguration();
const { clientUrl, dbName }: { clientUrl: string; dbName: string } =
    getOrThrow('db.mongodb');
export async function deleteTodolist(c: Context) {
    const clientStore: IClientStore | null = await setupDB(clientUrl, dbName);
    const collectionTodolist = getCollection(clientStore!.database, "todolist");

    const ids = c.req.param("id")?.split(",");

    if (!ids || ids?.length == 0) {
        return APIError(c, false, "[ID] bị thiếu!");
    }

    const isCheckNull = !ids.every(e => isValidObjectId(e));
    if (isCheckNull) {
        return APIError(c, false, "Có ít nhất 1 ID không đúng định dạng hoặc không tồn tại!");
    }

    try {
        const objectIds = ids.map(id => new ObjectId(id));
        // Kiểm tra các ID có tồn tại hay không
        const existingItems = await collectionTodolist.find({ _id: { $in: objectIds } }).toArray();

        if (existingItems.length !== objectIds.length) {
            const missingIds = objectIds.filter(
                id => !existingItems.some(item => item._id.equals(id))
            );
            return APIError(c, false, `Các ID sau không tồn tại: ${missingIds.join(", ")}`);
        }
        await collectionTodolist.deleteMany({ _id: { $in: objectIds } });
        return c.json({ status: true, msg: "Xoá thành công" });
    } catch (error) {
        return APIError(c, false, "[ID] không tồn tại hoặc có lỗi trong quá trình xử lý!");
    }
}