"use strict";
// ######################################################################
// Receive notification from Peach
// ######################################################################
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const BFNConstants = require("../models/constants");
const AxiosComms = require("./axios-comms");
const uuid = require("uuid/v1");
exports.peachNotify = functions.https.onRequest(async (request, response) => {
    if (!request.body) {
        console.log("ERROR - request has no body");
        return response.sendStatus(400);
    }
    console.log(request.body);
    try {
        const firestore = admin.firestore();
        const settings = { /* your settings... */ timestampsInSnapshots: true };
        firestore.settings(settings);
        console.log("Firebase settings completed. Should be free of annoying messages from Google");
    }
    catch (e) {
        //console.log(e);
    }
    const fs = admin.firestore();
    const apiSuffix = "MakeInvestorInvoiceSettlement";
    const debug = true; //TODO - to be retrieved from ENV VAR
    const bidDocumentId = request.body.merchant_reference;
    const paymentKey = request.body.payment_key;
    const transactionRef = await fs
        .collection("peachTransactions")
        .doc(paymentKey)
        .set(request.body);
    console.log(`added peach notification to peachTransactions`);
    await writeSettlement();
    return response.status(200).send("OK");
    async function writeSettlement() {
        console.log(`write settlement to BFN and Firestore`);
        try {
            const docSnap = await fs
                .collection("invoiceBids")
                .doc(bidDocumentId)
                .get();
            if (!docSnap.exists) {
                await doBatch();
            }
            else {
                //THIS IS A SINGLE PAYMENT
                const bid = docSnap.data();
                await createSettlement(bid, bidDocumentId);
            }
        }
        catch (e) {
            console.error(e);
            throw e;
        }
        return null;
    }
    async function doBatch() {
        //THIS IS A BATCHED PAYMENT
        //check this documentId against multiKeys
        try {
            const batchRef = fs
                .collection("invoiceBidSettlementBatches")
                .doc(bidDocumentId);
            await fs.runTransaction(function (transaction) {
                return transaction.get(batchRef).then(async function (batchDocument) {
                    if (!batchDocument.exists) {
                        throw new Error(`Payment Batch Document does not exist! ${bidDocumentId}`);
                    }
                    const invoiceBidKeys = batchDocument.data();
                    const keys = invoiceBidKeys.keys;
                    console.log(invoiceBidKeys);
                    for (const key of keys) {
                        console.log(`######## invoiceBid to settle: ${key}`);
                        const mbid = await fs
                            .collection("invoiceBids")
                            .doc(key)
                            .get();
                        //create settlement for this bid
                        if (mbid.exists) {
                            await createSettlement(mbid.data(), key);
                        }
                        else {
                            console.log(`ERROR: Original invoice bid not found. Cannot settle: ${key}`);
                            throw new Error(`InvoiceBid not found for settlement, documentId: ${key}`);
                        }
                    }
                });
            }).then(function () {
                console.log(`Payment Batch Transaction successfully completed. Yebo!`);
                return null;
            });
        }
        catch (e) {
            console.log(e);
            const msg = {
                documentId: bidDocumentId,
                date: new Date().toISOString(),
                requestBody: request.body,
                peachTransactionRef: transactionRef
            };
            await fs.collection("paymentBatchErrors").add(msg);
            throw e;
        }
    }
    async function createSettlement(bid, documentId) {
        const settlement = {
            date: new Date().toISOString(),
            amount: bid.amount,
            peachPaymentKey: request.body.payment_key,
            peachTransactionId: request.body.callpay_transaction_id,
            supplierName: bid.supplierName,
            investorName: bid.investorName,
            customerName: bid.customerName,
            invoiceBid: `resource:com.oneconnect.biz.InvoiceBid#${bid.invoiceBidId}`,
            investor: bid.investor,
            supplier: bid.supplier,
            customer: bid.customer,
            offer: bid.offer,
            wallet: bid.wallet,
            user: bid.user,
            invoiceBidDocRef: null,
            invoiceSettlementId: uuid()
        };
        await writeSettlementToBFN(settlement, documentId);
    }
    async function writeSettlementToBFN(data, documentId) {
        let url;
        if (debug) {
            url = BFNConstants.Constants.DEBUG_URL + apiSuffix;
        }
        else {
            url = BFNConstants.Constants.RELEASE_URL + apiSuffix;
        }
        try {
            data.date = new Date().toISOString();
            const mresponse = await AxiosComms.AxiosComms.execute(url, data);
            if (mresponse.status === 200) {
                console.log(`settlement written to BFN. amount: ${data.amount}`);
                mresponse.data.invoiceBidDocRef = documentId;
                return writeSettlementToFirestore(mresponse.data, documentId);
            }
            else {
                console.log(`** BFN ERROR ## ${mresponse.data}`);
                throw new Error(mresponse.data);
            }
        }
        catch (error) {
            throw error;
        }
    }
    async function writeSettlementToFirestore(mdata, documentId) {
        try {
            mdata.intDate = new Date().getTime();
            const setlmtRef = await fs.collection("settlements").add(mdata);
            mdata.documentReference = setlmtRef.id;
            await setlmtRef.set(mdata);
            console.log(`settlement written to Firestore - ${mdata.amount} ${setlmtRef.path}`);
            //update the bid to isSettled = true
            const qSnap = await fs
                .collection("invoiceBids")
                .doc(documentId)
                .get();
            if (!qSnap.exists) {
                throw new Error("Could not find invoiceBid for update");
            }
            const kdata = qSnap.data();
            const mref = qSnap.ref;
            kdata.isSettled = true;
            kdata.settlementDate = new Date().toISOString();
            kdata.documentReference = qSnap.id;
            await mref.set(kdata);
            console.log(`invoiceBid updated with isSettled set to true`);
            await sendMessageToTopic(mdata);
            console.log("Everything seems OK. InvestorInvoiceSettlements done!");
            //#### FINISHED. return
            return null;
        }
        catch (e) {
            console.log(e);
            throw e;
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
        try {
            if (mdata.supplier) {
                const topic2 = BFNConstants.Constants.TOPIC_INVESTOR_INVOICE_SETTLEMENTS +
                    mdata.supplier.split("#")[1];
                await admin.messaging().sendToTopic(topic2, payload);
            }
            console.log("sending invoice settlement data to topic: " + topic);
            return await admin.messaging().sendToTopic(topic, payload);
        }
        catch (e) {
            console.error(e);
            throw e;
        }
    }
});
//# sourceMappingURL=peach-notification.js.map