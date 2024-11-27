import { logger } from "@packages/common";

export const testingMiddleWare = async (_c: any, next: any) => {
    logger.info(`Loading middleware`);
    await next();
}
