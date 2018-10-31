// ######################################################################
// Aggregate Supplier Data
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const supplierDashboard = functions.https.onRequest(
  async (request, response) => {
    if (!request.body) {
      console.log("ERROR - request has no body");
      return response.status(400).send("request has no body");
    }
    if (!request.body.id) {
      console.log("ERROR - request has no id");
      return response.status(400).send("request has no id");
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

    console.log(`##### Incoming supplierId ${request.body.id}`);
    console.log(`##### Incoming documentId ${request.body.documentId}`);

    const supplierId = request.body.id;
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
      averageBidAmount: 0.00,
      averageDiscountPerc: 0.0,
      totalOfferAmount: 0.00,
      totalOffers: 0,
      purchaseOrders: 0,
      invoices: 0,
      deliveryNotes: 0,
      cancelledOffers: 0,
      closedOffers: 0
    };

    await startDataQuery();
    
    console.log(result);
    return response.status(200).send(result);

    async function startDataQuery() {
      try {
        await admin
          .firestore()
          .collection("suppliers")
          .doc(documentId)
          .collection("deliveryNotes")
          .get()
          .then(async qRef => {
            result.deliveryNotes = qRef.docs.length;
            await getPurchaseOrders();
          });
      } catch (e) {
        console.log(e);
        handleError("Failed to query delivery notes");
      }
    }
    async function getPurchaseOrders() {
      try {
        await admin
          .firestore()
          .collection("suppliers")
          .doc(documentId)
          .collection("purchaseOrders")
          .get()
          .then(async qRef => {
            result.purchaseOrders = qRef.docs.length;
            await getInvoices();
          });
      } catch (e) {
        console.log(e);
        handleError("Failed to query purchase orders");
      }
      return null;
    }
    async function getInvoices() {
      try {
        await admin
          .firestore()
          .collection("suppliers")
          .doc(documentId)
          .collection("invoices")
          .get()
          .then(async qRef => {
            result.invoices = qRef.docs.length;
            await getOffers()
          });
      } catch (e) {
        console.log(e);
        handleError("Failed to query invoices");
      }
      return null;
    }
    async function getOffers() {
      try {
        await admin
          .firestore()
          .collection("invoiceOffers")
          .where(
            "supplier",
            "==",
            `resource:com.oneconnect.biz.Supplier#${supplierId}`
          )
          .get()
          .then(querySnapshot => {
            querySnapshot.docs.forEach(async doc => {
              const offer = doc.data();
              result.totalOfferAmount += offer.offerAmount;
              result.totalOffers++;
              if (offer.isOpen === true) {
                result.totalOpenOfferAmount += offer.offerAmount;
                result.totalOpenOffers++;
              } else {
                result.closedOffers++;
              }
              if (offer.isCancelled === true) {
                result.cancelledOffers++;
              }
              let tot = 0.0;
              await doc.ref
                .collection("invoiceBids")
                .get()
                .then(qs => {
                  qs.docs.forEach(m => {
                    const bid = m.data();
                    result.totalBidAmount += bid.amount;
                    result.totalBids++;
                    tot += bid.amount;
                  });
                  result.averageBidAmount = tot / qs.docs.length;
                  return null
                });
            });
          })
          .catch(function(error) {
            console.log(error);
            handleError(error);
          });

        return null;
      } catch (e) {
        console.log(e);
        handleError("Failed to query offers");
      }
      return null;
    }
    function handleError(message) {
      console.log("--- ERROR !!! --- sending error payload: msg:" + message);
      try {
        const payload = {
          name: "SupplierDashboard",
          message: message,
          date: new Date().toISOString()
        };
        console.log(payload);
        response.status(400).send(payload);
      } catch (e) {
        console.log("possible error propagation/cascade here. ignored");
        response.status(400).send("SupplierDashboard Query Failed");
      }
    }
  }
);
