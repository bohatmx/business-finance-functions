"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const CryptoJS = require("crypto-js");
exports.encrypt = functions.https.onRequest((request, response) => {
    if (!request.body) {
        response.sendStatus(500);
        return;
    }
    const accountID = request.body.accountId;
    const secret = request.body.secret;
    console.log('################### encrypt account secret for: ' + accountID);
    try {
        const key = CryptoJS.enc.Utf8.parse(accountID);
        const iv = CryptoJS.enc.Utf8.parse('7061737323313233');
        const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(secret), key, {
            keySize: 128 / 8,
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        console.log('PLAIN TEXT SECRET : ' + secret);
        console.log('ENCRYPTED SECRET : ' + encrypted);
        response.send('' + encrypted);
    }
    catch (e) {
        console.error(e);
        response.sendStatus(500);
    }
});
//# sourceMappingURL=encryptor.js.map