"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const UserAdded = require("./modules/user-added");
const UserDeleted = require("./modules/user-deleted");
const Decryptor = require("./modules/decryptor");
const Encryptor = require("./modules/encryptor");
const DirectWallet = require("./modules/direct-wallet");
const AddData = require("./modules/add-data");
admin.initializeApp();
exports.userAdded = UserAdded.userCreated;
exports.userDeleted = UserDeleted.userDeleted;
exports.decryptor = Decryptor.decrypt;
exports.encryptor = Encryptor.encrypt;
exports.directWallet = DirectWallet.directWallet;
exports.addData = AddData.addData;
//# sourceMappingURL=index.js.map