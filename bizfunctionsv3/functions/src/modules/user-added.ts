// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const userCreated = functions.firestore
    .document('users/{userId}')
    .onCreate((snap, context) => {

        const user = snap.data();
        console.log('userCreated function: ' + user.firstName + ' '
        + user.lastName + ' - ' + user.email)
        const payload = {
            data: {
                json: JSON.stringify(user),
                messageType: 'USER'
            }
        }
        const topic = 'users';
        return admin.messaging().sendToTopic(topic, payload)
        
    });