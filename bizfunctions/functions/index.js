// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();


const sendMessageModule = require('./modules/send-message');
const userAddedModule = require('./modules/user-added');
const userDeletedModule = require('./modules/user-deleted');

const companyDeliveryNoteCreated = require('./modules/company-delivery-note-created');
const companyInvoiceCreated = require('./modules/company-invoice-created');
const companyPOCreated = require('./modules/company-purchase-order-created');

const govtDeliveryNoteCreated = require('./modules/govt-delivery-note-created');
const govtInvoiceCreated = require('./modules/govt-invoice-created');
const govtPOCreated = require('./modules/govt-purchase-order-created');


exports.bf01 = userAddedModule
exports.bf02 = sendMessageModule
exports.bf03 = userDeletedModule

exports.bf04 = govtDeliveryNoteCreated
exports.bf05 = govtInvoiceCreated
exports.bf06 = govtPOCreated

exports.bf07 = companyDeliveryNoteCreated
exports.bf08 = companyInvoiceCreated
exports.bf09 = companyPOCreated
