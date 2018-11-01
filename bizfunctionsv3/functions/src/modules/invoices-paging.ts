// ######################################################################
// List Purchase Orders with Paging
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as Data from "../models/data";

// const Firestore = require("firestore");

export const getInvoicesWithPaging = functions.https.onRequest(
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
    let collection = 'suppliers'
    if (request.body.collection) {
      collection = request.body.collection
    }
    const documentId = request.body.documentId

  
    try {
      const firestore = admin.firestore();
      const settings = { /* your settings... */ timestampsInSnapshots: true };
      firestore.settings(settings);
      console.log(
        "Firebase settings completed. Should be free of annoying messages"
      );
    } catch (e) {
      console.log(e);
    }


    console.log(`##### Incoming date ${date}`);
    console.log(`##### Incoming pageLimit ${pageLimit}`);
    console.log(`##### Incoming documentId ${documentId}`);
    console.log(`##### Incoming collection ${collection}`);

    const invoices: Data.Invoice[] = [];
    const result = {
      purchaseOrders: invoices,
      totalPurchaseOrders: 0,
      totalAmount: 0.0,
      startedAfter: date
    };

    await getInvoices()
    
    return response.status(200).send(result);

    async function getInvoices() {
      let queryRef;
      if (date) {
        console.log("++++ we have a date for query " + date);
        queryRef = await admin
          .firestore()
          .collection(collection)
          .doc(documentId)
          .collection('invoices')      
          .orderBy("intDate", "desc")
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
          .collection(collection)
          .doc(documentId)
          .collection('invoices')
          .orderBy("intDate", "desc")
          .limit(pageLimit)
          .get()
          .catch(function(error) {
            console.log(error);
            handleError(error);
          });
      }
      try {
        queryRef.docs.forEach(doc => {
          const invoice: Data.Invoice = new Data.Invoice();
          const data = doc.data();
          invoice.purchaseOrder = data.purchaseOrder;
          invoice.purchaseOrderNumber = data.purchaseOrderNumber;
          invoice.supplier = data.supplier;
          invoice.date = data.date;
          invoice.govtEntity = data.govtEntity;
          invoice.amount = data.amount;
          invoice.isOnOffer = data.isOnOffer;
          invoice.isSettled = data.isSettled;
          invoice.totalAmount = data.totalAmount;
          invoice.valueAddedTax = data.valueAddedTax;
          invoice.customerName = data.customerName;
          invoice.supplierName = data.supplierName;
          invoice.deliveryNote = data.deliveryNote;
          invoice.intDate = data.intDate;

          result.totalAmount += invoice.amount
          result.totalPurchaseOrders++
          invoices.push(invoice);
        });
        result.purchaseOrders = invoices
        console.log(`## page returned has ${invoices.length} purchase orders`);
        return null;
      } catch (e) {
        console.log(e);
        handleError("getOpenOffersWithPaging Query failed: " + e);
      }
    }
    
    function handleError(message) {
      console.log("--- ERROR !!! --- sending error payload: msg:" + message);
      try {
        const payload = {
          name: "getOpenOffersWithPaging",
          message: message,
          date: new Date().toISOString()
        };
        console.log(payload);
        response.status(400).send(payload);
      } catch (e) {
        console.log("possible error propagation/cascade here. ignored");
        response.status(400).send("getOpenOffersWithPaging Query Failed");
      }
    }
  }
);
