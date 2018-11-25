"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const BFNConstants = require("../models/constants");
const AxiosComms = require("./axios-comms");
const close_helper_1 = require("./close-helper");
const uuid = require("uuid/v1");
class InvoiceBidHelper {
    static async writeInvoiceBidToBFNandFirestore(data, debug) {
        let url;
        const apiSuffix = "MakeInvoiceBid";
        if (debug) {
            url = BFNConstants.Constants.DEBUG_URL + apiSuffix;
        }
        else {
            url = BFNConstants.Constants.RELEASE_URL + apiSuffix;
        }
        const storeInvestorRef = data.investorDocRef;
        const storeOfferRef = data.offerDocRef;
        data.investorDocRef = null;
        data.offerDocRef = null;
        data.initDate = null;
        if (!data.invoiceBidId) {
            data["invoiceBidId"] = uuid();
        }
        try {
            data.date = new Date().toISOString();
            const mresponse = await AxiosComms.AxiosComms.execute(url, data);
            if (mresponse.status === 200) {
                mresponse.data.investorDocRef = storeInvestorRef;
                mresponse.data.offerDocRef = storeOfferRef;
                mresponse.data.initDate = new Date().getTime();
                return writeToFirestore(mresponse.data);
            }
            else {
                console.log(`** BFN ERROR ## ${mresponse.data}`);
                throw new Error(mresponse);
            }
        }
        catch (error) {
            throw error;
        }
        async function writeToFirestore(mdata) {
            try {
                mdata.intDate = new Date().getTime();
                mdata.date = new Date().toISOString();
                console.log(mdata);
                const offerId = mdata.offer.split("#")[1];
                const ref = await admin
                    .firestore()
                    .collection("invoiceBids")
                    .add(mdata);
                console.log(`Invoice bid written to Firestore`);
                mdata.documentReference = ref.path.split('/')[1];
                await ref.set(mdata);
                console.log(`Invoice bid updated with docRef`);
                await checkTotalBids(mdata.offerDocRef, offerId);
                await sendMessageToTopic(mdata);
                console.log("Everything seems OK. InvoiceBid done!");
                return null;
            }
            catch (e) {
                console.log(e);
                throw e;
            }
        }
        async function sendMessageToTopic(mdata) {
            const topic = BFNConstants.Constants.TOPIC_INVOICE_BIDS +
                mdata.supplier.split("#")[1];
            const topic1 = BFNConstants.Constants.TOPIC_INVOICE_BIDS +
                mdata.investor.split("#")[1];
            const topic2 = BFNConstants.Constants.TOPIC_INVOICE_BIDS;
            const payload = {
                data: {
                    messageType: "INVOICE_BID",
                    json: JSON.stringify(mdata)
                },
                notification: {
                    title: "Invoice Bid",
                    body: "Invoice Bid from " +
                        mdata.investorName +
                        " amount: " +
                        mdata.amount
                }
            };
            console.log("sending invoice bid data to topics: " +
                topic +
                " " +
                topic1 +
                " " +
                topic2);
            await admin.messaging().sendToTopic(topic, payload);
            await admin.messaging().sendToTopic(topic1, payload);
            return await admin.messaging().sendToTopic(topic2, payload);
        }
        async function checkTotalBids(offerDocID, offerId) {
            console.log(`############ checkTotalBids ......... offerDocID: ${offerDocID}`);
            let total = 0.0;
            try {
                const msnapshot = await admin
                    .firestore()
                    .collection("invoiceOffers")
                    .doc(offerDocID)
                    .collection("invoiceBids")
                    .get();
                msnapshot.forEach(doc => {
                    const reservePercent = doc.data()["reservePercent"];
                    const mReserve = parseFloat(reservePercent);
                    total += mReserve;
                });
                if (total >= 100.0) {
                    console.log(`######## closing offer, reservePercent == ${total} %`);
                    await close_helper_1.CloseHelper.writeCloseOfferToBFN(offerId, offerDocID, debug);
                }
                else {
                    console.log(`# NOT closing offer, reservePercent == ${total} %`);
                    return null;
                }
            }
            catch (e) {
                console.log("-- Firestore: Check Totals PROBLEM -----");
                console.log(e);
                throw e;
            }
            return null;
        }
    }
}
exports.InvoiceBidHelper = InvoiceBidHelper;
//# sourceMappingURL=invoice-bid-helper.js.map