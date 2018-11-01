"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const constants = require("../models/constants");
exports.investorAdded = functions.firestore
    .document('investors/{id}')
    .onCreate((snap, context) => {
    const po = snap.data();
    console.log(po);
    const payload = {
        notification: {
            title: 'New Investor',
            body: 'Investor added: ' + po.name
        },
        data: {
            json: JSON.stringify(po),
            messageType: 'INVESTOR'
        }
    };
    const topic = constants.Constants.TOPIC_INVESTORS;
    console.log(`sending investor to ${topic} topic`);
    return admin.messaging().sendToTopic(topic, payload);
});
//# sourceMappingURL=investor-added.js.map