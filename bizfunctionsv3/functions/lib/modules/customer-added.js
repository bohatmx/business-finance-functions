"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const constants = require("../models/constants");
exports.customerAdded = functions.firestore
    .document('govtEntities/{id}')
    .onCreate((snap, context) => {
    const po = snap.data();
    console.log(po);
    const payload = {
        notification: {
            title: 'New Customer',
            body: 'Customer added: ' + po.name
        },
        data: {
            json: JSON.stringify(po),
            messageType: 'CUSTOMER'
        }
    };
    const topic = constants.Constants.TOPIC_CUSTOMERS;
    console.log(`sending PO to ${topic}  topic`);
    return admin.messaging().sendToTopic(topic, payload);
});
//# sourceMappingURL=customer-added.js.map