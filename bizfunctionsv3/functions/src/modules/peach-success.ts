// ######################################################################
// Receive SUCCESS notification from Peach
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as BFNConstants from "../models/constants";

export const peachSuccess = functions.https.onRequest(
  async (request, response) => {
    console.log(request);
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
    await sendToTopic(request.body);
    return response.status(200).send(request.body);

    async function sendToTopic(data) {
      let mdata = data;
      if (!data) {
        mdata = {
          'message':'Payment is cool',
          'date': new Date().toISOString()
        }
      }

      const payload = {
        notification: {
          title: "Peach Payments",
          body: "Peach Payments Succcess Message"
        },
        data: {
          json: JSON.stringify(mdata),
          messageType: "PEACH_SUCCESS"
        }
      };
      const topic = BFNConstants.Constants.TOPIC_PEACH_SUCCESS;
      console.log(`sending PeachSuccess to topic: ${topic}`);
      return admin.messaging().sendToTopic(topic, payload);
    }

  }
);
