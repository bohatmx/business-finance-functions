"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const CryptoJS = require("crypto-js");
exports.decrypt = functions.https.onRequest((request, response) => {
    if (!request.body) {
        response.sendStatus(500);
        return;
    }
    const accountID = request.body.accountId;
    const encrypted = request.body.encrypted;
    console.log('################### decrypt account secret for: ' + accountID);
    try {
        const key = CryptoJS.enc.Utf8.parse(accountID);
        const iv = CryptoJS.enc.Utf8.parse('7061737323313299');
        const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
            keySize: 128 / 8,
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        const result = decrypted.toString(CryptoJS.enc.Utf8);
        console.log('### ENCRYPTED SECRET : ' + encrypted);
        console.log('### DECRYPTED SECRET, sending : ' + result);
        response.send('' + result);
    }
    catch (e) {
        console.error(e);
        response.sendStatus(500);
    }
});
//# sourceMappingURL=decryptor.js.map