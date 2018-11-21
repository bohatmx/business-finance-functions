"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ######################################################################
// Triggered by record added to firestore. export data
// ######################################################################
const functions = require("firebase-functions");
const admin = require("firebase-admin");
//curl --header "Content-Type: application/json"   --request POST   --data '{"debug": "true","path":"investors"}'   https://us-central1-business-finance-dev.cloudfunctions.net/exportData
exports.queryOffers = functions
    .runWith({ memory: "256MB", timeoutSeconds: 540 })
    .https.onRequest(async (request, response) => {
    try {
        const firestore = admin.firestore();
        const settings = { /* your settings... */ timestampsInSnapshots: true };
        firestore.settings(settings);
        console.log("Firebase settings completed. Should be free of annoying messages from Google");
    }
    catch (e) {
        console.log("just Google letting us know about shit in Firestore");
    }
    let limit = request.body.limit;
    if (!limit) {
        limit = 200;
    }
    let open = request.body.open;
    if (!open) {
        open = true;
    }
    const result = {
        log: [],
        data: []
    };
    try {
        if (open === true) {
            await getOpenOffers();
        }
        else {
            await getClosedOffers();
        }
    }
    catch (e) {
        console.log(e);
        response.status(400).send("Exception during offers query: " + e);
    }
    return null;
    async function getOpenOffers() {
        const start = new Date().getTime();
        result.log.push(`started query at: ${new Date().toISOString()}`);
        let querySnapshot;
        querySnapshot = await admin
            .firestore()
            .collection("invoiceOffers")
            .where("isOpen", "==", true)
            .where("endTime", ">", new Date().toISOString())
            .limit(limit)
            .get();
        querySnapshot.docs.forEach(doc => {
            const offer = doc.data();
            offer.documentReference = doc.ref.path.split('/')[1];
            result.data.push(offer);
        });
        const end = new Date().getTime();
        const msg = `offers query, limit = ${limit}, where isOpen = true, where endTime > ${new Date().toISOString()}, found ${querySnapshot.docs.length} elapsed ${end - start} milliseconds`;
        result.log.push(msg);
        console.log(msg);
        response.status(200).send(result);
        return null;
    }
    async function getClosedOffers() {
        const start = new Date().getTime();
        let qs4;
        qs4 = await admin
            .firestore()
            .collection("invoiceOffers")
            .where("isOpen", "==", false)
            .orderBy("endTime", 'desc')
            .limit(limit)
            .get();
        qs4.docs.forEach(doc => {
            result.data.push(doc.data());
        });
        const end4 = new Date().getTime();
        const msg4 = `offers query, limit = ${limit}, where isOpen = false, orderBy endTime desc, found ${qs4.docs.length} elapsed ${end4 - start} milliseconds`;
        result.log.push(msg4);
        console.log(msg4);
        response.status(200).send(result);
        return null;
    }
});
//# sourceMappingURL=offers-query.js.map