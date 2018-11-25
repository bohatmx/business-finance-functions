"use strict";
// ######################################################################
// Receive ERROR notification from Peach
// ######################################################################
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const BFNConstants = require("../models/constants");
exports.peachError = functions.https.onRequest(async (request, response) => {
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
    await writeToFirestore(request.body);
    await sendToTopic(request.body);
    return response.status(200).send('OK');
    async function writeToFirestore(data) {
        try {
            const mRef = await admin.firestore().collection('peachErrors').add(data);
            console.log(`Peach error written, path - ${mRef.path}`);
        }
        catch (e) {
            console.log(e);
        }
    }
    async function sendToTopic(data) {
        let mdata = data;
        if (!data) {
            mdata = {
                'message': 'Payment is in Error',
                'date': new Date().toISOString()
            };
        }
        const payload = {
            data: {
                json: JSON.stringify(mdata),
                messageType: "PEACH_ERROR"
            }
        };
        const topic = BFNConstants.Constants.TOPIC_PEACH_ERROR;
        console.log(`sending PeachError to topic: ${topic}`);
        return admin.messaging().sendToTopic(topic, payload);
    }
});
//# sourceMappingURL=peach-error.js.map