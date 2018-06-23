// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
const functions = require('firebase-functions');
const admin = require('firebase-admin');
//const firestore = admin.firestore();

exports.deliveryAcceptanceCreated = functions.firestore
    .document('suppliers/{docId}/deliveryAcceptances/{poDocId}')
    .onCreate((snap, context) => {

        const acceptance = snap.data();
        const topic = `deliveryAcceptances${acceptance.supplierDocumentRef}`
        const payload = {
            data: {
                messageType: 'DELIVERY_ACCEPTANCE',
                json: JSON.stringify(acceptance)
            }
        }
        console.log('sending delivery acceptance data to topic: ' + topic + ' ' + JSON.stringify(acceptance))
        return admin.messaging().sendToTopic(topic, payload)
       

    });