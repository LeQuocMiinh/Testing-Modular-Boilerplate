import type { Hono } from "hono";
import { createTodolist } from "../api/todo-list/create/create.service";
import { TodoList } from "../utils/interfaces/todo-list";
import typia from "typia";
import { typiaValidator } from "@hono/typia-validator";
import { getTodolist } from "../api/todo-list/read/read.service";
import { APIError } from "../utils/common/error-handler";
import { updateTodolist } from "../api/todo-list/update/update.service";
import { deleteTodolist } from "../api/todo-list/delete/delete.service";

function routes(app: Hono) {

    // Validate
    const validateEmptyField = typia.createValidate<TodoList>();

    // [POST] - Tạo item
    app.post('/todo-list/create', typiaValidator('json', validateEmptyField), createTodolist);

    // [GET] Lấy item theo ID hoặc lấy tất cả
    app.get('/todo-list/get/:id?', getTodolist);

    // // [PUT] - Cập nhật item
    app.put('/todo-list/update/:id?', typiaValidator('json', validateEmptyField,
        (result, c) => {
            if (!result.success) {
                return APIError(c, false, "Vui lòng nhập đúng dữ liệu!");
            }
        }), updateTodolist);

    // // [DELETE] - Xoá item theo ID
    app.delete('/todo-list/delete/:id?', deleteTodolist);

}

export default routes