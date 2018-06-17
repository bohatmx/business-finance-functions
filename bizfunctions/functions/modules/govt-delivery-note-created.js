// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
const functions = require('firebase-functions');
const admin = require('firebase-admin');
//const firestore = admin.firestore();

exports.govtDeliveryNoteCreated = functions.firestore
    .document('govtEntities/{docId}/deliveryNotes/{poDocId}')
    .onCreate((snap, context) => {

        const note = snap.data();
        const topic = `deliveryNotes${note.govtDocumentRef}`
        const payload = {
            data: {
                messageType: 'GOVT_DELIVERY_NOTE',
                json: JSON.stringify(note)
            }
        }
        console.log('sending delivery note data to topic: ' + topic + ' ' + JSON.stringify(note))
        admin.messaging().sendToTopic(topic, payload)
        const topic2 = `deliveryNotes${note.supplierDocumentRef}`
        return admin.messaging().sendToTopic(topic2, payload)

    });