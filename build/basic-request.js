"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const agent_1 = require("./agent");
const superagent = __importStar(require("superagent"));
class BasicRequest {
    constructor(url, method = 'GET') {
        this._request = null;
        this._urlParams = {};
        this._responseStatus = null;
        this._responseTextStatus = '';
        this._responseData = null;
        this._status = 'waiting';
        this._progress = 0;
        this._uploadProgress = 0;
        this._progressListeners = [];
        this._statusListeners = [];
        this._authorizationService = null;
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
    get uploadProgress() {
        return this._uploadProgress;
    }
    addHeader(key, value) {
        this._settings.headers[key] = value;
        return this;
    }
    addAuthorization(token, prefix = 'Bearer') {
        this._settings.headers['Authorization'] = prefix + ' ' + token;
        return this;
    }
    addAuthorizationService(service) {
        this._authorizationService = service;
        return this;
    }
    setUrlParam(key, value) {
        this._urlParams[key] = value;
        return this;
    }
    onProgress(listener) {
        this._progressListeners.push(listener);
        return this;
    }
    onStatusChange(listener) {
        this._statusListeners.push(listener);
        return this;
    }
    reset() {
        if (this._status !== 'pending') {
            this.changeStatus('waiting');
        }
        return this;
    }
    abort() {
        if (this._request) {
            this._request.abort();
        }
        return this;
    }
    send(data) {
        this._settings.data = data;
        this.abort();
        this.changeProgression(0);
        this.changeUploadProgression(0);
        this.changeStatus('pending');
        return new Promise((resolve, reject) => {
            let url = this._settings.url;
            for (const key in this._urlParams) {
                url = url.replace('{' + key + '}', this._urlParams[key]);
            }
            this._request = superagent.default(this._settings.method || 'GET', url);
            if (!this._request) {
                reject();
                return;
            }
            this._request.on('response', (response) => {
                this._responseStatus = response.status;
                this._responseTextStatus = response.text;
                this._responseData = response.body;
                this.changeProgression(100);
                this.changeUploadProgression(100);
                if (response.status === 204) {
                    this._responseData = null;
                    this.changeStatus('done');
                }
                else if ((response.status === 200 || response.status === 201) && this.transformResponseData(this._responseData)) {
                    this.changeStatus('done');
                }
                else {
                    if (response.status !== 200 && response.status !== 201) {
                        this.transformErrorResponseData(this._responseData);
                    }
                    this.changeStatus('error');
                }
                this._request = null;
                if (this._status === 'done') {
                    resolve(this.buildResponse());
                }
                else {
                    if (this._responseStatus === 401 && this._authorizationService) {
                        this._authorizationService.onAuthorizationError(this._responseStatus, this._responseTextStatus);
                    }
                    reject(this.buildResponse());
                }
            });
            this._request.on('abort', () => {
                if (!this._request) {
                    return;
                }
                this.changeProgression(100);
                this.changeUploadProgression(100);
                this.changeStatus('canceled');
                this._request = null;
                reject(this.buildResponse());
            });
            this._request.on('progress', (event) => {
                if (event.direction === 'download' && event.total) {
                    this.changeProgression(Math.ceil(100 * event.loaded / event.total));
                }
                if (event.direction === 'upload' && event.total) {
                    this.changeUploadProgression(Math.ceil(100 * event.loaded / event.total));
                }
            });
            if (this._authorizationService) {
                this.addAuthorization(this._authorizationService.authorizationToken, this._authorizationService.authorizationPrefix);
            }
            if (this._settings.headers) {
                this._request.set(this._settings.headers);
            }
            this._request.send(this.transformRequestData(this._settings.data));
            this._request.retry(2);
            agent_1.Agent.watchPromise(new Promise((resolve, reject) => {
                if (!this._request) {
                    reject();
                    return;
                }
                this._request.end((err, res) => {
                    if (err) {
                        reject();
                    }
                    else {
                        resolve();
                    }
                });
            }));
        });
    }
    transformRequestData(data) {
        return data !== undefined ? data : null;
    }
    transformResponseData(data) {
        return true;
    }
    transformErrorResponseData(data) {
        return this.transformResponseData(data);
    }
    buildResponse() {
        return {
            status: this._responseStatus ? this._responseStatus : 500,
            textStatus: this._responseTextStatus,
            data: this._responseData
        };
    }
    changeProgression(progress) {
        if (progress === this._progress) {
            return;
        }
        this._progress = progress;
        for (const listener of this._progressListeners) {
            listener(progress, 'down');
        }
    }
    changeUploadProgression(progress) {
        if (progress === this._uploadProgress) {
            return;
        }
        this._uploadProgress = progress;
        for (const listener of this._progressListeners) {
            listener(progress, 'up');
        }
    }
    changeStatus(status) {
        if (status === this._status) {
            return;
        }
        this._status = status;
        for (const listener of this._statusListeners) {
            listener(status);
        }
    }
}
exports.BasicRequest = BasicRequest;
