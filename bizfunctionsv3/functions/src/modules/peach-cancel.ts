// ######################################################################
// Receive CANCEL notification from Peach
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as BFNConstants from "../models/constants";

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
    await writeToFirestore(request.body)
    await sendToTopic(request.body)
    return response.status(200).send('OK');

    async function writeToFirestore(data) {
      try {
        const mRef = await admin.firestore()
        .collection('peachCancellations').add(data);
        console.log(`Peach cancellation written, path - ${mRef.path}`)
      } catch (e) {
        console.log(e)
      }
    }
    async function sendToTopic(data) {
      let mdata = data;
      if (!data) {
        mdata = {
          'message':'Payment is cancelled',
          'date': new Date().toISOString()
        }
      }

      const payload = {
        
        data: {
          json: JSON.stringify(mdata),
          messageType: "PEACH_CANCEL"
        }
      };
      const topic = BFNConstants.Constants.TOPIC_PEACH_CANCEL;
      console.log(`sending PeachCancel to topic: ${topic}`);
      return admin.messaging().sendToTopic(topic, payload);
    }
  }
);
