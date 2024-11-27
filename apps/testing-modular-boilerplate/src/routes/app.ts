import type { Hono } from "hono";
import todoList from "./todo-list";

function routes(app: Hono) {
    app.route("/todo-list", todoList);
}

export default routes