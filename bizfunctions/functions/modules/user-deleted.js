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
        console.log('userDeleted function, user: ' + user.firstName + ' ' + user.email)
        admin.auth().deleteUser(user.uid)
            .then(function () {
                console.log("Successfully deleted user");
                return 0
            })
            .catch(function (error) {
                console.log("Error deleting user:", error);
                return 9
            });
            return 0;
    });