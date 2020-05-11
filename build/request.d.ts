import { Response } from './response';
export declare type Status = 'waiting' | 'pending' | 'done' | 'error' | 'canceled';
export declare type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';
export declare type ProgressListener = (progress: number, direction: 'up' | 'down') => void;
export declare type StatusListener = (status: Status) => void;
export interface RequestInformations {
    readonly status: Status;
    readonly errors: string[];
    readonly progress: number;
    readonly uploadProgress: number;
}
export interface AuthorizationService {
    readonly authorizationToken: string;
    readonly authorizationPrefix: string;
    onAuthorizationError: (responseStatus: any | null, responseTextStatus: any | null) => void;
}
export interface Request extends RequestInformations {
    readonly responseData: any | null;
    readonly responseStatus: any | null;
    readonly responseTextStatus: any | null;
    reset(): this;
    abort(): this;
    send(data?: any): Promise<Response>;
    onProgress(listener: ProgressListener): this;
    onStatusChange(listener: StatusListener): this;
    addHeader(key: string, value: string): this;
    addAuthorization(token: string, prefix: string): this;
    addAuthorizationService(service: AuthorizationService | null): this;
}
