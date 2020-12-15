import { Request } from './request'
import { Response } from './response'

export class RequestAgent {
    protected _promises: Promise<boolean>[] = []

    protected _contentStrategry: ContentStrategy = 'wait'

    public watchPromise (promise: Promise<any>): this {
        const p =
            promise.then(() => {
                const index = this._promises.indexOf(p)
                if (index >= 0) {
                    this._promises.splice(index, 1)
                }
                return true
            }).catch(() => {
                const index = this._promises.indexOf(p)
                if (index >= 0) {
                    this._promises.splice(index, 1)
                }
                return false
            })

        this._promises.push(p)

        return this
    }

    public waitForAll (): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            const nb: number = this._promises.length

            Promise.all(this._promises).then((values) => {
                resolve(values.length)
            }).catch(() => {
                resolve(0)
            })
        })
    }

    public get contentStrategry(): ContentStrategy {
        return this._contentStrategry
    }

    public set contentStrategry(v: ContentStrategy) {
        this._contentStrategry = v
    }
}

export const Agent = new RequestAgent()

export type ContentStrategy = 'wait' | 'show'