"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const constants = require("../models/constants");
exports.supplierAdded = functions.firestore
    .document('suppliers/{id}')
    .onCreate((snap, context) => {
    const po = snap.data();
    console.log(po);
    const payload = {
        notification: {
            title: 'New Supplier',
            body: 'Supplier added: ' + po.name
        },
        data: {
            json: JSON.stringify(po),
            messageType: 'SUPPLIER'
        }
    };
    const topic = constants.Constants.TOPIC_SUPPLIERS;
    console.log(`sending PO to ${topic} topic`);
    return admin.messaging().sendToTopic(topic, payload);
});
//# sourceMappingURL=supplier-added.js.map