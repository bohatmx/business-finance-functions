// ######################################################################
// Receive CANCEL notification from Peach
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as BFNConstants from "../models/constants";
import * as AxiosComms from "./axios-comms";

export const peachCancel= functions.https.onRequest(
  async (request, response) => {
    console.log(request.body)
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
    await sendToTopic(request.body)
    return response.status(200).send(request.body);

    async function sendToTopic(data) {
      let mdata = data;
      if (!data) {
        mdata = {
          'message':'Payment is cancelled',
          'date': new Date().toISOString()
        }
      }

      const payload = {
        notification: {
          title: "Peach Payments",
          body: "Peach Payments Cancelled Message"
        },
        data: {
          json: JSON.stringify(mdata),
          messageType: "PEACH_CANCEL"
        }
      };
      const topic = BFNConstants.Constants.TOPIC_PEACH_CANCEL;
      console.log(`sending PeachCancel to topic: ${topic}`);
      return admin.messaging().sendToTopic(topic, payload);
    }
    function handleError(message) {
      console.log("--- ERROR !!! --- sending error payload: msg:" + message);
      try {
        const payload = {
          name: 'peachNotification',
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
