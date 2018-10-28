"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ######################################################################
// Triggered by deleteAuthUsers addedd to firestore. send message to users topic
// ######################################################################
const functions = require("firebase-functions");
const admin = require("firebase-admin");
exports.deleteAuthUsers = functions.firestore
    .document("usersDeleteTriggers/{id}")
    .onCreate((snap, context) => {
    try {
        const firestore = admin.firestore();
        const settings = { /* your settings... */ timestampsInSnapshots: true };
        firestore.settings(settings);
        console.log("Firebase settings completed. Should be free of annoying messages from Google");
    }
    catch (e) {
        console.log(e);
    }
    admin
        .auth()
        .listUsers(1000)
        .then(function (listUsersResult) {
        listUsersResult.users.forEach(function (userRecord) {
            console.log("user", userRecord.toJSON());
            admin
                .auth()
                .deleteUser(userRecord.uid)
                .then(function () {
                console.log(`Successfully deleted user: ${userRecord.email}`);
            })
                .catch(function (error) {
                console.log("Error deleting user:", error);
            });
        });
    })
        .catch(function (error) {
        console.log("Error listing users:", error);
    });
    return 'Users deleted';
});
//# sourceMappingURL=delete_auth_users.js.map