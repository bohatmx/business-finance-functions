// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const invoiceBidCreated = functions.firestore
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
        if (bid.supplierFCMToken) {
            console.log('sending invoice bid data to supplier device: ' + bid.supplierFCMToken + ' ' + JSON.stringify(bid))
            const devices = [bid.supplierFCMToken]
            admin.messaging().sendToDevice(devices, payload)
        }
        console.log('sending invoice bid data to topic: ' + topic)
        return admin.messaging().sendToTopic(topic, payload)

        // TODO - send message directly to supplier in offer - 
    });