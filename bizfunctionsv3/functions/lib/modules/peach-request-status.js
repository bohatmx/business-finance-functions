"use strict";
// ######################################################################
// Request payment status from Peach
// ######################################################################
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const BFNConstants = require("../models/constants");
const AxiosComms = require("./axios-comms");
exports.peachRequestStatus = functions.https.onRequest(async (request, response) => {
    if (!request.body) {
        console.log("ERROR - request has no body");
        return response.sendStatus(400);
    }
    const path = request.body.resourcePath;
    try {
        const firestore = admin.firestore();
        const settings = { /* your settings... */ timestampsInSnapshots: true };
        firestore.settings(settings);
        console.log("Firebase settings completed. Should be free of annoying messages from Google");
    }
    catch (e) {
        //console.log(e);
    }
    console.log(`##### Incoming resourcePath ${path}`);
    const debug = request.body.debug;
    const apiSuffix = `/v1/checkouts/${path}/payment/`;
    await talkToPeach();
    return null;
    async function talkToPeach() {
        let url;
        if (debug) {
            url = BFNConstants.Constants.PEACH_TEST_URL + apiSuffix;
        }
        else {
            url = BFNConstants.Constants.PEACH_TEST_URL + apiSuffix;
        }
        url += `?authentication.userId=${BFNConstants.Constants.PEACH_USERID}&authentication.password=${BFNConstants.Constants.PEACH_PASSWORD}`;
        console.log(url);
        try {
            const mresponse = await AxiosComms.AxiosComms.get(url);
            console.log(mresponse);
            if (mresponse.status === 200) {
                response.status(200).send(mresponse);
                return null;
            }
            else {
                console.log(`** Peach ERROR ## ${mresponse.data}`);
                handleError(mresponse);
            }
        }
        catch (error) {
            handleError(`Call to Peach failed: ${error}`);
            return null;
        }
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
            response.status(400).send(message);
        }
    }
});
//# sourceMappingURL=peach-request-status.js.map