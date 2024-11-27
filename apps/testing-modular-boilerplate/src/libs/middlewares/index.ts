export const testingMiddleWare = async (_c: any, next: any) => {
    console.log('Middleware running...');
    await next();
}
