"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
const functions = require("firebase-functions");
const admin = require("firebase-admin");
exports.purchaseOrderCreated = functions.firestore
    .document('suppliers/{docId}/purchaseOrders/{poDocId}')
    .onCreate((snap, context) => {
    const po = snap.data();
    const payload = {
        data: {
            messageType: 'PURCHASE_ORDER',
            json: JSON.stringify(po)
        },
        notification: {
            title: 'Purchase Order',
            body: 'Purchase Order from ' + po.purchaserName + ' amount: ' + po.amount
        }
    };
    const topic2 = `purchaseOrders${po.supplierDocumentRef}`;
    console.log('sending PURCHASE_ORDER data to topic: ' + topic2 + ' ' + JSON.stringify(po));
    return admin.messaging().sendToTopic(topic2, payload);
});
//# sourceMappingURL=purchase-order-created.js.map