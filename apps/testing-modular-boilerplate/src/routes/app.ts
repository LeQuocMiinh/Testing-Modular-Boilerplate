import type { Hono } from "hono";
import todoList from "./todo-list.route";

function routes(app: Hono) {
    app.route("/todo-list", todoList);
}

export default routes