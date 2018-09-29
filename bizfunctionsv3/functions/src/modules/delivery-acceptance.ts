// ######################################################################
// Triggered by deliveryAcceptance addedd to firestore. send message to topic 
// ######################################################################
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const deliveryAcceptanceCreated = functions.firestore
    .document('suppliers/{docId}/deliveryAcceptances/{poDocId}')
    .onCreate((snap, context) => {

        const acceptance = snap.data();
        const topic = `deliveryAcceptances${acceptance.supplierDocumentRef}`
        const payload = {
            data: {
                messageType: 'DELIVERY_ACCEPTANCE',
                json: JSON.stringify(acceptance)
            },
            notification: {
                title: 'Delivery Acceptance',
                body: 'Delivery Acceptance from ' + acceptance.customerName + ' PO: ' + acceptance.purchaseOrderNumber
            }
        }
        console.log('sending delivery acceptance data to supplier topic: ' + topic + ' ' + JSON.stringify(payload))
        return admin.messaging().sendToTopic(topic, payload)
       

    });