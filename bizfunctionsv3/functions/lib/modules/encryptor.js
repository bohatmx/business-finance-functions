"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const MyCrypto = require("./encryptor-util");
exports.encrypt = functions.https.onRequest(async (request, response) => {
    if (!request.body) {
        response.sendStatus(500);
        return;
    }
    const accountID = request.body.accountId;
    const secret = request.body.secret;
    console.log('################### encrypt account secret for: ' + accountID);
    try {
        const encrypted = await MyCrypto.encrypt(accountID, secret);
        response.send('' + encrypted);
    }
    catch (e) {
        console.error(e);
        response.sendStatus(500);
    }
});
//# sourceMappingURL=encryptor.js.map