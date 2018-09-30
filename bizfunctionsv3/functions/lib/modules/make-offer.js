"use strict";
// ######################################################################
// Add DeliveryNote to BFN and Firestore
// ######################################################################
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const BFNConstants = require("../models/constants");
const AxiosComms = require("./axios-comms");
const uuid = require('uuid/v1');
exports.makeOffer = functions.https.onRequest((request, response) => __awaiter(this, void 0, void 0, function* () {
    if (!request.body) {
        console.log('ERROR - request has no body');
        return response.sendStatus(400);
    }
    console.log(`##### Incoming debug ${request.body.debug}`);
    console.log(`##### Incoming data ${JSON.stringify(request.body.data)}`);
    const debug = request.body.debug;
    const data = request.body.data;
    const apiSuffix = 'MakeOffer';
    const ref = yield writeToBFN();
    if (ref) {
        response.status(200).send(ref.path);
    }
    else {
        response.sendStatus(400);
    }
    return null;
    //add customer to bfn blockchain
    function writeToBFN() {
        return __awaiter(this, void 0, void 0, function* () {
            let url;
            if (debug) {
                url = BFNConstants.Constants.DEBUG_URL + apiSuffix;
            }
            else {
                url = BFNConstants.Constants.RELEASE_URL + apiSuffix;
            }
            console.log('####### --- writing Offer to BFN: ---> ' + url);
            data['offerId'] = uuid();
            // Send a POST request to BFN
            try {
                const mresponse = yield AxiosComms.AxiosComms.execute(url, data);
                console.log(`####### BFN response status: ##########: ${mresponse.status}`);
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
        });
    }
    function writeToFirestore(mdata) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('################### writeToFirestore, Offer data from BFN:\n '
                + JSON.stringify(mdata));
            // Add a new data to Firestore collection 
            try {
                const ref1 = yield admin.firestore()
                    .collection('invoiceOffers').add(mdata)
                    .catch(function (error) {
                    console.log("Error getting Firestore document ");
                    console.log(error);
                    return null;
                });
                console.log(`********** Data successfully written to Firestore! ${ref1.path}`);
                return ref1;
            }
            catch (e) {
                console.log('##### ERROR, probably JSON data format related');
                console.log(e);
                return null;
            }
        });
    }
}));
//# sourceMappingURL=make-offer.js.map