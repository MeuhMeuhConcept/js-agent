import { Response } from './response'

export type Status = 'waiting' | 'pending' | 'done' | 'error' | 'canceled'

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

export type ProgressListener = (progress: number) => void

export type StatusListener = (status: Status) => void

export interface Request {
    readonly status: Status
    readonly errors: string[]
    readonly responseData: any | null
    readonly responseStatus: any | null
    readonly responseTextStatus: any | null
    readonly progress: number
    abort (): this
    send (data?: any): Promise<Response>
    onProgress (listener: ProgressListener): void
    onStatusChange (listener: StatusListener): void
    addHeader (key: string, value: string): void
    addAuthorization (token: string, prefix: string): void
}
