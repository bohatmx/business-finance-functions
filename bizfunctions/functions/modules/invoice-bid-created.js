// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
const functions = require('firebase-functions');
const admin = require('firebase-admin');
//const firestore = admin.firestore();

exports.invoiceCreated = functions.firestore
    .document('invoiceBids/{docId}')
    .onCreate((snap, context) => {

        const bid = snap.data();
        const topic = `invoiceBids`
        const payload = {
            data: {
                messageType: 'INVOICE_BID',
                json: JSON.stringify(bid)
            }
        }
        console.log('sending invoice bid data to topic: ' + topic + ' ' + JSON.stringify(bid))
        return admin.messaging().sendToTopic(topic, payload)
       

    });