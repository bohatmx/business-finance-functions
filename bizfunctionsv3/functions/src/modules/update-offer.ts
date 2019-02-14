// ######################################################################
// Add DeliveryNote to BFN and Firestore
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as BFNConstants from "../models/constants";
import * as AxiosComms from "./axios-comms";
const uuid = require("uuid/v1");

export const updateOffer = functions.https.onRequest(
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


    console.log(`##### Incoming debug ${request.body.debug}`);
    console.log(`##### Incoming data ${JSON.stringify(request.body.data)}`);

    const debug = request.body.debug;
    const data = request.body.data;

    const functionName = "updateOffer";

    if (validate()) {
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
        data.date = new Date().toISOString()
        data.intDate = null
        data.itemNumber = null
        const mresponse = await AxiosComms.AxiosComms.executeTransaction(functionName, data);
        if (mresponse.status === 200) {
          return updateFirestore(mresponse.data);
        } else {
          console.log(`** BFN ERROR ## ${mresponse.data}`);
          throw new Error(mresponse);
        }
      } catch (error) {
        throw error;
      }
    }

    async function updateFirestore(mdata) {
      mdata.intDate = new Date().getTime()    
      try {
        let snapshot;
        snapshot = await admin
          .firestore()
          .collection("invoiceOffers")
          .doc(mdata.documentReference)
         .get();
        
        await snapshot.ref.set(mdata)
        console.log(`** offer data updated on Firestore! ${snapshot.path}`);
        response.status(200).send(mdata);
        return snapshot;
      } catch (e) {
        console.log(e);
        throw e;
      }
    }

  }
);
