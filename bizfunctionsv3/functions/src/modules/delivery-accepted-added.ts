// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as constants from '../models/constants'

export const deliveryAcceptanceAdded = functions.firestore
    .document('suppliers/{id}/deliveryAcceptances/{mId}')
    .onCreate((snap, context) => {

        const note = snap.data();
        console.log(note)
        const payload = {
            notification: {
            title: 'Delivery Note Acceptance',
            body: 'Delivery Note Acceptance from ' + note.customerName + ' PO# ' + note.purchaseOrderNumber
        },
            data: {
                json: JSON.stringify(note),
                messageType: 'DELIVERY_ACCEPTANCE'
            }
        }
        const topic = constants.Constants.TOPIC_DELIVERY_ACCEPTANCES + note.supplier.split('#')[1];
        const topic2 = constants.Constants.TOPIC_DELIVERY_ACCEPTANCES + 'admin';
        
        console.log(`sending delivery acceptance to ${topic} and ${topic2} topics`)
        admin.messaging().sendToTopic(topic, payload)
        return admin.messaging().sendToTopic(topic2, payload)
        
    });