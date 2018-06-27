// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const purchaseOrderCreated = functions.firestore
    .document('suppliers/{docId}/purchaseOrders/{poDocId}')
    .onCreate((snap, context) => {
        const po = snap.data();     
        const payload = {
            data: {
                messageType: 'PURCHASE_ORDER',
                json: JSON.stringify(po)
            }
        }
        
        const topic2 = `purchaseOrders${po.supplierDocumentRef}`
        console.log('sending PURCHASE_ORDER data to topic: ' + topic2 + ' ' + JSON.stringify(po))
        return admin.messaging().sendToTopic(topic2, payload)

    });