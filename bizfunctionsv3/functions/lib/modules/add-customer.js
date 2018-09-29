"use strict";
// ######################################################################
// Add customer to BFN and Firestore
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
const axios = require('axios');
exports.addCustomer = functions.https.onRequest((request, response) => __awaiter(this, void 0, void 0, function* () {
    if (!request.body) {
        console.log('ERROR - request has no body');
        return response.sendStatus(500);
    }
    console.log('----------------------------> Incoming addCustomer https request: '
        + JSON.stringify(request.body));
    console.log(`##### debug ${request.body.debug}`);
    console.log(`##### data ${request.body.data}`);
    console.log(`##### collectionName ${request.body.collectionName}`);
    const debug = request.body.debug;
    const ref = yield writeToBFN();
    if (ref) {
        response.send(ref);
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
                url = BFNConstants.Constants.DEBUG_URL;
            }
            else {
                url = BFNConstants.Constants.RELEASE_URL;
            }
            url += 'GovtEntity';
            console.log('############ ----- writing to BFN: -------> ' + url);
            // Send a POST request to BFN
            try {
                const mresponse = yield axios({
                    method: 'post',
                    url: url,
                    data: request.body
                });
                console.log(`####### BFN response mresponse: ##########: ${mresponse}`);
                console.log(`####### BFN response status: ##########: ${mresponse.status}`);
                console.log(`####### BFN response data: ##########: ${mresponse.data}`);
                if (mresponse.status === 200) {
                    return writeToFirestore(mresponse.data);
                }
                else {
                    console.log('******** ERROR ###########');
                    return null;
                }
            }
            catch (error) {
                console.log('--------------- axios problem -----------------');
                console.log(error);
                return null;
            }
        });
    }
    function writeToFirestore(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('################### writeToFirestore ###################### data:\n '
                + JSON.stringify(data));
            // Add a new customer in collection "govtEntities"
            try {
                const reference = yield admin.firestore().collection('govtEntities').add(data)
                    .catch(function (error) {
                    console.log("Error writing Firestore document ");
                    console.log(error);
                    return null;
                });
                console.log(`********** Customer successfully written to Firestore! ${reference}`);
                return reference;
            }
            catch (e) {
                console.log('##### ERROR, probably JSON data format related');
                console.log(e);
                return null;
            }
        });
    }
}));
//# sourceMappingURL=add-customer.js.map