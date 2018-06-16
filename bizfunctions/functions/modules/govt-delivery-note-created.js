// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
const functions = require('firebase-functions');
const admin = require('firebase-admin');
//const firestore = admin.firestore();

exports.govtDeliveryNoteCreated = functions.firestore
    .document('suppliers/{docId}/deliveryNotes/{poDocId}')
    .onCreate((snap, context) => {

        const note = snap.data();
        const topic = `deliveryNotes${note.govtDocumentRef}`
        const payload = {
            data: {
                messageType: 'GOVT_DELIVERY_NOTE',
                json: JSON.stringify(note)
            }
        }
        console.log('sending po data to topic: ' + topic)
        return admin.messaging().sendToTopic(topic, payload).then(response => {
            console.log('admin.messaging().sendToTopic: response: ' +
                JSON.stringify(response))
            const topic2 = `deliveryNotes${note.supplierDocumentRef}`
            return admin.messaging().sendToTopic(topic2, payload).then(response => {
                console.log('admin.messaging().sendToTopic: response: ' +
                    JSON.stringify(response))
            })

        });

    });