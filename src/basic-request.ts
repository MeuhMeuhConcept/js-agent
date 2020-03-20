import { Request, Method, Status, ProgressListener, StatusListener } from './request'
import { Response } from './response'

export interface Settings {
    url: string
    method: Method
    data: any
    headers: {[key: string]: string}
}

export class BasicRequest implements Request {
    private _xhr: XMLHttpRequest | null = null
    protected _settings: Settings

    protected _urlParams: {[key: string]: string} = {}

    protected _responseStatus: number | null = null
    protected _responseTextStatus: any = ''
    protected _responseData: any | null = null

    protected _status: Status = 'waiting'
    protected _progress: number = 0

    protected _progressListeners: ProgressListener[] = []
    protected _statusListeners: StatusListener[] = []

    constructor (url: string, method: Method = 'GET') {

        this._settings = {
            url: url,
            method: method,
            data: {},
            headers: {}
        }
    }

    get status (): Status {
        return this._status
    }

    get errors () {
        if (this._status !== 'error') {
            return []
        }

        let message = this._responseTextStatus
        if (message instanceof Error) {
            message = message.message
        }
        if (this._responseData && this._responseData instanceof Object && this._responseData.message) {
            message = this._responseData.message
        }

        return [message]
    }

    get responseStatus () {
        return this._responseStatus
    }

    get responseTextStatus () {
        return this._responseTextStatus
    }

    get responseData () {
        return this._responseData
    }

    get progress () {
        return this._progress
    }

    addHeader (key: string, value: string): this {
        this._settings.headers[key] = value

        return this
    }

    addAuthorization (token: string, prefix: string = 'Bearer'): this {
        this._settings.headers['Authorization'] = prefix + ' ' + token

        return this
    }

    setUrlParam (key: string, value: string): this {
        this._urlParams[key] = value

        return this
    }

    onProgress (listener: ProgressListener): this {
        this._progressListeners.push(listener)

        return this
    }

    onStatusChange (listener: StatusListener): this {
        this._statusListeners.push(listener)

        return this
    }

    abort () {
        if (this._xhr) {
            this._xhr.abort()
        }

        return this
    }

    send (data?: any): Promise<Response> {
        this._settings.data = data

        this.abort()

        this.changeProgression(0)
        this.changeStatus('pending')

        return new Promise((resolve, reject) => {
            this._xhr = new XMLHttpRequest()
            this._xhr.onload = () => {
                if (!this._xhr) {
                    return
                }

                this._responseStatus = this._xhr.status
                this._responseTextStatus = this._xhr.statusText
                this._responseData = this._xhr.responseText

                this.changeProgression(100)

                if (this._xhr.status === 204) {
                    this._responseData = null
                    this.changeStatus('done')
                } else if (this._xhr.status === 200 && this.transformResponseData(this._responseData)) {
                    this.changeStatus('done')
                } else {
                    this.changeStatus('error')
                }

                this._xhr = null

                if (this._status === 'done') {
                    resolve(this.buildResponse())
                } else {
                    reject(this.buildResponse())
                }
            }

            this._xhr.onerror = () => {
                if (!this._xhr) {
                    return
                }

                this._responseStatus = this._xhr.status
                this._responseTextStatus = this._xhr.statusText
                this._responseData = this._xhr.responseText

                this.changeProgression(100)
                this.changeStatus('error')

                this._xhr = null

                reject(this.buildResponse())
            }

            this._xhr.onabort = () => {
                if (!this._xhr) {
                    return
                }

                this.changeProgression(100)
                this.changeStatus('canceled')

                this._xhr = null

                reject(this.buildResponse())
            }

            try {
                this._xhr.onprogress = (event: ProgressEvent) => {
                    if (event.lengthComputable) {
                        this.changeProgression(Math.ceil(100 * event.loaded / event.total))
                    }
                }
            } catch (error) {
                // Do nothing
            }

            let url = this._settings.url

            for (const key in this._urlParams) {
                url = url.replace('{' + key + '}', this._urlParams[key])
            }

            this._xhr.open(this._settings.method || 'GET', url, true)

            if (this._settings.headers) {
                for (let key in this._settings.headers) {
                    this._xhr.setRequestHeader(key, this._settings.headers[key])
                }
            }

            this._xhr.send(this.transformRequestData(this._settings.data))
        })
    }

    protected transformRequestData (data?: any): any {
        return data !== undefined ? data : null
    }

    protected transformResponseData (data: string): boolean {
        return true
    }

    protected buildResponse (): Response {
        return {
            status: this._responseStatus ? this._responseStatus : 500,
            textStatus: this._responseTextStatus,
            data: this._responseData
        }
    }

    protected changeProgression (progress: number) {
        if (progress === this._progress) {
            return
        }

        this._progress = progress

        for (let listener of this._progressListeners) {
            listener(progress)
        }
    }

    protected changeStatus (status: Status) {
        if (status === this._status) {
            return
        }

        this._status = status

        for (let listener of this._statusListeners) {
            listener(status)
        }
    }
}
