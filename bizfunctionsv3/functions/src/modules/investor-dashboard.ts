// ######################################################################
// Aggregate Investor Data
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// const Firestore = require("firestore");

export const investorDashboard = functions.https.onRequest(
  async (request, response) => {
    if (!request.body) {
      console.log("ERROR - request has no body");
      return response.status(400).send('request has no body');
    }
    if (!request.body.id) {
      console.log("ERROR - request has no id");
      return response.status(400).send('request has no id');
    }
    if (!request.body.documentId) {
      console.log("ERROR - request has no documentId");
      return response.status(400).send('request has no documentId');
    }
    // const firestore = new Firestore();
    // const settings = { /* your settings... */ timestampsInSnapshots: true };
    // firestore.settings(settings);

    console.log(`##### Incoming investorId ${request.body.id}`);
    console.log(
      `##### Incoming documentId ${JSON.stringify(request.body.documentId)}`
    );

    const investorId = request.body.id;
    const documentId = request.body.documentId;

    const result = {
      totalOpenOffers: 0,
      totalOpenOfferAmount: 0.00,
      totalUnsettledBids: 0,
      totalUnsettledAmount: 0.00,
      totalSettledBids: 0,
      totalSettledAmount: 0.00,
      totalBids: 0,
      totalBidAmount: 0.00,
      date: new Date().toISOString(),
      investorId: investorId,
      averageBidAmount: 0.00,
      averageDiscountPerc: 0.0,
      totalOfferAmount: 0.00,
      totalOffers: 0,
    };

    await getOpenOffers();
    await getBids()

    console.log(result)
    return response.status(200).send(result);

    async function getBids() {
      try {
        let queryRef;
        queryRef = await admin
          .firestore()
          .collection("investors")
          .doc(documentId)
          .collection("invoiceBids")
          .get()
          .catch(function(error) {
            console.log(error);
            handleError(error);
          });
        
        let totPerc = 0.0
        queryRef.docs.forEach(doc => {
          result.totalBidAmount += doc.data().amount;
          result.totalBids++;
          totPerc += doc.data().discountPercent
          if (doc.data().isSettled === false) {
            result.totalUnsettledAmount += doc.data().amount;
            result.totalUnsettledBids++;
          } else {
            result.totalSettledAmount += doc.data().amount;
            result.totalSettledBids++;
          }
        });
        result.averageBidAmount = result.totalBidAmount / result.totalBids;
        result.averageDiscountPerc = totPerc / result.totalBids

        return null;
      } catch (e) {
        console.log(e);
        handleError(e);
      }
    }
    async function getOpenOffers() {
      try {
        let queryRef;
        queryRef = await admin
          .firestore()
          .collection("invoiceOffers")
          .where("isOpen", "==", true)
          .get()
          .catch(function(error) {
            console.log(error);
            handleError(error);
          });
        let tot = 0.0;
        queryRef.docs.forEach(doc => {
          tot += doc.data().offerAmount;
        });
        result.totalOpenOfferAmount = tot;
        result.totalOpenOffers = queryRef.docs.length;

        return null;
      } catch (e) {
        console.log(e);
        handleError(e);
      }
    }

    function handleError(message) {
      console.log("--- ERROR !!! --- sending error payload: msg:" + message);
      try {
        const payload = {
          name: "investorDashboard",
          message: message,
          date: new Date().toISOString()
        };
        console.log(payload);
        response.status(400).send(payload);
      } catch (e) {
        console.log("possible error propagation/cascade here. ignored");
        response.status(400).send('Dashboard Query Failed');
      }
    }
  }
);
