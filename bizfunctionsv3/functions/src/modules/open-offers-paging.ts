// ######################################################################
// Open Offers with Paging
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as Data from "../models/data";

// const Firestore = require("firestore");

export const getOpenOffersWithPaging = functions.https.onRequest(
  async (request, response) => {
    if (!request.body) {
      console.log("ERROR - request has no body");
      return response.status(400).send("request has no body");
    }
    console.log(request.body);
    let date;
    if (request.body.date) {
      date = request.body.date;
    }
    let pageLimit = 20;
    if (request.body.pageLimit) {
      pageLimit = request.body.pageLimit;
    }

    // const firestore = new Firestore();
    // const settings = { /* your settings... */ timestampsInSnapshots: true };
    // firestore.settings(settings);

    console.log(`##### Incoming date ${date}`);
    console.log(`##### Incoming pageLimit ${pageLimit}`);

    const offers: Data.Offer[] = [];
    const result = {
      offers: offers,
      totalOpenOffers: 0,
      totalOfferAmount: 0.0,
      startedAfter: date
    };

    await getAllOpenOffers()
    await getOpenOffers();
    
    return response.status(200).send(result);

    async function getOpenOffers() {
      let queryRef;
      if (date) {
        console.log("++++ we have a date for query " + date);
        queryRef = await admin
          .firestore()
          .collection("invoiceOffers")
          .where("isOpen", "==", true)         
          .orderBy("intDate", "asc")
          .startAfter(date)
          .limit(pageLimit)
          .get()
          .catch(function(error) {
            console.log(error);
            handleError(error);
          });
      } else {
        console.log("------ we have a null date for query ");
        queryRef = await admin
          .firestore()
          .collection("invoiceOffers")
          .where("isOpen", "==", true)
          .orderBy("intDate", "asc")
          .limit(pageLimit)
          .get()
          .catch(function(error) {
            console.log(error);
            handleError(error);
          });
      }
      try {
        queryRef.docs.forEach(doc => {
          const offer: Data.Offer = new Data.Offer();
          const data = doc.data();
          offer.offerId = data.offerId;
          offer.customerName = data.customerName;
          offer.date = data.date;
          offer.discountPercent = data.discountPercent;
          offer.startTime = data.startTime;
          offer.endTime = data.endTime;
          offer.invoice = data.invoice;
          offer.invoiceAmount = data.invoiceAmount;
          offer.invoiceDocumentRef = data.invoiceDocumentRef;
          offer.documentReference = doc.ref.path.split('/')[1];
          offer.isCancelled = data.isCancelled;
          offer.isOpen = data.isOpen;
          offer.offerAmount = data.offerAmount;
          offer.purchaseOrder = data.purchaseOrder;
          offer.sector = data.sector;
          offer.sectorName = data.sectorName;
          offer.supplierFCMToken = data.supplierFCMToken;
          offer.supplier = data.supplier;
          offer.supplierName = data.supplierName;
          offer.supplierDocumentRef = data.supplierDocumentRef;
          offer.user = data.user;
          offer.wallet = data.wallet;
          offer.contractURL = data.contractURL;
          offer.invoiceDocumentRef = data.invoiceDocumentRef;
          offer.intDate = data.intDate
          offers.push(offer);
        });

        console.log(`## Open offers page returned has ${offers.length} offers`);
        return null;
      } catch (e) {
        console.log(e);
        handleError("Query failed: " + e);
      }
    }
    async function getAllOpenOffers() {
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

      try {
        queryRef.docs.forEach(doc => {
          result.totalOpenOffers++
          result.totalOfferAmount += doc.data().offerAmount
        });

        console.log(`## All Open offers ${queryRef.docs.length} offers`);
        return null;
      } catch (e) {
        console.log(e);
        handleError("Query failed: " + e);
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
        response.status(400).send("OpenOffers Query Failed");
      }
    }
  }
);
