import { Context, TypedResponse } from 'hono';
import { StatusCode } from 'hono/utils/http-status';
import { InvalidJSONValue, JSONParsed, JSONValue, SimplifyDeepArray } from 'hono/utils/types';
import { StatusCodes } from 'http-status-codes';
import { IValidation } from 'typia';
import { v4 as uuidv4 } from 'uuid';

import { mapErrorsToMessages } from './typia/map-typia.error';

export namespace IPaginationSearch {
  export interface IRequestParam {
    limit?: number;
    nextPageToken?: null | number;
    prevPageToken?: null | number;
  }

  export interface IPaginate {
    nextPageToken?: number | null;
    prevPagenextPage?: number | null;
    hasNext: boolean;
    hasPrev: boolean;
  }

  export interface IResponse<T> {
    paging: IPaginationSearch.IPaginate;
    data: T[];
  }
}

export interface IResponse<T = void> {
  ok: boolean;
  action?: string;
  paging?: null | IPaginationSearch.IPaginate;
  data?: T;
  error?: null | IResponse.IError;
}
// Use for code
export interface ApiError {
  code: number;
  message: string;
  status: StatusCode;
}

export interface WsApiError {
  code: number;
  message: string;
}

interface ErrorDetail {
  code: number;
  message: string;
  status?: StatusCodes;
  details?: string | string[] | IValidation.IError[];
}

export namespace IResponse {
  export interface IError {
    code: number;
    message: string;
    details?: string[];
  }

  export interface IErrorResponse {
    ok: false;
    error: IError;
  }

  export interface ISuccessResponse<T = void> {
    ok: true;
    data?: T;
  }

  export interface ISuccessPagingResponse<T> {
    ok: true;
    data: T;
    paging: IPaginationSearch.IPaginate;
  }

  export interface IWSErrorResponse {
    ok: false;
    action: string;
    error?: IError;
  }

  export const SCHEMA_REF = {
    RESPONSE: '#/components/schemas/IResponse',
    ERROR_RESPONSE: '#/components/schemas/IResponse.IErrorResponse',
    ERROR: '#/components/schemas/IResponse.IError',
  };
}

type JSONRespondReturn<
  T extends JSONValue | SimplifyDeepArray<unknown> | InvalidJSONValue,
  U extends StatusCode,
> = Response &
  TypedResponse<
    SimplifyDeepArray<T> extends JSONValue ? (JSONValue extends SimplifyDeepArray<T> ? never : JSONParsed<T>) : never,
    U,
    'json'
  >;

export const success = <T>(
  c: Context,
  data: T,
  status: StatusCode,
  paging?: null | IPaginationSearch.IPaginate,
): JSONRespondReturn<IResponse<T>, StatusCode> => {
  const response: IResponse<T> = { ok: true };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  if (paging !== null && paging !== undefined) {
    response.paging = paging;
  }

  return c.json(response, status);
};

export const fail = (c: Context, error: Pick<HTTPException, 'code' | 'message' | 'status' | 'details'>) => {
  const { code, message, details } = error;

  let processedDetails: string[] | undefined;
  if (details) {
    if (typeof details[0] === 'string') {
      processedDetails = details as string[];
    } else {
      processedDetails = mapErrorsToMessages(details as IValidation.IError[]);
    }
  }

  const response = {
    ok: false,
    error: {
      code,
      message,
      details: processedDetails,
    },
  };

  return c.json(response, error.status as StatusCode);
};

export class HTTPException {
  status?: StatusCodes;
  message!: string;
  code!: number;
  details?: string[] | IValidation.IError[];

  constructor(errorDetail: ErrorDetail, details?: IValidation.IError[]) {
    this.status = errorDetail.status;
    this.message = errorDetail.message;
    this.code = errorDetail.code;

    if (details) {
      this.details = details;
    } else if (errorDetail.details) {
      if (typeof errorDetail.details === 'string') {
        this.details = [errorDetail.details];
      } else {
        this.details = errorDetail.details;
      }
    }
  }

  static isHTTPException(obj: any): obj is HTTPException {
    return (
      obj &&
      typeof obj === 'object' &&
      'status' in obj &&
      'message' in obj &&
      'code' in obj &&
      (typeof obj.status === 'string' || typeof obj.status === 'number') &&
      typeof obj.message === 'string' &&
      typeof obj.code === 'string'
    );
  }
}

export interface MetaData {
  id: string;
  time: Date;
  type: string;
  specversion: number;
  source: string;
}
