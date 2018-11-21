"use strict";
// ######################################################################
// Aggregate Investor Data
// ######################################################################
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// const Firestore = require("firestore");
exports.investorDashboard = functions.https.onRequest(async (request, response) => {
    if (!request.body) {
        console.log("ERROR - request has no body");
        return response.status(400).send("request has no body");
    }
    if (!request.body.id) {
        console.log("ERROR - request has no id");
        return response.status(400).send("request has no id");
    }
    if (!request.body.documentId) {
        console.log("ERROR - request has no documentId");
        return response.status(400).send("request has no documentId");
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
    console.log(`##### Incoming investorId ${request.body.id}`);
    console.log(`##### Incoming documentId ${JSON.stringify(request.body.documentId)}`);
    const investorId = request.body.id;
    const documentId = request.body.documentId;
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
        totalOffers: 0
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
                .collection("investors")
                .doc(documentId)
                .collection("invoiceBids")
                .get()
                .catch(function (error) {
                console.log(error);
                handleError(error);
            });
            let totPerc = 0.0;
            let countDiscounts = 0;
            queryRef.docs.forEach(doc => {
                result.totalBidAmount += doc.data().amount;
                result.totalBids++;
                if (doc.data().discountPercent) {
                    totPerc += doc.data().discountPercent;
                    countDiscounts++;
                }
                if (doc.data().isSettled === false) {
                    result.totalUnsettledAmount += doc.data().amount;
                    result.totalUnsettledBids++;
                }
                else {
                    result.totalSettledAmount += doc.data().amount;
                    result.totalSettledBids++;
                }
            });
            if (result.totalBids > 0) {
                result.averageBidAmount = result.totalBidAmount / result.totalBids;
            }
            if (countDiscounts > 0) {
                result.averageDiscountPerc = totPerc / countDiscounts;
            }
            console.log(`######### totalPerc: ${totPerc} countDiscounts: ${countDiscounts} result.averageDiscountPerc: ${result.averageDiscountPerc}`);
            return null;
        }
        catch (e) {
            console.log(e);
            handleError(e);
        }
    }
    async function getOpenOffers() {
        let queryRef;
        try {
            queryRef = await admin
                .firestore()
                .collection("invoiceOffers")
                .where("isOpen", "==", true)
                .where('endTime', '>', new Date().toISOString())
                .orderBy('endTime')
                .limit(limit)
                .get()
                .catch(function (error) {
                console.log(error);
                handleError(error);
            });
            let tot = 0.0;
            let count = 0;
            console.log(`offers found ${queryRef.docs.length} after isOpen search`);
            queryRef.docs.forEach(doc => {
                if (doc.data().isOpen === true) {
                    tot += doc.data().offerAmount;
                    count++;
                }
                result.totalOfferAmount += doc.data().offerAmount;
            });
            result.totalOpenOfferAmount = tot;
            result.totalOpenOffers = count;
            result.totalOffers = queryRef.docs.length;
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
//# sourceMappingURL=investor-dashboard.js.map