"use strict";
// ######################################################################
// Add DeliveryNote to BFN and Firestore
// ######################################################################
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const BFNConstants = require("../models/constants");
const AxiosComms = require("./axios-comms");
const uuid = require("uuid/v1");
exports.acceptDeliveryNote = functions.https.onRequest(async (request, response) => {
    if (!request.body) {
        console.log("ERROR - request has no body");
        return response.sendStatus(400);
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
    const fs = admin.firestore();
    const apiSuffix = "AcceptDelivery";
    if (validate() === true) {
        await writeToBFN();
    }
    return null;
    function validate() {
        if (!request.body) {
            console.log("ERROR - request has no body");
            return response.status(400).send("request has no body");
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
        if (!data.acceptanceId) {
            data["acceptanceId"] = uuid();
        }
        data.date = new Date().toISOString();
        try {
            const mresponse = await AxiosComms.AxiosComms.execute(url, data);
            if (mresponse.status === 200) {
                return writeToFirestore(mresponse.data);
            }
            else {
                console.log(`** BFN ERROR ## ${mresponse.data}`);
                handleError(mresponse);
            }
        }
        catch (error) {
            handleError(error);
            return null;
        }
    }
    async function writeToFirestore(mdata) {
        mdata.intDate = new Date().getTime();
        mdata.date = new Date().toISOString();
        try {
            let mdocID;
            if (!mdata.govtDocumentRef) {
                const key = mdata.govtEntity.split("#")[1];
                const snapshot = await fs
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
                ref1 = await fs
                    .collection("govtEntities")
                    .doc(mdocID)
                    .collection("deliveryAcceptances")
                    .add(mdata)
                    .catch(function (error) {
                    console.log(error);
                    handleError(error);
                    return null;
                });
                console.log(`*** Data successfully written to Firestore! ${ref1.path}`);
            }
            let docID;
            if (!mdata.supplierDocumentRef) {
                const key = mdata.supplier.split("#")[1];
                let snapshot;
                snapshot = await fs
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
                let ref2;
                ref2 = await fs
                    .collection("suppliers")
                    .doc(docID)
                    .collection("deliveryAcceptances")
                    .add(mdata)
                    .catch(function (error) {
                    console.log(error);
                    handleError(error);
                    return null;
                });
                console.log(`*** Data successfully written to Firestore! ${ref2.path}`);
            }
            await sendMessageToTopic(mdata);
            response.status(200).send(mdata);
            return ref1;
        }
        catch (e) {
            console.log(e);
            handleError(e);
        }
    }
    async function sendMessageToTopic(mdata) {
        const topic = BFNConstants.Constants.TOPIC_DELIVERY_ACCEPTANCES;
        const topic2 = BFNConstants.Constants.TOPIC_DELIVERY_ACCEPTANCES +
            mdata.supplier.split("#")[1];
        const topic3 = BFNConstants.Constants.TOPIC_DELIVERY_ACCEPTANCES +
            mdata.govtEntity.split("#")[1];
        const mCondition = `'${topic}' in topics || '${topic2}' in topics || '${topic3}' in topics`;
        console.log("sending Delivery Acceptance data to topics: " +
            topic +
            " " +
            topic2 +
            " " +
            topic3);
        const payload = {
            data: {
                messageType: "DELIVERY_ACCEPTANCE",
                json: JSON.stringify(mdata)
            },
            notification: {
                title: "Delivery Acceptance",
                body: "Delivery Acceptance from " +
                    mdata.customerName +
                    " amount: " +
                    mdata.amount
            },
            condition: mCondition
        };
        try {
            await admin.messaging().send(payload);
        }
        catch (e) {
            console.error(e);
        }
        return null;
    }
    function handleError(message) {
        console.error("--- ERROR !!! --- sending error payload: msg:" + message);
        throw new Error(message);
    }
});
//# sourceMappingURL=accept_delivery_note.js.map