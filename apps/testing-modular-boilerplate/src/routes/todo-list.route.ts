import { Hono } from "hono";
import { getCollection } from "@packages/mongodb-connector";
import { recievedDbAfterConnect } from "../cases/todo-list.case";
import { ObjectId } from "mongodb";
import { TodoList } from "../utils/interfaces/todo-list";
import { typiaValidator } from "@hono/typia-validator";
import typia from "typia";
import { isValidObjectId } from "../utils/common/validate-object-id";

const todoList = new Hono();
const APIError = (c: any, status: true | false, msg: string) => {
    return c.json({
        msg: msg,
        status: status,
    }, 400);
}

// Connect DB
const db = recievedDbAfterConnect();

// Validate
const validateEmptyField = typia.createValidate<TodoList>();

// [POST] - Tạo item
todoList.post('/create', typiaValidator('json', validateEmptyField), async (c, next) => {
    const data = await c.req.json();

    const { title, description } = data;

    const collectionTodolist = getCollection(await db, "todolist");

    await collectionTodolist.insertOne({
        title: title,
        description: description,
        createdAt: new Date()
    });

    const todos = await collectionTodolist.find({}).toArray();
    return c.json({ status: true, msg: "Tạo thành công", data: todos });
});

// [GET] Lấy item theo ID hoặc lấy tất cả
todoList.get('/get/:id?', async (c) => {
    const idParam = c.req.param('id') || '';
    const page = Number(c.req.query("page")) || 1;
    const limit: any = Number(c.req.query("limit")) || 5;

    const collectionTodolist = getCollection(await db, "todolist");

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
});


// [PUT] - Cập nhật item
todoList.put('/update/:id?', typiaValidator('json', validateEmptyField,
    (result, c) => {
        if (!result.success) {
            return APIError(c, false, "Vui lòng nhập đúng dữ liệu!");
        }
    }), async (c) => {
        const idParam = c.req.param('id')?.trim();
        const params = await c.req.json();
        const collectionTodolist = getCollection(await db, "todolist");
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
    })

// [DELETE] - Xoá item theo ID
todoList.delete('/delete/:id?', async (c) => {
    const ids = c.req.param("id")?.split(",");
    const collectionTodolist = getCollection(await db, "todolist");

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
});

export default todoList;