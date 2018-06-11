// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const firestore = admin.firestore();

exports.userCreated = functions.firestore
    .document('users/{userId}')
    .onCreate((snap, context) => {

        const user = snap.data();
        console.log('userCreated function: ' + user.firstName + ' ' + user.email)
        const payload = {
            data: {
                json: JSON.stringify(user),
                messageType: 'USER'
            }
        }
        let topic = 'users';
        return admin.messaging().sendToTopic(topic, payload).then(response => {
            console.log('user message sent to topic: ' + topic)
            return 200
        });
        
    });