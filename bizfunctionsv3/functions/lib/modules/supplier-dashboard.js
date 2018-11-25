"use strict";
// ######################################################################
// Aggregate Supplier Data
// ######################################################################
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
exports.supplierDashboard = functions.https.onRequest(async (request, response) => {
    if (!request.body) {
        console.log("ERROR - request has no body");
        return response.status(400).send("request has no body");
    }
    if (!request.body.id) {
        console.log("ERROR - request has no id");
        return response.status(400).send("request has no id");
    }
    const firestore = admin.firestore();
    try {
        const settings = { /* your settings... */ timestampsInSnapshots: true };
        firestore.settings(settings);
        console.log("Firebase settings completed. Should be free of annoying messages from Google");
    }
    catch (e) {
        console.log(e);
    }
    console.log(`##### Incoming supplierId ${request.body.id}`);
    console.log(`##### Incoming documentId ${request.body.documentId}`);
    const documentId = request.body.documentId;
    const result = {
        totalOpenOffers: 0,
        totalOpenOfferAmount: 0.0,
        totalUnsettledBids: 0,
        totalUnsettledAmount: 0.0,
        totalPurchaseOrderAmount: 0.0,
        totalInvoiceAmount: 0.0,
        totalSettledBids: 0,
        totalSettledAmount: 0.0,
        totalBids: 0,
        totalBidAmount: 0.0,
        date: new Date().toISOString(),
        averageBidAmount: 0.0,
        averageDiscountPerc: 0.0,
        totalOfferAmount: 0.0,
        totalDeliveryNoteAmount: 0.0,
        totalOffers: 0,
        purchaseOrders: 0,
        invoices: 0,
        deliveryNotes: 0,
        cancelledOffers: 0,
        closedOffers: 0
    };
    await doParallel();
    console.log(result);
    return response.status(200).send(result);
    /*
    async getBooksAndAuthor(authorId) {
  const bookPromise = bookModel.fetchAll();
  const authorPromise = authorModel.fetch(authorId);
  const book = await bookPromise;
  const author = await authorPromise;
  return {
    author,
    books: books.filter(book => book.authorId === authorId),
  };
}
    */
    async function doParallel() {
        console.log("doParallel starting. check result afterwards");
        try {
            const deliveryPromise = firestore
                .collection("suppliers")
                .doc(documentId)
                .collection("deliveryNotes")
                .get();
            const poPromise = firestore
                .collection("suppliers")
                .doc(documentId)
                .collection("purchaseOrders")
                .get();
            const invoicePromise = firestore
                .collection("suppliers")
                .doc(documentId)
                .collection("invoices")
                .get();
            const offerPromise = firestore
                .collection("invoiceOffers")
                .where("supplierDocumentRef", "==", documentId)
                .get();
            //the following should run concurrently
            const dnQuerySnapshot = await deliveryPromise;
            const poQuerySnapshot = await poPromise;
            const invoiceQuerySnapshot = await invoicePromise;
            const offerQuerySnapshot = await offerPromise;
            offerQuerySnapshot.forEach(dn => {
                result.totalOfferAmount += dn.data().amount;
                if (dn.data().isOpen) {
                    result.totalOpenOffers++;
                    result.totalOpenOfferAmount += dn.data().offerAmount;
                }
            });
            result.totalOffers = offerQuerySnapshot.docs.length;
            dnQuerySnapshot.forEach(dn => {
                result.totalDeliveryNoteAmount += dn.data().amount;
            });
            result.deliveryNotes = dnQuerySnapshot.docs.length;
            poQuerySnapshot.forEach(po => {
                result.totalPurchaseOrderAmount += po.data().amount;
            });
            result.purchaseOrders = poQuerySnapshot.docs.length;
            invoiceQuerySnapshot.forEach(dn => {
                result.totalInvoiceAmount += dn.data().amount;
            });
            result.invoices = invoiceQuerySnapshot.docs.length;
            console.log("doParallel complete. check result");
        }
        catch (e) {
            console.log(e);
            handleError("doParallell failed");
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
        }
        catch (e) {
            console.log("possible error propagation/cascade here. ignored");
            response.status(400).send("SupplierDashboard Query Failed");
        }
    }
});
//# sourceMappingURL=supplier-dashboard.js.map