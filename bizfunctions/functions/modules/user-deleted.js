// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const firestore = admin.firestore();

exports.userDeleted = functions.firestore
    .document('users/{userId}')
    .onDelete((snap, context) => {

        const user = snap.data();
        console.log('userDeleted deling auth entry, user: ' + user.firstName + ' ' + user.email)
        return admin.auth().deleteUser(user.uid)
    });