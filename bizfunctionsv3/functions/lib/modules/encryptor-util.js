"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CryptoJS = require("crypto-js");
exports.encrypt = async (accountID, secret) => {
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
};
//# sourceMappingURL=encryptor-util.js.map