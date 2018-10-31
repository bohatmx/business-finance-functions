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
    const investorId = request.body.investorId;
    if (!investorId) {
      response.status(400).send("Missing investorId");
      return null;
    }
    console.log(`incoming investor: ${investorId}`);
    const resultItem = {
      investorName: null,
      totalUnsettledBids: 0,
      totalUnsettledBidAmount: 0.0,
      maxInvestableAmount: 0.0,
      investorId: null
    };
    const invoiceBids: Data.InvoiceBid[] = [];
    let profile: Data.InvestorProfile;

    const Ok = await getUnsettledBids();
    if (Ok) {
      await getProfile();
      await calculate();
       console.log(resultItem);
      return response.status(200).send(resultItem);
    }
    return null
   

    async function getProfile() {
      let qs;
      qs = await admin
        .firestore()
        .collection("investorProfiles")
        .where(
          "investor",
          "==",
          `resource:com.oneconnect.biz.Investor#${investorId}`
        )
        .get();
      for (const q of qs.docs) {
        const p = new Data.InvestorProfile();
        const data = q.data();
        p.name = data.name;
        p.investor = data.investor;
        p.maxInvestableAmount = data.maxInvestableAmount;
        p.maxInvoiceAmount = data.maxInvoiceAmount;
        profile = p;
      }
      console.log(profile)
      return null;
    }
    async function calculate() {
      let tot = 0.0;
      let count = 0;
      for (const bid of invoiceBids) {
        tot += bid.amount;
        count++;
      }
      resultItem.investorId = investorId;
      resultItem.investorName = profile.name;
      resultItem.maxInvestableAmount = profile.maxInvestableAmount;
      resultItem.totalUnsettledBidAmount = tot;
      resultItem.totalUnsettledBids = count;

      console.log(resultItem)
      return null;
    }

    async function getUnsettledBids() {
      try {
        let queryRef;
        queryRef = await admin
          .firestore()
          .collection("investors")
          .where("participantId", "==", investorId)
          .get()
          .catch(function(error) {
            console.log(error);
            handleError(error);
            return false
          });
        console.log(
          `found ${queryRef.docs.length} investor .... looking for bids ...`
        );
        if (queryRef.docs.length == 0) {
          response.status(400).send("Investor not found. Quit!");
          return false;
        }
        for (const doc of queryRef.docs) {
          const qs = await doc.ref
            .collection("invoiceBids")
            .where("isSettled", "==", false)
            .get();
          console.log(`found ${qs.docs.length} investor bids ...`);
          for (const q of qs.docs) {
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
        }
      } catch (e) {
        console.log(e);
        handleError(e);
        return false
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
