import type { Hono } from "hono";
import todoList from "./todoListRoute";

function routes(app: Hono) {
    app.route("/todo-list", todoList);
}

export default routes