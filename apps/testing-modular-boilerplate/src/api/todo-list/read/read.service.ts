import { getCollection, setupDB } from "@packages/mongodb-connector";
import { Context } from "hono";
import { isValidObjectId } from "../../../utils/validate/validate-object-id";
import { APIError } from "../../../utils/common/error-handler";
import { ObjectId } from "mongodb";
import { getOrThrow, setupConfiguration } from "@packages/common";
import { IClientStore } from "../../../utils/interfaces/todo-list";

setupConfiguration();
const { clientUrl, dbName }: { clientUrl: string; dbName: string } =
    getOrThrow('db.mongodb');

export async function getTodolist(c: Context) {
    const clientStore: IClientStore | null = await setupDB(clientUrl, dbName);
    const collectionTodolist = getCollection(clientStore!.database, "todolist");

    const idParam = c.req.param('id') || '';
    const page = Number(c.req.query("page")) || 1;
    const limit: any = Number(c.req.query("limit")) || 5;

    if (idParam) {
        if (!isValidObjectId(idParam)) {
            return APIError(c, false, "[ID] Không tồn tại hoặc không đúng định dạng!");
        }

        const existsId: any = await collectionTodolist.findOne({ _id: new ObjectId(idParam) });
        if (!existsId) {
            return c.json({ status: false, msg: `Không tìm thấy item với ID: ${idParam}` });
        }

        return c.json({
            status: true,
            msg: "Lấy dữ liệu thành công",
            data: existsId
        });
    } else {
        const skip = (page - 1) * limit;
        const todos = await collectionTodolist
            .find({})
            .skip(skip)
            .limit(limit)
            .toArray();
        const totalCount = await collectionTodolist.countDocuments({});
        const totalPages = Math.ceil(totalCount / limit);
        const nextPage = page < totalPages ? page + 1 : false;
        const prevPage = page > 1 ? page - 1 : false;
        const pagination = {
            currentPage: page,
            totalPages,
            nextPage,
            prevPage
        };

        return c.json({
            status: true,
            msg: "Lấy tất cả dữ liệu thành công",
            data: { todos, pagination }
        });
    }
}