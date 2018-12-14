"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ######################################################################
// Triggered by chat message added to firestore. send message to topic
// ######################################################################
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const constants = require("../models/constants");
exports.chatMessageAdded = functions.firestore
    .document("chatMessages/{userId}/messages/{msgId}")
    .onCreate(async (snap, context) => {
    const chatMessage = snap.data();
    console.log(snap.ref);
    const path = snap.ref.path;
    console.log(chatMessage);
    const payload = {
        data: {
            json: JSON.stringify(chatMessage),
            messageType: "CHAT_MESSAGE"
        },
        notification: {
            title: "BFN Chat Message",
            body: chatMessage.message
        }
    };
    chatMessage.path = path;
    await writeToFirestore(chatMessage);
    const topic = constants.Constants.TOPIC_CHAT_MESSAGES_ADDED;
    await admin.messaging().sendToTopic(topic, payload).catch(e => {
        console.log(e);
        throw e;
    });
    console.log(`chatMessageAdded: sent to topic: ${topic} data: ${JSON.stringify(chatMessage)}`);
    return null;
    async function writeToFirestore(data) {
        let ref;
        ref = await admin
            .firestore()
            .collection("chatResponsesPending")
            .add(data)
            .catch(e => {
            console.log(e);
            throw e;
        });
        console.log(`message written to Firestore: ${ref.path}`);
    }
});
//# sourceMappingURL=chatmessage_added.js.map