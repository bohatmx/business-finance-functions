"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
const functions = require("firebase-functions");
const admin = require("firebase-admin");
exports.invoiceBidCreated = functions.firestore
    .document('invoiceOffers/{ioId}/invoiceBids/{docId}')
    .onCreate((snap, context) => {
    const bid = snap.data();
    const topic = `invoiceBids` + bid.supplierId;
    const payload = {
        data: {
            messageType: 'INVOICE_BID',
            json: JSON.stringify(bid)
        },
        notification: {
            title: 'Invoice Bid',
            body: 'Invoice Bid from ' + bid.investorName + ' amount: ' + bid.amount
        }
    };
    if (bid.supplierFCMToken) {
        console.log('sending invoice bid data to supplier device: ' + bid.supplierFCMToken + ' ' + JSON.stringify(bid));
        const devices = [bid.supplierFCMToken];
        admin.messaging().sendToDevice(devices, payload);
    }
    console.log('sending invoice bid data to topic: ' + topic);
    return admin.messaging().sendToTopic(topic, payload);
    // TODO - send message directly to supplier in offer - 
});
//# sourceMappingURL=invoice-bid-created.js.map