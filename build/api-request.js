"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const basic_request_1 = require("./basic-request");
class ApiRequest extends basic_request_1.BasicRequest {
    constructor(url, method = 'GET') {
        super(url, method);
        this.addHeader('Content-Type', 'application/json');
        this.addHeader('X-Requested-With', 'XMLHttpRequest');
    }
    transformRequestData(data) {
        return JSON.stringify(data);
    }
    transformResponseData(data) {
        try {
            this._responseData = JSON.parse(this._responseData);
        }
        catch (e) {
            this._responseTextStatus = 'json_parse_error';
            return false;
        }
        return true;
    }
}
exports.ApiRequest = ApiRequest;
