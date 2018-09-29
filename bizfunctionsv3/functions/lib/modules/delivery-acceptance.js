"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ######################################################################
// Triggered by deliveryAcceptance addedd to firestore. send message to topic 
// ######################################################################
const functions = require("firebase-functions");
const admin = require("firebase-admin");
exports.deliveryAcceptanceCreated = functions.firestore
    .document('suppliers/{docId}/deliveryAcceptances/{poDocId}')
    .onCreate((snap, context) => {
    const acceptance = snap.data();
    const topic = `deliveryAcceptances${acceptance.supplierDocumentRef}`;
    const payload = {
        data: {
            messageType: 'DELIVERY_ACCEPTANCE',
            json: JSON.stringify(acceptance)
        },
        notification: {
            title: 'Delivery Acceptance',
            body: 'Delivery Acceptance from ' + acceptance.customerName + ' PO: ' + acceptance.purchaseOrderNumber
        }
    };
    console.log('sending delivery acceptance data to supplier topic: ' + topic + ' ' + JSON.stringify(payload));
    return admin.messaging().sendToTopic(topic, payload);
});
//# sourceMappingURL=delivery-acceptance.js.map