"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ######################################################################
// Triggered by user addedd to firestore. send message to users topic
// ######################################################################
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const constants = require("../models/constants");
exports.deliveryNoteAdded = functions.firestore
    .document("govtEntities/{id}/deliveryNotes/{mId}")
    .onCreate((snap, context) => {
    const note = snap.data();
    console.log(note);
    const payload = {
        notification: {
            title: "Delivery Note",
            body: "Delivery Note from " +
                note.supplierName +
                " PO# " +
                note.purchaseOrderNumber
        },
        data: {
            json: JSON.stringify(note),
            messageType: "DELIVERY_NOTE"
        }
    };
    const topic = constants.Constants.TOPIC_DELIVERY_NOTES + note.govtEntity.split("#")[1];
    const topic2 = constants.Constants.TOPIC_DELIVERY_NOTES + "admin";
    console.log(`sending delivery note to ${topic} and ${topic2} topics`);
    admin.messaging().sendToTopic(topic, payload);
    return admin.messaging().sendToTopic(topic2, payload);
});
//# sourceMappingURL=delivery-note-added.js.map