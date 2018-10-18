// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const userCreated = functions.firestore
    .document('users/{userId}')
    .onCreate((snap, context) => {

        const user = snap.data();
        console.log(snap)
        console.log(user)
        console.log('userCreated added: ' + user.firstName + ' '
        + user.lastName + ' - ' + user.email + ', sending topic message')
        const payload = {
            data: {
                json: JSON.stringify(user),
                messageType: 'USER_ADDED'
            }
        }
        const topic = 'usersAdded';
        return admin.messaging().sendToTopic(topic, payload)
        
    });