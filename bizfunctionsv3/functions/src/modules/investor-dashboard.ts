// ######################################################################
// Aggregate Investor Data
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as constants from "../models/constants";
import * as data from "../models/data";

// const Firestore = require("firestore");

export const investorDashboard = functions.https.onRequest(
  async (request, response) => {
    if (!request.body) {
      console.log("ERROR - request has no body");
      return response.status(400).send("request has no body");
    }
    if (!request.body.id) {
      console.log("ERROR - request has no id");
      return response.status(400).send("request has no id");
    }
    // if (!request.body.documentId) {
    //   console.log("ERROR - request has no documentId");
    //   return response.status(400).send("request has no documentId");
    // }

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

    console.log(`##### Incoming investorId ${request.body.id}`);
    console.log(
      `##### Incoming documentId ${JSON.stringify(request.body.documentId)}`
    );

    const investorId = request.body.id;
    // const documentId = request.body.documentId;
    let limit = request.body.limit;
    if (!limit) {
      limit = 100;
    }

    const result = {
      totalOpenOffers: 0,
      totalOpenOfferAmount: 0.0,
      totalUnsettledBids: 0,
      totalUnsettledAmount: 0.0,
      totalSettledBids: 0,
      totalSettledAmount: 0.0,
      totalBids: 0,
      totalBidAmount: 0.0,
      date: new Date().toISOString(),
      investorId: investorId,
      averageBidAmount: 0.0,
      averageDiscountPerc: 0.0,
      totalOfferAmount: 0.0,
      totalOffers: 0,
      unsettledBids: [],
      settledBids: [],
      settlements: [],
      openOffers: [],
      totalSettlements: 0,
      totalSettlementAmount: 0.0
    };

    await getOpenOffers();
    await getBids();
    await getSettlements();

    console.log(result);
    return response.status(200).send(result);

    function getBid(doc) {
      const bid: data.InvoiceBid = new data.InvoiceBid();
      bid.amount = doc.amount;
      bid.autoTradeOrder = doc.autoTradeOrder;
      bid.date = doc.date;
      bid.discountPercent = doc.discountPercent;
      bid.documentReference = doc.documentReference;
      bid.endTime = doc.endTime;
      bid.investor = doc.investor;
      bid.investorName = doc.investorName;
      bid.invoiceBidId = doc.invoiceBidId;
      bid.offer = doc.offer;
      bid.offerDocRef = doc.offerDocRef;
      bid.customer = doc.customer;
      bid.customerName = doc.customerName;
      bid.isSettled = doc.isSettled;
      bid.reservePercent = doc.reservePercent;
      bid.startTime = doc.startTime;
      bid.supplierFCMToken = doc.supplierFCMToken;
      bid.supplier = doc.supplier;
      bid.investorDocRef = doc.investorDocRef;
      bid.supplierDocRef = doc.supplierDocRef;
      bid.supplierName = doc.supplierName;
      bid.user = doc.user;
      bid.wallet = doc.wallet;
      bid.intDate = doc.intDate;

      return bid;
    }
    async function getBids() {
      try {
        let querySnapshot;
        querySnapshot = await admin
          .firestore()
          .collection("invoiceBids")
          .where(
            "investor",
            "==",
            constants.Constants.NameSpace + `Investor#${investorId}`
          )
          .orderBy("date")
          .get();

        console.log(
          `Investor has ${querySnapshot.docs.length} invoiceBids on file`
        );
        let totPerc = 0.0;
        let countDiscounts = 0;
        querySnapshot.docs.forEach(doc => {
          const bid: data.InvoiceBid = getBid(doc.data());
          result.totalBidAmount += bid.amount;
          result.totalBids++;

          if (bid.discountPercent) {
            totPerc += bid.discountPercent;
            countDiscounts++;
          }
          if (bid.isSettled === false) {
            result.totalUnsettledAmount += bid.amount;
            result.totalUnsettledBids++;
            result.unsettledBids.push(doc.data());
          } else {
            result.totalSettledAmount += bid.amount;
            result.totalSettledBids++;
            result.settledBids.push(doc.data());
          }
        });

        if (result.totalBids > 0) {
          result.averageBidAmount = result.totalBidAmount / result.totalBids;
        }

        if (countDiscounts > 0) {
          result.averageDiscountPerc = totPerc / countDiscounts;
        }
        console.log(
          `######### totalPerc: ${totPerc} countDiscounts: ${countDiscounts} result.averageDiscountPerc: ${
            result.averageDiscountPerc
          }`
        );
        return null;
      } catch (e) {
        console.log(e);
        throw e;
      }
    }
    async function getOpenOffers() {
      let querySnapshot;
      try {
        querySnapshot = await admin
          .firestore()
          .collection("invoiceOffers")
          .where("isOpen", "==", true)
          .where("endTime", ">", new Date().toISOString())
          .orderBy("endTime")
          .limit(limit)
          .get();
        let tot = 0.0;
        let count = 0;
        console.log(
          `offers found ${querySnapshot.docs.length} after isOpen search`
        );
        querySnapshot.docs.forEach(doc => {
          if (doc.data().isOpen === true) {
            tot += doc.data().offerAmount;
            count++;
          }
          result.totalOfferAmount += doc.data().offerAmount;
          result.openOffers.push(doc.data());
        });
        result.totalOpenOfferAmount = tot;
        result.totalOpenOffers = count;
        result.totalOffers = querySnapshot.docs.length;

        return null;
      } catch (e) {
        console.log(e);
        throw e;
      }
    }
    async function getSettlements() {
      let querySnapshot;
      try {
        querySnapshot = await admin
          .firestore()
          .collection("settlements")
          .where(
            "investor",
            "==",
            constants.Constants.NameSpace + `Investor#${investorId}`
          )
          .orderBy("date", "desc")
          .limit(1000)
          .get();
        
        console.log(`investor settlements found ${querySnapshot.docs.length} `);
        querySnapshot.docs.forEach(doc => {
          result.settlements.push(doc.data());
          result.totalSettlementAmount += doc.data().amount;
          result.totalSettlements++
        });
        return null;
      } catch (e) {
        console.log(e);
        throw e;
      }
    }

  }
);
