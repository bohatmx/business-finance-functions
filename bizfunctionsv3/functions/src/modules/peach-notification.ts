// ######################################################################
// Receive notification from Peach
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as BFNConstants from "../models/constants";

export const peachNotify = functions.https.onRequest(
  async (request, response) => {
    if (!request.body) {
      console.log("ERROR - request has no body");
      return response.sendStatus(400);
    }
    console.log(request.body);
    try {
      const firestore = admin.firestore();
      const settings = { /* your settings... */ timestampsInSnapshots: true };
      firestore.settings(settings);
      console.log(
        "Firebase settings completed. Should be free of annoying messages from Google"
      );
    } catch (e) {
      //console.log(e);
    }

    await writeToFirestore(request.body)
    await sendToTopic(request.body);
    return response.status(200).send("OK");


    async function writeToFirestore(data) {
      try {
        const mRef = await admin.firestore().collection('peachTransactions').add(data);
        console.log(`Peach transaction written, path - ${mRef.path}`)
      } catch (e) {
        console.log(e)
      }
    }
    async function sendToTopic(data) {
      const payload = {

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
      } catch (e) {
        console.log("possible error propagation/cascade here. ignored");
        response.status(400).send(message);
      }
    }
  }
);
