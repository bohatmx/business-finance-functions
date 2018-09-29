"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
const functions = require("firebase-functions");
const admin = require("firebase-admin");
exports.govtInvoiceCreated = functions.firestore
    .document('govtEntities/{docId}/invoices/{poDocId}')
    .onCreate((snap, context) => {
    const invoice = snap.data();
    const topic = `invoices${invoice.govtDocumentRef}`;
    invoice.amount = invoice.amount * 1.00;
    invoice.totalAmount = invoice.totalAmount * 1.00;
    const payload = {
        data: {
            messageType: 'INVOICE',
            json: JSON.stringify(invoice)
        },
        notification: {
            title: 'Incoming Invoice',
            body: 'Invoice ' + invoice.invoiceNumber + ' total Amount: ' + invoice.totalAmount + ' from: ' + invoice.supplierName
        }
    };
    console.log('sending invoice data to government topic: ' + topic + ' ' + JSON.stringify(payload));
    return admin.messaging().sendToTopic(topic, payload);
});
//# sourceMappingURL=govt-invoice-created.js.map