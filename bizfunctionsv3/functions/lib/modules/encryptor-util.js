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
const CryptoJS = require("crypto-js");
exports.encrypt = (accountID, secret) => __awaiter(this, void 0, void 0, function* () {
    console.log('encryptFunction: ################### encrypt account secret for: ' + accountID);
    try {
        const key = CryptoJS.enc.Utf8.parse(accountID);
        const iv = CryptoJS.enc.Utf8.parse('7061737323313299');
        const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(secret), key, {
            keySize: 128 / 8,
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        console.log('PLAIN TEXT SECRET : ' + secret);
        console.log('ENCRYPTED SECRET : ' + encrypted);
        return '' + encrypted;
    }
    catch (e) {
        console.error(e);
        throw e;
    }
});
//# sourceMappingURL=encryptor-util.js.map