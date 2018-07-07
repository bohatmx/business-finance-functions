// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const govtDeliveryNoteCreated = functions.firestore
    .document('govtEntities/{docId}/deliveryNotes/{poDocId}')
    .onCreate((snap, context) => {

        const note = snap.data();
        const topic = `deliveryNotes${note.govtDocumentRef}`
        const payload = {
            data: {
                messageType: 'DELIVERY_NOTE',
                json: JSON.stringify(note)
            },
            notification: {
                title: 'Delivery Note',
                body: 'Delivery Notefrom ' + note.supplierName + ' date: ' + note.date
            }
        }
        console.log('sending delivery note data to topic: ' + topic + ' ' + JSON.stringify(note))
        return admin.messaging().sendToTopic(topic, payload)
       

    });