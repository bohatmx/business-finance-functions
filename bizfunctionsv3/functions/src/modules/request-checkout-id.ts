// ######################################################################
// Request checkout ID from Peach
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as BFNConstants from "../models/constants";
import * as AxiosComms from "./axios-comms";

export const requestCheckOutId = functions.https.onRequest(
  async (request, response) => {
    if (!request.body) {
      console.log("ERROR - request has no body");
      return response.sendStatus(400);
    }
    const mdebug = request.body.debug;
    let notify = BFNConstants.Constants.DEBUG_FUNCTIONS_URL + "peachNotify";
    if (mdebug !== true) {
      notify = BFNConstants.Constants.RELEASE_FUNCTIONS_URL + "peachNotify";
    }
    const dataIn = {
      "authentication.userId": BFNConstants.Constants.PEACH_USERID,
      "authentication.password": BFNConstants.Constants.PEACH_PASSWORD,
      "authentication.entityId": BFNConstants.Constants.PEACH_ENTITYID_ONCEOFF,
      amount: request.body.amount,
      currency: request.body.currency,
      paymentType: request.body.paymentType,
      notificationUrl: notify
    };
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
    console.log(`##### Incoming debug ${mdebug}`);
    console.log(`##### Incoming data ${JSON.stringify(dataIn)}`);

    const apiSuffix = "/v1/checkouts";
    await talkToPeach();
    return null;

    async function talkToPeach() {
      let url;
      if (mdebug) {
        url = BFNConstants.Constants.PEACH_TEST_URL + apiSuffix;
      } else {
        url = BFNConstants.Constants.PEACH_TEST_URL + apiSuffix;
      }
      console.log(url)
      try {
        const mresponse = await AxiosComms.AxiosComms.execute(url, dataIn);
        console.log(mresponse);
        if (mresponse.status === 200) {
          response.status(200).send(mresponse);
          return null;
        } else {
          console.log(`** Peach ERROR ## ${mresponse.data}`);
          handleError(mresponse);
        }
      } catch (error) {
        handleError(`Call to Peach failed: ${error}`);
        return null;
      }
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
