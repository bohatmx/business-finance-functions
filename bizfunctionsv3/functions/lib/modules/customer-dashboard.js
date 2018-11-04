"use strict";
// ######################################################################
// Aggregate Customer Data
// ######################################################################
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
exports.customerDashboard = functions.https.onRequest(async (request, response) => {
    if (!request.body) {
        console.log("ERROR - request has no body");
        return response.status(400).send("request has no body");
    }
    if (!request.body.documentId) {
        console.log("ERROR - request has no documentId");
        return response.status(400).send("request has no id");
    }
    try {
        const firestore = admin.firestore();
        const settings = { /* your settings... */ timestampsInSnapshots: true };
        firestore.settings(settings);
        console.log("Firebase settings completed. Should be free of annoying messages from Google");
    }
    catch (e) {
        console.log(e);
    }
    console.log(`##### Incoming documentId ${request.body.documentId}`);
    const documentId = request.body.documentId;
    const GOVT = 'govtEntities';
    const result = {
        totalOpenOffers: 0,
        totalOpenOfferAmount: 0.00,
        totalUnsettledBids: 0,
        totalUnsettledAmount: 0.00,
        totalPurchaseOrderAmount: 0.00,
        totalInvoiceAmount: 0.00,
        totalSettledBids: 0,
        totalSettledAmount: 0.00,
        totalBids: 0,
        totalBidAmount: 0.00,
        date: new Date().toISOString(),
        averageBidAmount: 0.00,
        averageDiscountPerc: 0.0,
        totalOfferAmount: 0.00,
        totalDeliveryNoteAmount: 0.00,
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
                .collection(GOVT)
                .doc(documentId)
                .collection("deliveryNotes")
                .get()
                .then(async (qSnap) => {
                result.deliveryNotes = qSnap.docs.length;
                qSnap.forEach(doc => {
                    result.totalDeliveryNoteAmount += doc.data().amount;
                });
                await getPurchaseOrders();
            });
        }
        catch (e) {
            console.log(e);
            handleError("Failed to query delivery notes");
        }
    }
    async function getPurchaseOrders() {
        try {
            await admin
                .firestore()
                .collection(GOVT)
                .doc(documentId)
                .collection("purchaseOrders")
                .get()
                .then(async (qSnap) => {
                result.purchaseOrders = qSnap.docs.length;
                qSnap.docs.forEach(doc => {
                    result.totalPurchaseOrderAmount += doc.data().amount;
                });
                await getInvoices();
            });
        }
        catch (e) {
            console.log(e);
            handleError("Failed to query purchase orders");
        }
        return null;
    }
    async function getInvoices() {
        try {
            await admin
                .firestore()
                .collection(GOVT)
                .doc(documentId)
                .collection("invoices")
                .get()
                .then(async (qSnap) => {
                result.invoices = qSnap.docs.length;
                qSnap.docs.forEach(doc => {
                    result.totalInvoiceAmount += doc.data().amount;
                });
                return null;
            });
        }
        catch (e) {
            console.log(e);
            handleError("Failed to query invoices");
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
//# sourceMappingURL=customer-dashboard.js.map