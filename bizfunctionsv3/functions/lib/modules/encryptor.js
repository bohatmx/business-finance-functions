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
const functions = require("firebase-functions");
const MyCrypto = require("./encryptor-util");
exports.encrypt = functions.https.onRequest((request, response) => __awaiter(this, void 0, void 0, function* () {
    if (!request.body) {
        response.sendStatus(500);
        return;
    }
    const accountID = request.body.accountId;
    const secret = request.body.secret;
    console.log('################### encrypt account secret for: ' + accountID);
    try {
        const encrypted = yield MyCrypto.encrypt(accountID, secret);
        response.send('' + encrypted);
    }
    catch (e) {
        console.error(e);
        response.sendStatus(500);
    }
}));
//# sourceMappingURL=encryptor.js.map