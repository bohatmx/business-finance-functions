"use strict";
// ######################################################################
// Add Investor Invoice Settlement to BFN and Firestore
// ######################################################################
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const BFNConstants = require("../models/constants");
const AxiosComms = require("./axios-comms");
const uuid = require("uuid/v1");
exports.makeInvestorInvoiceSettlement = functions.https.onRequest(async (request, response) => {
    try {
        const firestore = admin.firestore();
        const settings = { /* your settings... */ timestampsInSnapshots: true };
        firestore.settings(settings);
        console.log("Firebase settings completed. Should be free of annoying messages from Google");
    }
    catch (e) {
        console.log(e);
    }
    console.log(`##### Incoming debug ${request.body.debug}`);
    console.log(`##### Incoming data ${JSON.stringify(request.body.data)}`);
    const debug = request.body.debug;
    const data = request.body.data;
    const apiSuffix = "MakeInvestorInvoiceSettlement";
    const fs = admin.firestore();
    if (validate() === true) {
        await writeSettlementToBFN();
    }
    return null;
    function validate() {
        if (!request.body) {
            console.log("ERROR - request has no body");
            return response.status(400).send("request has no body");
        }
        if (!request.body.data) {
            console.log("ERROR - request has no data");
            return response.status(400).send(" request has no data");
        }
        return true;
    }
    async function writeSettlementToBFN() {
        let url;
        if (debug) {
            url = BFNConstants.Constants.DEBUG_URL + apiSuffix;
        }
        else {
            url = BFNConstants.Constants.RELEASE_URL + apiSuffix;
        }
        if (!data.invoiceSettlementId) {
            data["invoiceSettlementId"] = uuid();
        }
        try {
            data.date = new Date().toISOString();
            const mresponse = await AxiosComms.AxiosComms.execute(url, data);
            if (mresponse.status === 200) {
                return writeSettlementToFirestore(mresponse.data);
            }
            else {
                console.log(`** BFN ERROR ## ${mresponse.data}`);
                handleError(mresponse);
            }
        }
        catch (error) {
            handleError(error);
        }
    }
    async function writeSettlementToFirestore(mdata) {
        try {
            mdata.intDate = new Date().getTime();
            mdata.date = new Date().toISOString();
            const setlmtRef = await fs.collection('settlements').add(mdata);
            mdata.documentReference = setlmtRef.id;
            await setlmtRef.set(mdata);
            //update the bid to isSettled = true
            const qSnap = await fs.collection('invoiceBids')
                .where('invoiceBidId', '==', mdata.invoiceBid.split('#')[1])
                .get();
            if (qSnap.docs.length === 0) {
                throw new Error('Could not find invoiceBid for update');
            }
            const kdata = qSnap.docs[0].data();
            const mref = qSnap.docs[0].ref;
            kdata.isSettled = true;
            kdata.settlementDate = new Date().toISOString();
            kdata.settlementDocRef = setlmtRef.id;
            await mref.set(kdata);
            await sendMessageToTopic(kdata);
            console.log("Everything seems OK. InvestorInvoiceSettlements done!");
            response.status(200).send(kdata);
        }
        catch (e) {
            console.log(e);
            handleError("Houston, we got one of dem!");
        }
    }
    async function sendMessageToTopic(mdata) {
        const topic = BFNConstants.Constants.TOPIC_INVESTOR_INVOICE_SETTLEMENTS;
        const payload = {
            data: {
                messageType: "INVESTOR_INVOICE_SETTLEMENT",
                json: JSON.stringify(mdata)
            },
            notification: {
                title: "Investor Invoice Settlement",
                body: "Investor Invoice Settlement " + " amount: " + mdata.amount
            }
        };
        if (mdata.supplier) {
            const topic2 = BFNConstants.Constants.TOPIC_INVESTOR_INVOICE_SETTLEMENTS +
                mdata.supplier.split("#")[1];
            await admin.messaging().sendToTopic(topic2, payload);
        }
        console.log("sending invoice settlement data to topic: " + topic);
        return await admin.messaging().sendToTopic(topic, payload);
    }
    function handleError(message) {
        console.log("--- ERROR !!! --- sending error payload: msg:" + message);
        try {
            const payload = {
                name: apiSuffix,
                message: message,
                data: request.body.data,
                date: new Date().toISOString()
            };
            console.log(payload);
            response.status(400).send(payload);
        }
        catch (e) {
            console.log("possible error propagation/cascade here. ignored");
        }
    }
});
//# sourceMappingURL=make_investor_invoice_settlement.js.map