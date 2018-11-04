// ######################################################################
// List Delivery Notes with Paging
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as Data from "../models/data";

// const Firestore = require("firestore");

export const getDeliveryNotesWithPaging = functions.https.onRequest(
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

    const deliveryNotes: Data.DeliveryNote[] = [];
    const result = {
      deliveryNotes: deliveryNotes,
      totalDeliveryNotes: 0,
      totalAmount: 0.0,
      startedAfter: date
    };

    await getDeliveryNotes()
    
    return response.status(200).send(result);

    async function getDeliveryNotes() {
      let queryRef;
      if (date) {
        console.log("++++ we have a date for query " + date);
        queryRef = await admin
          .firestore()
          .collection(collection)
          .doc(documentId)
          .collection('deliveryNotes')      
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
          .collection('deliveryNotes')
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
          const dn: Data.DeliveryNote = new Data.DeliveryNote();
          const data = doc.data();
          dn.purchaseOrder = data.purchaseOrder;
          dn.purchaseOrderNumber = data.purchaseOrderNumber;
          dn.supplier = data.supplier;
          dn.date = data.date;
          dn.govtEntity = data.govtEntity;
          dn.amount = data.amount;
          dn.intDate = data.intDate;
          dn.totalAmount = data.totalAmount;
          dn.customerName = data.customerName;
          dn.supplierName = data.supplierName;
          dn.intDate = data.intDate;
          dn.vat = data.vat
          dn.deliveryNoteId = data.deliveryNoteId
          dn.customerName = data.customerName
          dn.user = data.user
          result.totalAmount += dn.amount;
          result.totalDeliveryNotes++
          deliveryNotes.push(dn);
        });
        result.deliveryNotes = deliveryNotes
        console.log(`## page returned has ${deliveryNotes.length} delivery notes`);
        return null;
      } catch (e) {
        console.log(e);
        handleError("getInvoicesWithPaging Query failed: " + e);
      }
    }
    
    function handleError(message) {
      console.log("--- ERROR !!! --- sending error payload: msg:" + message);
      try {
        const payload = {
          name: "getInvoicesWithPaging",
          message: message,
          date: new Date().toISOString()
        };
        console.log(payload);
        response.status(400).send(payload);
      } catch (e) {
        console.log("possible error propagation/cascade here. ignored");
        response.status(400).send("getInvoicesWithPaging Query Failed");
      }
    }
  }
);
