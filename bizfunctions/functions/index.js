// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();


const sendMessageModule = require('./modules/send-message');
const userAddedModule = require('./modules/user-added');

exports.bf01 = userAddedModule
exports.bf02 = sendMessageModule
