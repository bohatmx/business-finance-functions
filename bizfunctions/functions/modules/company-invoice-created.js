// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
const functions = require('firebase-functions');
const admin = require('firebase-admin');
//const firestore = admin.firestore();

exports.companyInvoiceCreated = functions.firestore
    .document('suppliers/{docId}/invoices/{poDocId}')
    .onCreate((snap, context) => {

        const invoice = snap.data();
        const topic = `invoices${invoice.companyDocumentRef}`
        const payload = {
            data: {
                messageType: 'COMPANY_INVOICE',
                json: JSON.stringify(invoice)
            }
        }
        console.log('sending invoice data to topic: ' + topic)
        return admin.messaging().sendToTopic(topic, payload).then(response => {
            console.log('admin.messaging().sendToTopic: response: ' +
                JSON.stringify(response))
            const topic2 = `invoices${invoice.supplierDocumentRef}`
            return admin.messaging().sendToTopic(topic2, payload).then(response => {
                console.log('admin.messaging().sendToTopic: response: ' +
                    JSON.stringify(response))
            })

        });

    });