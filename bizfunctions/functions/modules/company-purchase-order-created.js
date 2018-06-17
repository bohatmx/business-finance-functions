// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
const functions = require('firebase-functions');
const admin = require('firebase-admin');
//const firestore = admin.firestore();

exports.companyPurchaseOrderCreated = functions.firestore
    .document('suppliers/{docId}/purchaseOrders/{poDocId}')
    .onCreate((snap, context) => {

        const po = snap.data();
        const topic = `purchaseOrders${po.companyDocumentRef}`
        const payload = {
            data: {
                messageType: 'COMPANY_PURCHASE_ORDER',
                json: JSON.stringify(po)
            }
        }
        console.log('sending po data to topic: ' + topic + ' ' + JSON.stringify(po))
        admin.messaging().sendToTopic(topic, payload)
        const topic2 = `purchaseOrders${po.supplierDocumentRef}`
        return admin.messaging().sendToTopic(topic2, payload)

    });