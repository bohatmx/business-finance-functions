"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const constants = require("../models/constants");
exports.invoiceAcceptanceAdded = functions.firestore
    .document('suppliers/{id}/invoiceAcceptance/{mId}')
    .onCreate((snap, context) => {
    const note = snap.data();
    console.log(note);
    const payload = {
        notification: {
            title: 'Invoice Acceptance',
            body: 'Invoice Acceptance from ' + note.customerName + ' Inv# ' + note.invoiceNumber
        },
        data: {
            json: JSON.stringify(note),
            messageType: 'INVOICE_ACCEPTANCE'
        }
    };
    const topic = constants.Constants.TOPIC_INVOICE_ACCEPTANCES + note.supplier.split('#')[1];
    const topic2 = constants.Constants.TOPIC_INVOICE_ACCEPTANCES + 'admin';
    console.log(`sending invoice acceptance to ${topic} and ${topic2} topics`);
    admin.messaging().sendToTopic(topic, payload);
    return admin.messaging().sendToTopic(topic2, payload);
});
//# sourceMappingURL=invoice-accepted-added.js.map