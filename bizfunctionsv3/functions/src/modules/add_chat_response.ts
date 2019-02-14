// ######################################################################
// Add chat resonse to Firestore
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { DocumentSnapshot } from "firebase-functions/lib/providers/firestore";
import * as constants from "../models/constants";

export const addChatResponse = functions.https.onRequest(
  async (request, response) => {
    if (!request.body) {
      console.log("ERROR - request has no body");
      return response.sendStatus(400);
    }

    try {
      const firestore = admin.firestore();
      const settings = { /* your settings... */ timestampsInSnapshots: true };
      firestore.settings(settings);
      console.log(
        "Firebase settings completed. Should be free of annoying messages from Google"
      );
    } catch (e) {
      console.log(e);
    }

    console.log(`##### Incoming data ${JSON.stringify(request.body.data)}`);

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
      mdata.date = new Date().toISOString();
      if (!mdata.chatMessage.path) {
        throw new Error(`chatMessage.path is null`);
      }
      mdata.documentPath = "will be updated";
      try {
        let docSnapshot: DocumentSnapshot;
        docSnapshot = await fs.doc(mdata.chatMessage.path).get();
        if (!docSnapshot.exists) {
          throw new Error("chat message to respond to has not been found");
        }
        let ref;
        ref = await docSnapshot.ref.collection("responses").add(mdata);
        mdata.documentPath = ref.path;
        await ref.set(mdata);

        const chatMsg = docSnapshot.data();
        chatMsg.hasResponse = true;
        chatMsg.lastResponseDate = new Date().toISOString();
        await docSnapshot.ref.set(chatMsg);

        console.log(`response written to chat message: ${ref.path}`);
        await sendMessageToTopic(mdata);
        response.status(200).send(mdata);
        return null;
      } catch (e) {
        console.error(e);
        handleError(e);
      }
    }
    async function sendMessageToTopic(mdata) {
      try {
        const payload = {
          data: { json: JSON.stringify(mdata), messageType: "CHAT_RESPONSE" },
          notification: {
            title: "BFN Chat Response",
            body: mdata.responseMessage
          }
        };
        if (mdata.chatMessage.fcmToken) {
          console.log(
            `sending response to device: ${mdata.chatMessage.fcmToken}`
          );
          await admin
            .messaging()
            .sendToDevice(mdata.chatMessage.fcmToken, payload);
        } else {
          const topic = constants.Constants.TOPIC_CHAT_RESPONSES_ADDED;
          await admin
            .messaging()
            .sendToTopic(topic, payload)
            .catch(e => {
              console.log(e);
              throw e;
            });
          console.log(
            `chatResponseAdded: sent to topic: ${topic} data: ${JSON.stringify(
              mdata
            )}`
          );
        }
        return null;
      } catch (e) {
        console.error(e);
        handleError(e);
      }
      return null;
    }
    function handleError(message) {
      throw new Error(message);
    }
  }
);
