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
        return response.status(400).send('request has no body');
    }
    if (!request.body.id) {
        console.log("ERROR - request has no id");
        return response.status(400).send('request has no id');
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
    console.log(`##### Incoming supplierId ${request.body.id}`);
    const supplierId = request.body.id;
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
        supplierId: supplierId,
        averageBidAmount: 0.0,
        averageDiscountPerc: 0.0,
        totalOfferAmount: 0.00,
        totalOffers: 0,
    };
    await getOpenOffers();
    await getBids();
    console.log(result);
    return response.status(200).send(result);
    async function getBids() {
        try {
            let queryRef;
            queryRef = await admin
                .firestore()
                .collection("invoiceOffers")
                .where("supplier", "==", `resource:com.oneconnect.biz.Supplier#${supplierId}`)
                .get()
                .catch(function (error) {
                console.log(error);
                handleError(error);
            });
            let totPerc = 0.0;
            queryRef.docs.forEach(doc => {
                const offerRef = doc.ref;
                let qRef;
                qRef = offerRef.collection("invoiceBids");
                qRef.forEach(bid => {
                    result.totalBidAmount += bid.data().amount;
                    result.totalBids++;
                    totPerc += bid.data().discountPercent;
                    if (bid.isSettled === true) {
                        result.totalSettledAmount += bid.data().amount;
                        result.totalSettledBids++;
                    }
                    else {
                        result.totalUnsettledAmount += bid.data().amount;
                        result.totalUnsettledBids++;
                    }
                });
            });
            result.averageBidAmount = result.totalBidAmount / result.totalBids;
            result.averageDiscountPerc = totPerc / result.totalBids;
            return null;
        }
        catch (e) {
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
                .where("supplier", "==", `resource:com.oneconnect.biz.Supplier#${supplierId}`)
                .get()
                .catch(function (error) {
                console.log(error);
                handleError(error);
            });
            queryRef.docs.forEach(async (doc) => {
                const offer = doc.data();
                result.totalOfferAmount += offer.offerAmount;
                result.totalOffers++;
                if (offer.isOpen === true) {
                    result.totalOpenOfferAmount += offer.totalOfferAmount;
                    result.totalOpenOffers++;
                }
            });
            return null;
        }
        catch (e) {
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
        }
        catch (e) {
            console.log("possible error propagation/cascade here. ignored");
            response.status(400).send("Dashboard Query Failed");
        }
    }
});
//# sourceMappingURL=supplier-dashboard.js.map