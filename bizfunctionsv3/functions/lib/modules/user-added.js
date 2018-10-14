"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
const functions = require("firebase-functions");
const admin = require("firebase-admin");
exports.userCreated = functions.firestore
    .document('users/{userId}')
    .onCreate((snap, context) => {
    const user = snap.data();
    console.log(snap);
    console.log(user);
    console.log('userCreated adding: ' + user.firstName + ' '
        + user.lastName + ' - ' + user.email);
    const payload = {
        data: {
            json: JSON.stringify(user),
            messageType: 'USER_ADDED'
        }
    };
    const topic = 'usersAdded';
    return admin.messaging().sendToTopic(topic, payload);
});
//# sourceMappingURL=user-added.js.map