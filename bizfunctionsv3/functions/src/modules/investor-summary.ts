// ######################################################################
// Aggregate Open Offers
// ######################################################################
//curl --header "Content-Type: application/json"   --request POST   --data '{"investorId": "32a26a20-bd30-11e8-84f5-63a97aaac795"}'   https://us-central1-business-finance-dev.cloudfunctions.net/getInvestorsSummary

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as Data from "../models/data";

export const getInvestorsSummary = functions.https.onRequest(
  async (request, response) => {
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
    const documentId = request.body.documentId;
    if (!documentId) {
      response.status(400).send("Missing documentId");
      return null;
    }
    console.log(`incoming investor documentId: ${documentId}`);
    const resultItem = {
      totalUnsettledBids: 0,
      totalUnsettledBidAmount: 0.0,
      totalSettledBids: 0,
      totalSettledBidAmount: 0.0,
      date: new Date().toISOString()
    };
    const invoiceBids: Data.InvoiceBid[] = [];

    const Ok = await getBids();
    if (Ok) {
      await calculate();
      console.log(resultItem);
      return response.status(200).send(resultItem);
    }
    return null;


    async function calculate() {
      for (const bid of invoiceBids) {
        if (bid.isSettled === true) {
          resultItem.totalSettledBids++;
          resultItem.totalSettledBidAmount += bid.amount;
        } else {
          resultItem.totalUnsettledBids++;
          resultItem.totalUnsettledBidAmount += bid.amount;
        }
      }
      console.log(resultItem);
      return null;
    }

    async function getBids() {
      try {
        let querySnapshot;
        querySnapshot = await admin
          .firestore()
          .collection("investors")
          .doc(documentId)
          .collection("invoiceBids")
          .get();

        console.log(`found ${querySnapshot.docs.length} investor bids ...`);

        for (const q of querySnapshot.docs) {
          const bid = new Data.InvoiceBid();
          const data = q.data();
          bid.offer = data.offer;
          bid.amount = data.amount;
          bid.autoTradeOrder = data.autoTradeOrder;
          bid.date = data.date;
          bid.investor = data.investor;
          bid.investorName = data.investorName;
          bid.invoiceBidId = data.invoiceBidId;
          bid.isSettled = data.isSettled;
          bid.startTime = data.startTime;
          bid.endTime = data.endTime;
          invoiceBids.push(bid);
        }
      } catch (e) {
        console.log(e);
        handleError(e);
        return false;
      }
      return true;
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
        response.status(400).send("Investor Summary Query Failed");
      }
    }
  }
);
