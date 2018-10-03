"use strict";
// ######################################################################
// Add Invoice to BFN and Firestore
// ######################################################################
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const BFNConstants = require("../models/constants");
const AxiosComms = require("./axios-comms");
const uuid = require('uuid/v1');
exports.makeInvoiceBid = functions.https.onRequest(async (request, response) => {
    if (!request.body) {
        console.log('ERROR - request has no body');
        return response.sendStatus(400);
    }
    console.log(`##### Incoming debug ${request.body.debug}`);
    console.log(`##### Incoming data ${JSON.stringify(request.body.data)}`);
    const debug = request.body.debug;
    const data = request.body.data;
    const apiSuffix = 'MakeInvoiceBid';
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
        console.log('####### --- writing InvoiceBid to BFN: ---> ' + url);
        data['invoiceBidId'] = uuid();
        // Send a POST request to BFN
        try {
            const mresponse = await AxiosComms.AxiosComms.execute(url, data);
            if (mresponse.status === 200) {
                return writeToFirestore(mresponse.data);
            }
            else {
                console.log('******** BFN ERROR ###########');
                return null;
            }
        }
        catch (error) {
            console.log('--------------- axios: BFN blockchain problem -----------------');
            console.log(error);
            return null;
        }
    }
    async function writeToFirestore(mdata) {
        console.log('################### writeToFirestore, PO data from BFN:\n '
            + JSON.stringify(mdata));
        // Add a new data to Firestore collection 
        try {
            let mdocID;
            const key = mdata.investor.split('#')[1];
            const snapshot = await admin.firestore()
                .collection('investors').where('participantId', '==', key)
                .get().catch(function (error) {
                console.log("Error getting Firestore document ");
                console.log(error);
                return null;
            });
            snapshot.forEach(doc => {
                mdocID = doc.id;
            });
            let ref1;
            if (mdocID) {
                ref1 = await admin.firestore()
                    .collection('investors').doc(mdocID)
                    .collection('invoiceBids').add(mdata)
                    .catch(function (error) {
                    console.log("Error getting Firestore document ");
                    console.log(error);
                    return null;
                });
                console.log(`********** Data successfully written to Firestore! ${ref1.path}`);
            }
            let docID;
            const offerId = mdata.offer.split('#')[1];
            const msnapshot = await admin.firestore()
                .collection('invoiceOffers').where('offerId', '==', offerId)
                .get().catch(function (error) {
                console.log("Error writing Firestore document ");
                console.log(error);
                return null;
            });
            msnapshot.forEach(doc => {
                docID = doc.id;
            });
            if (docID) {
                const ref2 = await admin.firestore()
                    .collection('invoiceOffers').doc(docID)
                    .collection('invoiceBids').add(mdata)
                    .catch(function (error) {
                    console.log("Error writing Firestore document ");
                    console.log(error);
                    return null;
                });
                console.log(`********** Data successfully written to Firestore! ${ref2.path}`);
            }
            await checkTotalBids(docID, offerId);
            return ref1;
        }
        catch (e) {
            console.log('##### ERROR, probably JSON data format related');
            console.log(e);
            return null;
        }
    }
    async function checkTotalBids(offerDocID, offerId) {
        console.log(`############ checkTotalBids ......... offerDocID: ${offerDocID}`);
        const msnapshot = await admin.firestore()
            .collection('invoiceOffers').doc(offerDocID)
            .collection('invoiceBids')
            .get().catch(function (error) {
            console.log("Error writing Firestore document ");
            console.log(error);
            return null;
        });
        let total = 0.0;
        try {
            msnapshot.forEach(doc => {
                const reservePercent = doc.data()['reservePercent'];
                const mReserve = parseFloat(reservePercent);
                total += mReserve;
            });
            if (total >= 100.0) {
                console.log(`######## closing offer, reservePercent == ${total} %`);
                // Send a POST request to BFN
                let url;
                if (debug) {
                    url = BFNConstants.Constants.DEBUG_FUNCTIONS_URL + 'closeOffer';
                }
                else {
                    url = BFNConstants.Constants.RELEASE_FUNCTIONS_URL + 'closeOffer';
                }
                const map = new Map();
                map['offerId'] = offerId;
                map['debug'] = debug;
                try {
                    const mresponse = await AxiosComms.AxiosComms.execute(url, map);
                    console.log(`####### Functions response status: ##########: ${mresponse.status}`);
                    if (mresponse.status === 200) {
                        console.log('************* Offer closed by function call from this function');
                        return 'ok';
                    }
                    else {
                        console.log('******** BFN ERROR ###########');
                        return null;
                    }
                }
                catch (error) {
                    console.log('--------------- axios: BFN blockchain problem -----------------');
                    console.log(error);
                    return null;
                }
            }
            else {
                console.log(`######## NOT closing offer, reservePercent == ${total} %`);
            }
        }
        catch (e) {
            console.log('--------------- Firestore: Check Totals PROBLEM -----------------');
            console.log(e);
        }
        return null;
    }
});
//# sourceMappingURL=make_invoice.bid.js.map