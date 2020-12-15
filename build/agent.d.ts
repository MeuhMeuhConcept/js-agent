export declare class RequestAgent {
    protected _promises: Promise<boolean>[];
    protected _contentStrategry: ContentStrategy;
    watchPromise(promise: Promise<any>): this;
    waitForAll(): Promise<number>;
    get contentStrategry(): ContentStrategy;
    set contentStrategry(v: ContentStrategy);
}
export declare const Agent: RequestAgent;
export declare type ContentStrategy = 'wait' | 'show';
