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
        const fs = admin.firestore();
        console.log(`InvoiceBidHelper: data before being processed: ${JSON.stringify(data)}`);
        const storeInvestorRef = data.investorDocRef;
        const storeOfferRef = data.offerDocRef;
        const storeSupplierRef = data.supplierDocRef;
        const offerId = data.offer.split("#")[1];
        const offerDocRef = data.offerDocRef;
        let totalReserved = 0.0;
        console.log(`InvoiceBidHelper: storeOfferRef: ${storeOfferRef} storeInvestorRef: ${storeInvestorRef} storeSupplierRef: ${storeSupplierRef}`);
        data.investorDocRef = null;
        data.offerDocRef = null;
        data.supplierDocRef = null;
        data.intDate = null;
        if (!data.invoiceBidId) {
            data["invoiceBidId"] = uuid();
        }
        try {
            //final check before bid is made:
            const proceed = await checkTotalBids();
            if (proceed === false) {
                const msg = `This offer is already fully bid at 100.0%  offerDocRef: ${offerDocRef}`;
                throw new Error(`ERROR: ${msg}`);
            }
            data.date = new Date().toISOString();
            console.log(`InvoiceBidHelper: data direct to BFN: ${JSON.stringify(data)}`);
            const mresponse = await AxiosComms.AxiosComms.execute(url, data);
            if (mresponse.status === 200) {
                return writeToFirestore(mresponse.data);
            }
            else {
                console.log(`** BFN ERROR ## ${mresponse.data}`);
                throw new Error(mresponse.data);
            }
        }
        catch (error) {
            throw error;
        }
        async function writeToFirestore(mdata) {
            try {
                mdata.intDate = new Date().getTime();
                if (storeInvestorRef) {
                    mdata.investorDocRef = storeInvestorRef;
                }
                else {
                    mdata.investorDocRef = "toBeFixed";
                }
                if (offerDocRef) {
                    mdata.offerDocRef = offerDocRef;
                }
                else {
                    mdata.offerDocRef = "toBeFixed";
                }
                if (storeSupplierRef) {
                    mdata.supplierDocRef = storeSupplierRef;
                }
                else {
                    mdata.supplierDocRef = "toBeFixed";
                }
                console.log(mdata);
                console.log(`InvoiceBidHelper: adjusted response from BFN, check docRefs. investor, offer and supplier ???`);
                console.log(`InvoiceBidHelper: bid data direct to Firestore: ${JSON.stringify(mdata)}`);
                let ref;
                ref = await fs.collection("invoiceBids").add(mdata);
                console.log(`ref.path should NOT be null, but it is ${ref.path}`);
                console.log(`Invoice bid written to Firestore. YAY!`);
                mdata.documentReference = ref.path.split("/")[1];
                await ref.set(mdata);
                console.log(`Invoice bid updated with docRef`);
                if (mdata.reservePercent === 100.0) {
                    console.log(`######## closing offer, individual reservePercent == 100 %`);
                    await close_helper_1.CloseHelper.writeCloseOfferToBFN(offerId, mdata.offerDocRef, debug);
                }
                else {
                    if (mdata.reservePercent + totalReserved === 100.0) {
                        console.log(`######## closing offer, combined reservePercent == 100 %`);
                        await close_helper_1.CloseHelper.writeCloseOfferToBFN(offerId, offerDocRef, debug);
                    }
                }
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
        async function checkTotalBids() {
            console.log(`############ checkTotalBids ......... offerDocID: ${offerDocRef}`);
            const start = new Date().getTime();
            let total = 0.0;
            try {
                const msnapshot = await admin
                    .firestore()
                    .collection("invoiceBids")
                    .where("offerDocRef", "==", offerDocRef)
                    .get();
                msnapshot.forEach(doc => {
                    const reservePercent = doc.data()["reservePercent"];
                    const mReserve = parseFloat(reservePercent);
                    total += mReserve;
                });
                const end1 = new Date().getTime();
                console.log(`Finding invoiceBids for offer ${offerDocRef} - ${end1 -
                    start} milliseconds elapsed. found: ${msnapshot.docs.length}`);
                totalReserved = total;
                if (total >= 100.0) {
                    console.log(`######## closing offer, reservePercent == ${total} %`);
                    await close_helper_1.CloseHelper.writeCloseOfferToBFN(offerId, offerDocRef, debug);
                    return false;
                }
                else {
                    console.log(`# NOT closing offer, reservePercent == ${total} %`);
                    return true;
                }
            }
            catch (e) {
                console.log("-- Firestore: Check Totals PROBLEM -----");
                console.log(e);
                throw e;
            }
        }
    }
}
exports.InvoiceBidHelper = InvoiceBidHelper;
//# sourceMappingURL=invoice-bid-helper.js.map