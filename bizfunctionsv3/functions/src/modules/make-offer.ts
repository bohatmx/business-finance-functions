// ######################################################################
// Add DeliveryNote to BFN and Firestore
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as BFNConstants from "../models/constants";
import * as AxiosComms from "./axios-comms";
const uuid = require("uuid/v1");
// const Firestore = require("firestore");

export const makeOffer = functions.https.onRequest(
  async (request, response) => {
    if (!request.body) {
      console.log("ERROR - request has no body");
      return response.sendStatus(400);
    }
    // const firestore = new Firestore();
    // const settings = { /* your settings... */ timestampsInSnapshots: true };
    // firestore.settings(settings);

    console.log(`##### Incoming debug ${request.body.debug}`);
    console.log(`##### Incoming data ${JSON.stringify(request.body.data)}`);

    const debug = request.body.debug;
    const data = request.body.data;

    const apiSuffix = "MakeOffer";

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
      let url;
      if (debug) {
        url = BFNConstants.Constants.DEBUG_URL + apiSuffix;
      } else {
        url = BFNConstants.Constants.RELEASE_URL + apiSuffix;
      }
      if (!data.offerId) {
        data["offerId"] = uuid();
      }
      try {
        const mresponse = await AxiosComms.AxiosComms.execute(url, data);
        if (mresponse.status === 200) {
          return writeToFirestore(mresponse.data);
        } else {
          console.log(`** BFN ERROR ## ${mresponse.data}`);
          handleError(mresponse);
        }
      } catch (error) {
        handleError(error);
      }
    }

    async function writeToFirestore(mdata) {
      try {
        let ref1;
        ref1 = await admin
          .firestore()
          .collection("invoiceOffers")
          .add(mdata)
          .catch(function(error) {
            console.log(error);
            handleError(error);
          });
        console.log(`** Data written to Firestore! ${ref1.path}`);
        await sendMessageToTopic(mdata)
        response.status(200).send(mdata);
        return ref1;
      } catch (e) {
        console.log(e);
        handleError(e);
      }
    }
    async function sendMessageToTopic(mdata) {
      const topic = `offers`;
      const payload = {
        data: {
          messageType: "OFFER",
          json: JSON.stringify(mdata)
        },
        notification: {
          title: "BFN Offer",
          body:
            "Offer from " + mdata.supplierName + " amount: " + mdata.offerAmount
        }
      };

      console.log("sending Offer data to topic: " + topic);
      return await admin.messaging().sendToTopic(topic, payload);
    }
    function handleError(message) {
      console.log("--- ERROR !!! --- sending error payload: msg:" + message);
      try {
        const payload = {
          name: apiSuffix,
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
