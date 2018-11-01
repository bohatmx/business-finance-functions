// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as constants from '../models/constants'

export const customerAdded = functions.firestore
    .document('govtEntities/{id}')
    .onCreate((snap, context) => {

        const po = snap.data();
        console.log(po)
        const payload = {
            notification: {
            title: 'New Customer',
            body: 'Customer added: ' + po.name 
        },
            data: {
                json: JSON.stringify(po),
                messageType: 'CUSTOMER'
            }
        }
        const topic = constants.Constants.TOPIC_CUSTOMERS

        console.log(`sending PO to ${topic}  topic`)
        return admin.messaging().sendToTopic(topic, payload)
        
    });