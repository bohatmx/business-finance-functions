"use strict";
// ######################################################################
// Aggregate Open Offers
// ######################################################################
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
exports.getOpenOffersSummary = functions.https.onRequest(async (request, response) => {
    try {
        const firestore = admin.firestore();
        const settings = { /* your settings... */ timestampsInSnapshots: true };
        firestore.settings(settings);
        console.log("Firebase settings completed. Should be free of annoying messages from Google");
    }
    catch (e) {
        console.log(e);
    }
    const result = {
        totalOpenOffers: 0,
        totalOfferAmount: 0.0
    };
    await getOpenOffers();
    console.log(result);
    return response.status(200).send(result);
    async function getOpenOffers() {
        try {
            let queryRef;
            queryRef = await admin
                .firestore()
                .collection("invoiceOffers")
                .where("isOpen", "==", true)
                .get()
                .catch(function (error) {
                console.log(error);
                handleError(error);
            });
            let tot = 0.0;
            queryRef.docs.forEach(doc => {
                tot += doc.data().offerAmount;
            });
            result.totalOfferAmount = tot;
            result.totalOpenOffers = queryRef.docs.length;
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
            response.status(400).send("Open Offers Query Failed");
        }
    }
});
//# sourceMappingURL=open-offers-summary.js.map