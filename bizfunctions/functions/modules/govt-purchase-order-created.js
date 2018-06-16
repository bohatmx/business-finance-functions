// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
const functions = require('firebase-functions');
const admin = require('firebase-admin');
//const firestore = admin.firestore();

exports.govtPurchaseOrderCreated = functions.firestore
    .document('govtEntities/{docId}/purchaseOrders/{poDocId}')
    .onCreate((snap, context) => {

        const po = snap.data();
        const topic = `purchaseOrders${po.govtDocumentRef}`
        const payload = {
            data: {
                messageType: 'GOVT_PURCHASE_ORDER',
                json: JSON.stringify(po)
            }
        }
        console.log('sending po data to topic: ' + topic)
        return admin.messaging().sendToTopic(topic, payload).then(response => {
            console.log('admin.messaging().sendToTopic: response: ' +
                JSON.stringify(response))
            const topic2 = `purchaseOrders${po.supplierDocumentRef}`
            return admin.messaging().sendToTopic(topic2, payload).then(response => {
                console.log('admin.messaging().sendToTopic: response: ' +
                    JSON.stringify(response))
            })

        });

    });