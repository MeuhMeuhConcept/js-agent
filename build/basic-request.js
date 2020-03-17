"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BasicRequest {
    constructor(url, method = 'GET') {
        this._xhr = null;
        this._responseStatus = null;
        this._responseTextStatus = '';
        this._responseData = null;
        this._status = 'waiting';
        this._progress = 0;
        this._progressListeners = [];
        this._statusListeners = [];
        this._settings = {
            url: url,
            method: method,
            data: {},
            headers: {}
        };
    }
    get status() {
        return this._status;
    }
    get errors() {
        if (this._status !== 'error') {
            return [];
        }
        let message = this._responseTextStatus;
        if (message instanceof Error) {
            message = message.message;
        }
        if (this._responseData && this._responseData instanceof Object && this._responseData.message) {
            message = this._responseData.message;
        }
        return [message];
    }
    get responseStatus() {
        return this._responseStatus;
    }
    get responseTextStatus() {
        return this._responseTextStatus;
    }
    get responseData() {
        return this._responseData;
    }
    get progress() {
        return this._progress;
    }
    addHeader(key, value) {
        this._settings.headers[key] = value;
    }
    addAuthorization(token, prefix = 'Bearer') {
        this._settings.headers['Authorization'] = prefix + ' ' + token;
    }
    onProgress(listener) {
        this._progressListeners.push(listener);
    }
    onStatusChange(listener) {
        this._statusListeners.push(listener);
    }
    abort() {
        if (this._xhr) {
            this._xhr.abort();
        }
        return this;
    }
    send(data) {
        this._settings.data = data;
        this.abort();
        this.changeProgression(0);
        this.changeStatus('pending');
        return new Promise((resolve, reject) => {
            this._xhr = new XMLHttpRequest();
            this._xhr.onload = () => {
                if (!this._xhr) {
                    return;
                }
                this._responseStatus = this._xhr.status;
                this._responseTextStatus = this._xhr.statusText;
                this._responseData = this._xhr.responseText;
                this.changeProgression(100);
                if (this._xhr.status === 204) {
                    this._responseData = null;
                    this.changeStatus('done');
                }
                else if (this._xhr.status === 200 && this.transformResponseData(this._responseData)) {
                    this.changeStatus('done');
                }
                else {
                    this.changeStatus('error');
                }
                this._xhr = null;
                if (this._status === 'done') {
                    resolve(this.buildResponse());
                }
                else {
                    reject(this.buildResponse());
                }
            };
            this._xhr.onerror = () => {
                if (!this._xhr) {
                    return;
                }
                this._responseStatus = this._xhr.status;
                this._responseTextStatus = this._xhr.statusText;
                this._responseData = this._xhr.responseText;
                this.changeProgression(100);
                this.changeStatus('error');
                this._xhr = null;
                reject(this.buildResponse());
            };
            this._xhr.onabort = () => {
                if (!this._xhr) {
                    return;
                }
                this.changeProgression(100);
                this.changeStatus('canceled');
                this._xhr = null;
                reject(this.buildResponse());
            };
            try {
                this._xhr.onprogress = (event) => {
                    if (event.lengthComputable) {
                        this.changeProgression(Math.ceil(100 * event.loaded / event.total));
                    }
                };
            }
            catch (error) {
                // Do nothing
            }
            this._xhr.open(this._settings.method || 'GET', this._settings.url, true);
            if (this._settings.headers) {
                for (let key in this._settings.headers) {
                    this._xhr.setRequestHeader(key, this._settings.headers[key]);
                }
            }
            this._xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            this._xhr.send(this.transformRequestData(this._settings.data));
        });
    }
    transformRequestData(data) {
        return data !== undefined ? data : null;
    }
    transformResponseData(data) {
        return true;
    }
    buildResponse() {
        return {
            status: this._responseStatus ? this._responseStatus : 500,
            textStatus: this._responseTextStatus,
            data: this._responseData
        };
    }
    changeProgression(progress) {
        this._progress = progress;
        for (let listener of this._progressListeners) {
            listener(progress);
        }
    }
    changeStatus(status) {
        this._status = status;
        for (let listener of this._statusListeners) {
            listener(status);
        }
    }
}
exports.BasicRequest = BasicRequest;
