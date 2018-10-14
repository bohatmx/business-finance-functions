"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ######################################################################
// Triggered by user addedd to firestore. send message to users topic
// ######################################################################
const functions = require("firebase-functions");
const admin = require("firebase-admin");
exports.userDeleted = functions.firestore
    .document("users/{userId}")
    .onDelete((snap, context) => {
    const user = snap.data();
    console.log(snap);
    console.log(user);
    console.log("userDeleted deleting auth entry, user: " +
        user.firstName +
        " " +
        user.email);
    return admin.auth().deleteUser(user.uid);
});
//# sourceMappingURL=user-deleted.js.map