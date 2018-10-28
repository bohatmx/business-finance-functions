"use strict";
// ######################################################################
// Add PurchaseOrder to BFN and Firestore
// ######################################################################
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const BFNConstants = require("../models/constants");
const AxiosComms = require("./axios-comms");
const uuid = require("uuid/v1");
exports.registerPurchaseOrder = functions.https.onRequest(async (request, response) => {
    if (!request.body) {
        console.log("ERROR - request has no body");
        return response.status(400).send("request has no body");
    }
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
    const apiSuffix = "RegisterPurchaseOrder";
    if (validate() === true) {
        await writeToBFN();
    }
    return null;
    function validate() {
        if (!request.body) {
            console.log("ERROR - request has no body");
            return response.status(400).send("request has no body");
        }
        if (!request.body.debug) {
            console.log("ERROR - request has no debug flag");
            return response.status(400).send(" request has no debug flag");
        }
        if (!request.body.data) {
            console.log("ERROR - request has no data");
            return response.status(400).send(" request has no data");
        }
        return true;
    }
    async function writeToBFN() {
        let url;
        if (debug) {
            url = BFNConstants.Constants.DEBUG_URL + apiSuffix;
        }
        else {
            url = BFNConstants.Constants.RELEASE_URL + apiSuffix;
        }
        if (!data.purchaseOrderId) {
            data["purchaseOrderId"] = uuid();
        }
        try {
            const mresponse = await AxiosComms.AxiosComms.execute(url, data);
            if (mresponse.status === 200) {
                return writeToFirestore(mresponse.data);
            }
            else {
                handleError(`BFN fucked up. status: ${mresponse.status}`);
            }
        }
        catch (error) {
            console.log(error);
            handleError(error);
        }
    }
    async function writeToFirestore(mdata) {
        mdata.intDate = new Date().getUTCMilliseconds();
        mdata.date = new Date().toUTCString();
        try {
            let mdocID;
            if (!mdata.govtDocumentRef) {
                const key = mdata.govtEntity.split("#")[1];
                const snapshot = await admin
                    .firestore()
                    .collection("govtEntities")
                    .where("participantId", "==", key)
                    .get()
                    .catch(function (error) {
                    console.log(error);
                    handleError(error);
                    return null;
                });
                snapshot.forEach(doc => {
                    mdocID = doc.id;
                });
            }
            else {
                mdocID = mdata.govtDocumentRef;
            }
            let ref1;
            if (mdocID) {
                ref1 = await admin
                    .firestore()
                    .collection("govtEntities")
                    .doc(mdata.govtDocumentRef)
                    .collection("purchaseOrders")
                    .add(mdata)
                    .catch(function (error) {
                    console.log(error);
                    handleError(error);
                });
                console.log(`*** Data successfully written to Firestore! ${ref1.path}`);
            }
            let docID;
            if (!mdata.supplierDocumentRef) {
                const key = mdata.supplier.split("#")[1];
                const snapshot = await admin
                    .firestore()
                    .collection("suppliers")
                    .where("participantId", "==", key)
                    .get()
                    .catch(function (error) {
                    console.log(error);
                    handleError(error);
                    return null;
                });
                snapshot.forEach(doc => {
                    docID = doc.id;
                });
            }
            else {
                docID = mdata.supplierDocumentRef;
            }
            if (docID) {
                const ref2 = await admin
                    .firestore()
                    .collection("suppliers")
                    .doc(docID)
                    .collection("purchaseOrders")
                    .add(mdata)
                    .catch(function (error) {
                    console.log(error);
                    handleError(error);
                    return null;
                });
                console.log(`*** Data successfully written to Firestore! ${ref2.path}`);
            }
            console.log("Purchase Order processed OK... done!");
            response.send(mdata);
        }
        catch (e) {
            console.log(e);
            handleError(e);
        }
    }
    function handleError(message) {
        console.log("--- ERROR !!! --- sending error payload: msg:" + message);
        try {
            const payload = {
                name: "MakeInvoiceBid",
                message: message,
                data: request.body.data,
                date: new Date().toISOString()
            };
            console.log(payload);
            response.status(400).send(payload);
        }
        catch (e) {
            console.log("possible error propagation/cascade here. ignored");
            response.status(400).send("Register PO failed");
        }
    }
});
//# sourceMappingURL=register_purchase_order.js.map