// ######################################################################
// Add Invoice to BFN and Firestore
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import { InvoiceBidHelper } from "./invoice-bid-helper";

export const makeInvoiceBid = functions.https.onRequest(
  async (request, response) => {
    if (!request.body) {
      console.log("ERROR - request has no body");
      return response.status(400).send("request has no body");
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

    if (validate() === true) {
      try {
        await InvoiceBidHelper.writeInvoiceBidToBFNandFirestore(data, debug);
        response.status(200).send("Invoice Bid made OK");
      } catch (e) {
        console.log(e);
        response.status(400).send(`Problem making bid: ${e}`);
      }
    }

    return null;
    function validate() {
      if (!request.body) {
        console.log("ERROR - request has no body");
        return response.status(400).send("request has no body");
      }
      if (request.body.debug !== false && request.body.debug !== true) {
        console.log("ERROR - request has no debug flag");
        return response.status(400).send(" request has no debug flag");
      }
      if (!request.body.data) {
        console.log("ERROR - request has no data");
        return response.status(400).send(" request has no data");
      }
      return true;
    }
  }
);
