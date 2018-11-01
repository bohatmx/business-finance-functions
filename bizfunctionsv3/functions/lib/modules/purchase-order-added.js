"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const constants = require("../models/constants");
exports.purchaseOrderAdded = functions.firestore
    .document('suppliers/{id}/purchaseOrders/{mId}')
    .onCreate((snap, context) => {
    const po = snap.data();
    console.log(po);
    const payload = {
        notification: {
            title: 'Purchase Order',
            body: 'Purchase Order from ' + po.purchaserName + ' # ' + po.purchaseOrderNumber
        },
        data: {
            json: JSON.stringify(po),
            messageType: 'PURCHASE_ORDER'
        }
    };
    const topic = constants.Constants.TOPIC_PURCHASE_ORDERS + po.supplier.split('#')[1];
    const topic2 = constants.Constants.TOPIC_PURCHASE_ORDERS + 'admin';
    console.log(`sending PO to ${topic} and ${topic2} topics`);
    admin.messaging().sendToTopic(topic, payload);
    return admin.messaging().sendToTopic(topic2, payload);
});
//# sourceMappingURL=purchase-order-added.js.map