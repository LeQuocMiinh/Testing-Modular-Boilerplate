/**
 * Hàm kiểm tra ID Item trong MongoDb
 * @param id 
 * @returns 
 */
export const isValidObjectId = (id: string): boolean => /^[a-fA-F0-9]{24}$/.test(id);
