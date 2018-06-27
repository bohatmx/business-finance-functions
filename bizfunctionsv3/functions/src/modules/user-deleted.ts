// ######################################################################
// Triggered by user addedd to firestore. send message to users topic 
// ######################################################################
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const userDeleted = functions.firestore
    .document('users/{userId}')
    .onDelete((snap, context) => {

        const user = snap.data();
        console.log('userDeleted deleting auth entry, user: ' + user.firstName + ' ' + user.email)
        return admin.auth().deleteUser(user.uid)
    });