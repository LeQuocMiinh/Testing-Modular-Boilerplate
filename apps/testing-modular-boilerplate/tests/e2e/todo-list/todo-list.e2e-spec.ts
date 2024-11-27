import request from "supertest";
import { Hono } from "hono";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { setupConfiguration } from "@packages/common";
import { getCollection } from "@packages/mongodb-connector";
import { serve } from '@hono/node-server';
import routes from "../../../src/route/app";
import { ObjectId } from "mongodb";
import recievedDbAfterConnect from "../../../src/app";

describe("TodoList API tests", () => {
  let db: any;
  let collection: any;
  let firstItemId: any;
  let idArr: any[] = [];
  let server: any;
  let app = new Hono();
  routes(app);

  beforeAll(async () => {
    server = serve({ ...app, port: 4000 }, info => {
      console.log(`Listening on http://localhost:${info.port}`)
    });
    setupConfiguration();
    db = await recievedDbAfterConnect();

    collection = getCollection(await db, "todolist");

    await collection.deleteMany({});

    const todos = Array.from({ length: 10 }, (_, index) => ({
      title: `Test Todo ${index + 1}`,
      description: `Test Description ${index + 1}`,
      createdAt: new Date()
    }));
    const result = await collection.insertMany(todos);
    firstItemId = result.insertedIds[0];
    idArr.push(result.insertedIds[0], result.insertedIds[1], result.insertedIds[2]);

  });

  afterAll(async () => {
    server.close();
    //await collection.deleteMany({});
  });

  // Kiểm tra tạo Item
  it('should create a new todo item', async () => {
    const res = await request(server)
      .post('/todo-list/create')
      .send({ title: 'New Todo', description: 'New Description' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.msg).toBe('Tạo thành công');
    expect(res.body.data).toBeDefined();
  });

  // Kiểm tra nếu title < 8 hoặc > 500 kí tự
  it('If the title length < 8 or > 500 character', async () => {
    const res = await request(server)
      .post('/todo-list/create')
      .send({ title: 'N', description: 'New Description' });

    expect(res.status).toBe(400);
  });

  it('If the description length < 8 or > 500 character', async () => {
    const res = await request(server)
      .post('/todo-list/create')
      .send({ title: 'New Todo', description: 'New' });

    expect(res.status).toBe(400);
  });

  it('If enough field title in the create new todo item', async () => {
    const res = await request(server)
      .post('/todo-list/create')
      .send({ description: 'New' });

    expect(res.status).toBe(400);
  });

  it('If enough field description in the create new todo item', async () => {
    const res = await request(server)
      .post('/todo-list/create')
      .send({ title: "New todo" });

    expect(res.status).toBe(400);
  });

  // Kiểm tra lấy tất cả các Item
  it("should get all todo items", async () => {
    const res = await request(server).get("/todo-list/get");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.msg).toBe("Lấy tất cả dữ liệu thành công");
    expect(res.body.data.todos).toBeDefined();
  });

  // Kiểm tra lấy pagination
  it("should get pagination", async () => {
    const page = 1;
    const limit = 5;
    const res = await request(server).get(`/todo-list/get?page=${page}&limit=${limit}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
    expect(res.body.data.pagination.currentPage).toBe(1);
  });

  // Kiểm tra lấy Item theo ID
  it("should get a specific todo item by ID", async () => {
    const res = await request(server).get(`/todo-list/get/${firstItemId}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.msg).toBe("Lấy dữ liệu thành công");
    expect(res.body.data).toBeDefined();
  });

  // Kiểm tra nếu ID là số hoặc không đủ kí tự 
  it("ID item is number or enough character", async () => {
    const id = Number(123123);
    const res = await request(server).get(`/todo-list/get/${id}`);

    expect(res.status).toBe(400);
  });

  // Kiểm tra cập nhật item đầu tiên
  it("should update the first todo item", async () => {
    const res = await request(server)
      .put(`/todo-list/update/${firstItemId}`)
      .send({ title: "Updated Todo", description: "Updated Description" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.msg).toBe("Cập nhật dữ liệu thành công");

    // Check updated data in the database
    const updatedTodo = await collection.findOne({ _id: new ObjectId(firstItemId) });
    expect(updatedTodo).toBeDefined();
    expect(updatedTodo.title).toBe("Updated Todo");
    expect(updatedTodo.description).toBe("Updated Description");
  });

  // Kiểm tra cập nhật item nếu thiếu ID 
  it("should update item if enough ID", async () => {
    const res = await request(server)
      .put(`/todo-list/update`)
      .send({ title: "Updated Todo", description: "Updated Description" });

    expect(res.status).toBe(400);
  });

  // Kiểm tra cập nhật item nếu điền không đúng [Title, Description]
  it("should update item if fill incorrect [Title, Description]", async () => {
    const res = await request(server)
      .put(`/todo-list/update/${firstItemId}`)
      .send({ title: "Todo", description: "ption" });

    expect(res.status).toBe(400);
  });

  // Kiểm tra xoá item đầu tiên
  it("should delete the first todo item", async () => {
    const res = await request(server).delete(`/todo-list/delete/${firstItemId}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.msg).toBe("Xoá thành công");

    // Check if the item is deleted in the database
    const deletedTodo = await collection.findOne({ _id: new ObjectId(firstItemId) });
    expect(deletedTodo).toBeNull(); // Ensure that the todo is deleted
  });

  // Kiểm tra xoá nếu thiếu ID
  it("should delete if enough ID", async () => {
    const res = await request(server).delete(`/todo-list/delete`);

    expect(res.status).toBe(400);
  });

  // Kiểm tra xoá nhiều item
  it("should delete more ID", async () => {
    const res = await request(server).delete(`/todo-list/delete/${idArr}`);

    expect(res.status).toBe(400);
  });

  // Kiểm tra xoá Item nếu ID không đúng định dạng hoặc không tồn tại
  it("should delete if ID is invalid format or not exists", async () => {
    const id = "67468846d224f5813b6297a4";
    const res = await request(server).delete(`/todo-list/delete/${idArr.push(id)}`);

    expect(res.status).toBe(400);
  });
});
