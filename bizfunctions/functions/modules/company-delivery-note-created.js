// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
const functions = require('firebase-functions');
const admin = require('firebase-admin');
//const firestore = admin.firestore();

exports.companyDeliveryNoteCreated = functions.firestore
    .document('companies/{docId}/deliveryNotes/{poDocId}')
    .onCreate((snap, context) => {

        const note = snap.data();
        const topic = `deliveryNotes${note.companyDocumentRef}`
        const payload = {
            data: {
                messageType: 'COMPANY_DELIVERY_NOTE',
                json: JSON.stringify(note)
            }
        }
        console.log('sending del note data to topic: ' + topic + ' ' + JSON.stringify(note))
        admin.messaging().sendToTopic(topic, payload)
        const topic2 = `deliveryNotes${note.supplierDocumentRef}`
        return admin.messaging().sendToTopic(topic2, payload)

    });