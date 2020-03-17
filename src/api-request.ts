import { Method } from './request'
import { BasicRequest } from './basic-request'

export class ApiRequest extends BasicRequest {

    constructor (url: string, method: Method = 'GET') {
        super(url, method)
        this.addHeader('Content-Type', 'application/json')
    }

    transformRequestData (data?: any): any {
        return JSON.stringify(data)
    }

    transformResponseData (data: string): boolean {
        try {
            this._responseData = JSON.parse(this._responseData)
        } catch (e) {
            this._responseTextStatus = 'json_parse_error'
            return false
        }

        return true
    }
}