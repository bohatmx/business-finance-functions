// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
const functions = require('firebase-functions');
const admin = require('firebase-admin');
//const firestore = admin.firestore();

exports.offerCreated = functions.firestore
    .document('invoiceOffers/{docId}')
    .onCreate((snap, context) => {

        const offer = snap.data();
        const topic = `invoiceOffers`
        const payload = {
            data: {
                messageType: 'OFFER',
                json: JSON.stringify(offer)
            }
        }
        console.log('sending offer data to topic: ' + topic + ' ' + JSON.stringify(offer))
        return admin.messaging().sendToTopic(topic, payload)
       

    });