"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const BFNConstants = require("../models/constants");
const AxiosComms = require("./axios-comms");
class CloseHelper {
    static async writeCloseOfferToBFN(offerId, offerDocRef, debug) {
        let url;
        const map = new Map();
        map["offerId"] = offerId;
        if (debug) {
            url = BFNConstants.Constants.DEBUG_URL + "CloseOffer";
        }
        else {
            url = BFNConstants.Constants.RELEASE_URL + "CloseOffer";
        }
        try {
            const mresponse = await AxiosComms.AxiosComms.execute(url, map);
            if (mresponse.status === 200) {
                return writeCloseOfferToFirestore();
            }
            else {
                console.log(`******** BFN ERROR ########### mresponse.status: ${mresponse.status}`);
                throw new Error(`BFN error  status: ${mresponse.status} ${mresponse.body}`);
            }
        }
        catch (error) {
            console.log("--------------- axios: BFN blockchain encountered a problem -----------------");
            console.log(error);
            throw error;
        }
        async function writeCloseOfferToFirestore() {
            console.log(`################### writeToFirestore, close Offer :${offerDocRef}`);
            try {
                const snapshot = await admin
                    .firestore()
                    .collection("invoiceOffers")
                    .doc(offerDocRef)
                    .get();
                const mData = snapshot.data();
                mData.isOpen = false;
                mData.dateClosed = new Date().toISOString();
                await snapshot.ref.set(mData);
                console.log(`offer closed , isOpen set to false - updated on Firestore`);
                console.log(`********************* offer data: ${JSON.stringify(mData)}`);
                return null;
            }
            catch (e) {
                console.log("##### ERROR, probably JSON data format related:");
                console.log(e);
                throw e;
            }
        }
    }
}
exports.CloseHelper = CloseHelper;
//# sourceMappingURL=close-helper.js.map