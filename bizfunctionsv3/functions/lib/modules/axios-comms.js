"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios = require('axios');
class AxiosComms {
    static execute(url, data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`######### AxiosComms.execute starting; ${url} data: ${data}`);
            const mresponse = yield axios({
                method: 'post',
                url: url,
                data: data
            }).catch((error) => {
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.log(error.response.data);
                    console.log(error.response.status);
                    console.log(error.response.headers);
                }
                else if (error.request) {
                    // The request was made but no response was received
                    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                    // http.ClientRequest in node.js
                    console.log(error.request);
                }
                else {
                    // Something happened in setting up the request that triggered an Error
                    console.log('Something happened in setting up the request that triggered an Error: ', error.message);
                }
                console.log(error.config);
                throw new Error('BFN has a problem. Dont just stand there ... Deal with it!');
            });
            console.log(`####### BFN response status: ##########: ${mresponse.status}`);
            return mresponse;
        });
    }
}
exports.AxiosComms = AxiosComms;
//# sourceMappingURL=axios-comms.js.map