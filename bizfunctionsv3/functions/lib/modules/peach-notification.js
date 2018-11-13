"use strict";
// ######################################################################
// Receive notification from Peach
// ######################################################################
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const BFNConstants = require("../models/constants");
exports.peachNotify = functions.https.onRequest(async (request, response) => {
    if (!request.body) {
        console.log("ERROR - request has no body");
        return response.sendStatus(400);
    }
    console.log(request.body);
    try {
        const firestore = admin.firestore();
        const settings = { /* your settings... */ timestampsInSnapshots: true };
        firestore.settings(settings);
        console.log("Firebase settings completed. Should be free of annoying messages from Google");
    }
    catch (e) {
        //console.log(e);
    }
    await sendToTopic(request.body);
    return response.status(200).send("OK");
    /*
{ callpay_transaction_id: '1701753',
  success: '1',
  amount: '129409.00',
  created: '2018-11-13 20:03:54',
  reason: 'n/a',
  user: 'malengadev',
  merchant_reference: 'OneConnect',
  gateway_reference: '1701753',
  organisation_id: '1712',
  gateway_response: '{\n    "merchant": {\n        "reference": "OneConnect"\n    },\n    "customer": {\n        "account": "4242424242424242424242",\n        "account_type": "current",\n        "bank": "absa",\n        "branch_code": "632005"\n    }\n}',
  currency: 'ZAR',
  payment_key: 'c9a1dad3baca8bbf35571c42413624e7' }
*/
    async function sendToTopic(data) {
        const payload = {
            notification: {
                title: "Peach Payments",
                body: "Peach Payments Notification"
            },
            data: {
                json: JSON.stringify(data),
                messageType: "PEACH_NOTIFY"
            }
        };
        const topic = BFNConstants.Constants.TOPIC_PEACH_NOTIFY;
        console.log(`sending PeachNotify to ${topic}`);
        return admin.messaging().sendToTopic(topic, payload);
    }
    function handleError(message) {
        console.log("--- ERROR !!! --- sending error payload: msg:" + message);
        try {
            const payload = {
                name: "peachNotification",
                message: message,
                data: request.body.data,
                date: new Date().toISOString()
            };
            console.log(payload);
            response.status(400).send(payload);
        }
        catch (e) {
            console.log("possible error propagation/cascade here. ignored");
            response.status(400).send(message);
        }
    }
});
//# sourceMappingURL=peach-notification.js.map