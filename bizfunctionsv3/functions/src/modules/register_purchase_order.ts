// ######################################################################
// Add PurchaseOrder to BFN and Firestore
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as BFNConstants from "../models/constants";
import * as AxiosComms from "./axios-comms";
const uuid = require("uuid/v1");

export const registerPurchaseOrder = functions.https.onRequest(
  async (request, response) => {
    if (!request.body) {
      console.log("ERROR - request has no body");
      return response.status(400).send("request has no body");
    }

    const fs = admin.firestore()
    try {
      const settings = { /* your settings... */ timestampsInSnapshots: true };
      fs.settings(settings);
      console.log(
        "Firebase settings completed. Should be free of annoying messages from Google"
      );
    } catch (e) {
      console.log(e);
    }

    console.log(`##### Incoming debug ${request.body.debug}`);
    console.log(`##### Incoming data ${JSON.stringify(request.body.data)}`);

    const debug = request.body.debug;
    const data = request.body.data;

    const functionName = "addPurchaseOrder";

    if (validate() === true) {
      await writeToBFN();
    }
    return null;

    function validate() {
      if (!request.body) {
        console.log("ERROR - request has no body");
        return response.status(400).send("request has no body");
      }
      if (!request.body.debug) {
        console.log("ERROR - request has no debug flag");
        return response.status(400).send(" request has no debug flag");
      }
      if (!request.body.data) {
        console.log("ERROR - request has no data");
        return response.status(400).send(" request has no data");
      }
      return true;
    }
    async function writeToBFN() {
      
      try {
        const mresponse = await AxiosComms.AxiosComms.executeTransaction(functionName, data);
        if (mresponse.status === 200) {
          return writeToFirestore(mresponse.data);
        } else {
          handleError(`BFN fucked up. status: ${mresponse.status}`);
        }
      } catch (error) {
        console.log(error);
        handleError(error);
      }
    }

    async function writeToFirestore(mdata) {
      mdata.intDate = new Date().getTime();
      mdata.date = new Date().toISOString();
      try {
        let mdocID;
        if (!mdata.govtDocumentRef) {
          const key = mdata.govtEntity.split("#")[1];
          const snapshot = await fs
            .collection("govtEntities")
            .where("participantId", "==", key)
            .get()
            .catch(function(error) {
              console.log(error);
              handleError(error);
              return null;
            });
          snapshot.forEach(doc => {
            mdocID = doc.id;
          });
        } else {
          mdocID = mdata.govtDocumentRef;
        }
        let ref1;
        if (mdocID) {
          ref1 = await fs
            .collection("govtEntities")
            .doc(mdata.govtDocumentRef)
            .collection("purchaseOrders")
            .add(mdata)
            .catch(function(error) {
              console.log(error);
              handleError(error);
            });
          console.log(
            `*** Data successfully written to Firestore! ${ref1.path}`
          );
        }

        let docID;
        if (!mdata.supplierDocumentRef) {
          const key = mdata.supplier.split("#")[1];
          const snapshot = await fs
            .collection("suppliers")
            .where("participantId", "==", key)
            .get()
            .catch(function(error) {
              console.log(error);
              handleError(error);
              return null;
            });
          snapshot.forEach(doc => {
            docID = doc.id;
          });
        } else {
          docID = mdata.supplierDocumentRef;
        }
        if (docID) {
          const ref2 = await fs
            .collection("suppliers")
            .doc(docID)
            .collection("purchaseOrders")
            .add(mdata)
            .catch(function(error) {
              console.log(error);
              handleError(error);
              return null;
            });
          console.log(
            `*** Data successfully written to Firestore! ${ref2.path}`
          );
        }
        await sendMessageToTopic(mdata);
        console.log("Purchase Order processed OK... done!");
        response.status(200).send(mdata);
      } catch (e) {
        console.log(e);
        handleError(e);
      }
    }
    async function sendMessageToTopic(mdata) {
      const topic1 = BFNConstants.Constants.TOPIC_PURCHASE_ORDERS + mdata.supplier.split("#")[1];
      const topic2 = BFNConstants.Constants.TOPIC_PURCHASE_ORDERS + mdata.govtEntity.split("#")[1];
      const topic3 = BFNConstants.Constants.TOPIC_PURCHASE_ORDERS;
      const mCondition = `'${topic3}' in topics || '${topic2}' in topics || '${topic1}' in topics`;

      const payload = {
        data: {
          messageType: "PURCHASE_ORDER",
          json: JSON.stringify(mdata)
        },
        notification: {
          title: "Purchase Order",
          body: "Purchase Order amount: " + mdata.amount
        },
        condition: mCondition
      };

      try {
        console.log("sending purchase order data to topics: " + topic1 + ' ' + topic2 + ' ' + topic3);
        await admin.messaging().send(payload)
        return null
      } catch (e) {
        console.error(e);
        throw e;
      }
    }
    function handleError(message) {
      console.log("--- ERROR !!! --- sending error payload: msg:" + message);
      throw new Error(message)
    }
  }
);
