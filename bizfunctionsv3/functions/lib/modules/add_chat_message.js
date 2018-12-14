"use strict";
// ######################################################################
// Add Chat message to Firestore
// ######################################################################
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const constants = require("../models/constants");
exports.addChatMessage = functions.https.onRequest(async (request, response) => {
    if (!request.body) {
        console.log("ERROR - request has no body");
        return response.sendStatus(400);
    }
    try {
        const firestore = admin.firestore();
        const settings = { /* your settings... */ timestampsInSnapshots: true };
        firestore.settings(settings);
        console.log("Firebase settings completed. Should be free of annoying messages from Google");
    }
    catch (e) {
        console.log(e);
    }
    console.log(`##### Incoming debug ${request.body.debug}`);
    console.log(`##### Incoming data ${JSON.stringify(request.body.data)}`);
    const debug = request.body.debug;
    const data = request.body.data;
    const fs = admin.firestore();
    if (validate()) {
        data.date = new Date().toISOString();
        await writeToFirestore(data);
    }
    return null;
    function validate() {
        if (!request.body) {
            console.error("ERROR - request has no body");
            throw new Error("request has no body");
        }
        if (!request.body.data) {
            console.error("ERROR - request has no data");
            throw new Error(" request has no data");
        }
        return true;
    }
    async function writeToFirestore(mdata) {
        mdata.intDate = new Date().getTime();
        mdata.date = new Date().toISOString();
        try {
            let ref1;
            ref1 = await fs
                .collection("chatMessages")
                .doc(mdata.userId)
                .collection("messages")
                .add(mdata);
            console.log(`**  chat message written to Firestore! ${ref1.path}`);
            //update path
            mdata.path = ref1.path;
            await ref1.set(mdata);
            await writeResponsePending(mdata);
            await sendMessageToTopic(mdata);
            response.status(200).send(mdata);
            return ref1;
        }
        catch (e) {
            console.error(e);
            handleError(e);
        }
        return null;
    }
    async function writeResponsePending(mresp) {
        try {
            let ref;
            ref = await fs.collection("chatResponsesPending").add(mresp);
            console.log(`chat responses pending added, path: ${ref.path}`);
            mresp.documentPath = ref.path;
            await ref.set(mresp);
        }
        catch (e) {
            console.error(e);
            throw e;
        }
    }
    async function sendMessageToTopic(mdata) {
        try {
            const payload = {
                data: {
                    json: JSON.stringify(mdata),
                    messageType: "CHAT_MESSAGE"
                },
                notification: {
                    title: "BFN Chat Message",
                    body: mdata.message
                }
            };
            if (mdata.responseFCMToken) {
                console.log(`sending chat message to support device: ${mdata.responseFCMToken}`);
                await admin.messaging().sendToDevice(mdata.responseFCMToken, payload);
            }
            else {
                const topic = constants.Constants.TOPIC_CHAT_MESSAGES_ADDED;
                await admin
                    .messaging()
                    .sendToTopic(topic, payload)
                    .catch(e => {
                    console.log(e);
                    throw e;
                });
                console.log(`chatMessageAdded: sent to support topic: ${topic} data: ${JSON.stringify(mdata)}`);
                admin.messaging().sendToTopic(topic, payload);
            }
        }
        catch (e) {
            console.error(e);
            handleError(e);
        }
        return null;
    }
    function handleError(message) {
        throw new Error(message);
    }
});
//# sourceMappingURL=add_chat_message.js.map