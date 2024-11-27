import { Context } from 'hono';

export async function getBody(c: Context): Promise<object> {
  try {
    return await c.req.json();
  } catch (error) {
    return {};
  }
}
