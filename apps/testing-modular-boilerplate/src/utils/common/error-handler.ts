export const APIError = (c: any, status: true | false, msg: string) => {
    return c.json({
        msg: msg,
        status: status,
    }, 400);
}
