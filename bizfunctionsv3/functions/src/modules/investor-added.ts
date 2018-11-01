// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as constants from '../models/constants'

export const investorAdded = functions.firestore
    .document('investors/{id}')
    .onCreate((snap, context) => {

        const po = snap.data();
        console.log(po)
        const payload = {
            notification: {
            title: 'New Investor',
            body: 'Investor added: ' + po.name 
        },
            data: {
                json: JSON.stringify(po),
                messageType: 'INVESTOR'
            }
        }
        const topic = constants.Constants.TOPIC_INVESTORS

        console.log(`sending investor to ${topic} topic`)
        return admin.messaging().sendToTopic(topic, payload)
        
    });