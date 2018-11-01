// ######################################################################
// Triggered by user addedd to firestore. send message to users topic
// ######################################################################
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as constants from "../models/constants";

export const deliveryNoteAdded = functions.firestore
  .document("govtEntities/{id}/deliveryNotes/{mId}")
  .onCreate((snap, context) => {
    const note = snap.data();
    console.log(note);
    const payload = {
      notification: {
        title: "Delivery Note",
        body:
          "Delivery Note from " +
          note.supplierName +
          " PO# " +
          note.purchaseOrderNumber
      },
      data: {
        json: JSON.stringify(note),
        messageType: "DELIVERY_NOTE"
      }
    };
    const topic =
      constants.Constants.TOPIC_DELIVERY_NOTES + note.govtEntity.split("#")[1];
    const topic2 = constants.Constants.TOPIC_DELIVERY_NOTES + "admin";

    console.log(`sending delivery note to ${topic} and ${topic2} topics`);
    admin.messaging().sendToTopic(topic, payload);
    return admin.messaging().sendToTopic(topic2, payload);
  });
