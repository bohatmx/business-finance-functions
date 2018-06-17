// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
const functions = require('firebase-functions');
const admin = require('firebase-admin');
//const firestore = admin.firestore();

exports.govtInvoiceCreated = functions.firestore
    .document('govtEntities/{docId}/invoices/{poDocId}')
    .onCreate((snap, context) => {

        const invoice = snap.data();
        const topic = `invoices${invoice.govtDocumentRef}`
        const payload = {
            data: {
                messageType: 'GOVT_INVOICE',
                json: JSON.stringify(invoice)
            }
        }
        console.log('sending invoice data to topic: ' + topic + ' ' + JSON.stringify(invoice))
        admin.messaging().sendToTopic(topic, payload)
        const topic2 = `invoices${invoice.supplierDocumentRef}`
        return admin.messaging().sendToTopic(topic2, payload)
    });