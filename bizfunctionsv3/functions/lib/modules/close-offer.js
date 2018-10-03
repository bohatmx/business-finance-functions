"use strict";
// ######################################################################
// Add CloseOffer to BFN and update Firestore
// ######################################################################
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const BFNConstants = require("../models/constants");
const AxiosComms = require("./axios-comms");
//curl --header "Content-Type: application/json"   --request POST   --data '{"offerId":"60bb1a50-c407-11e8-8c87-91c28e73e521", "debug": "true"}'   https://bfnrestv3.eu-gb.mybluemix.net/api/CloseOffer
exports.closeOffer = functions.https.onRequest(async (request, response) => {
    if (!request.body) {
        console.log('ERROR - request has no body');
        return response.sendStatus(400);
    }
    console.log(`##### Incoming debug ${request.body.debug}`);
    console.log(`##### Incoming data ${JSON.stringify(request.body.data)}`);
    const debug = request.body.debug;
    const offerId = request.body.offerId;
    const map = new Map();
    map['offerId'] = offerId;
    const apiSuffix = 'CloseOffer';
    const ref = await writeToBFN();
    if (ref) {
        response.status(200).send(ref.path);
    }
    else {
        response.sendStatus(400);
    }
    return null;
    //add customer to bfn blockchain
    async function writeToBFN() {
        let url;
        if (debug) {
            url = BFNConstants.Constants.DEBUG_URL + apiSuffix;
        }
        else {
            url = BFNConstants.Constants.RELEASE_URL + apiSuffix;
        }
        console.log(`####### --- executing CloseOffer on BFN Blockchain: --- ####### ${url}`);
        try {
            const mresponse = await AxiosComms.AxiosComms.execute(url, map);
            if (mresponse.status === 200) {
                return writeToFirestore();
            }
            else {
                console.log(`******** BFN ERROR ########### mresponse.status: ${mresponse.status}`);
                return null;
            }
        }
        catch (error) {
            console.log('--------------- axios: BFN blockchain encountered a problem -----------------');
            console.log(error);
            return null;
        }
    }
    async function writeToFirestore() {
        console.log(`################### writeToFirestore, close Offer :${offerId}`);
        try {
            let mdocID;
            let mData;
            const snapshot = await admin.firestore()
                .collection('invoiceOffers').where('offerId', '==', offerId)
                .get().catch(function (error) {
                console.log("Error getting Firestore document ");
                console.log(error);
                return null;
            });
            snapshot.forEach(doc => {
                mdocID = doc.id;
                mData = doc.data();
                mData.isOpen = false;
                mData.dateClosed = new Date().toISOString();
            });
            console.log(`********************* offer documentID: ${mdocID}`);
            console.log(`********************* offer data: ${JSON.stringify(mData)}`);
            let ref1;
            if (mdocID) {
                ref1 = await admin.firestore()
                    .collection('invoiceOffers').doc(mdocID).set(mData)
                    .catch(function (error) {
                    console.log("----- Error updating Firestore Offer document ");
                    console.log(error);
                    return null;
                });
                console.log(`********** Data successfully updated on Firestore: \n ${JSON.stringify(mData)}`);
            }
            return ref1;
        }
        catch (e) {
            console.log('##### ERROR, probably JSON data format related:');
            console.log(e);
            return null;
        }
    }
});
//# sourceMappingURL=close-offer.js.map