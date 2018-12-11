// ######################################################################
// Add DeliveryNote to BFN and Firestore
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as BFNConstants from "../models/constants";
import * as AxiosComms from "./axios-comms";
const uuid = require("uuid/v1");

export const makeOffer = functions.https.onRequest(
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
    const fs = admin.firestore()
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
        data.date = new Date().toISOString();
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
      mdata.intDate = new Date().getTime();
      mdata.date = new Date().toISOString();

      try {
        let ref1;
        ref1 = await fs
          .collection("invoiceOffers")
          .add(mdata)
          .catch(function(error) {
            console.log(error);
            handleError(error);
          });
        console.log(`** Data written to Firestore! ${ref1.path}`);
        //update documentReference
        mdata.documentReference = ref1.path.split("/")[1];
        await ref1.set(mdata);

        await sendMessageToTopic(mdata);
        await updateInvoice(mdata);
        response.status(200).send(mdata);
        return ref1;
      } catch (e) {
        console.log(e);
        handleError(e);
      }
    }
    async function updateInvoice(offer) {
      console.log(
        "## update invoice isOnOffer will be set to true ....on Firestore!!"
      );
      let querySnapshot;
      let invoice;
      querySnapshot = await fs
        .collection("suppliers")
        .doc(offer.supplierDocumentRef)
        .collection("invoices")
        .where("invoiceId", "==", offer.invoice.split("#")[1])
        .get();
      if (querySnapshot.docs.length > 0) {
        invoice = querySnapshot.docs[0].data();
        invoice.isOnOffer = true;
        await querySnapshot.docs[0].ref.set(invoice).catch(e => {
          console.log(e);
          handleError("Invoice(supplier) isOnOffer update failed");
        });
        console.log("Invoice updated (supplier), isOnOffer = true ..Firestore");
      }
      //
      let querySnapshot2;
      querySnapshot2 = await fs
        .collection("govtEntities")
        .where("participantId", "==", invoice.govtEntity.split("#")[1])
        .get();
      if (querySnapshot2.docs.length > 0) {
        const customerRef = querySnapshot2.docs[0].ref;
        const qs = await customerRef
          .collection("invoices")
          .where("invoiceId", "==", invoice.invoiceId)
          .get()
          .catch(e => {
            console.log(e);
            handleError("Invoice(customer) isOnOffer update failed");
          });
        if (qs.docs.length > 0) {
          const inv = qs.docs[0].data();
          inv.isOnOffer = true;
          qs.docs[0].ref.set(inv);
          console.log(
            "Invoice updated (customer), isOnOffer = true ..Firestore"
          );
        }
      }
    }
    async function sendMessageToTopic(mdata) {
      try {
        const topic = BFNConstants.Constants.TOPIC_OFFERS;
        const topic2 =
          BFNConstants.Constants.TOPIC_OFFERS + mdata.supplier.split("#")[1];
        const topic3 =
          BFNConstants.Constants.TOPIC_OFFERS + mdata.customer.split("#")[1];
        const mCondition = `'${topic}' in topics || '${topic2}' in topics || '${topic3}' in topics`;
        console.log(`sending Offer data to topics, mCondition: ${mCondition}`);
        const payload = {
          data: {
            messageType: "OFFER",
            json: JSON.stringify(mdata)
          },
          notification: {
            title: "BFN Offer",
            body:
              "Offer from " +
              mdata.supplierName +
              " amount: " +
              mdata.offerAmount
          },
          condition: mCondition
        };
        admin.messaging().send(payload);
      } catch (e) {
        console.error(e);
        handleError(e)
      }
      return null;
    }
    function handleError(message) {
      console.log("--- ERROR !!! --- sending error payload: msg:" + message);
      throw new Error(message);
    }
  }
);
