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
exports.makeOffer = functions.https.onRequest(async (request, response) => {
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
    const apiSuffix = "MakeOffer";
    if (validate()) {
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
        if (!data.offerId) {
            data["offerId"] = uuid();
        }
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
        }
    }
    async function writeToFirestore(mdata) {
        mdata.intDate = new Date().getUTCMilliseconds();
        mdata.date = new Date().toUTCString();
        try {
            let ref1;
            ref1 = await admin
                .firestore()
                .collection("invoiceOffers")
                .add(mdata)
                .catch(function (error) {
                console.log(error);
                handleError(error);
            });
            console.log(`** Data written to Firestore! ${ref1.path}`);
            await sendMessageToTopic(mdata);
            await updateInvoice(mdata);
            response.status(200).send(mdata);
            return ref1;
        }
        catch (e) {
            console.log(e);
            handleError(e);
        }
    }
    async function updateInvoice(offer) {
        console.log("## update invoice isOnOffer will be set to true ....on Firestore!!");
        let querySnapshot;
        let invoice;
        querySnapshot = await admin
            .firestore()
            .collection("suppliers")
            .doc(offer.supplierDocumentRef)
            .collection("invoices")
            .where("invoiceId", "==", offer.invoice.split("#")[1])
            .get();
        if (querySnapshot.docs.length > 0) {
            invoice = querySnapshot.docs[0].data();
            invoice.isOnOffer = true;
            await querySnapshot.docs[0].ref.set(invoice).catch(e => {
                console.log(e);
                handleError("Invoice(supplier) isOnOffer update failed");
            });
            console.log("Invoice updated (supplier), isOnOffer = true ..Firestore");
        }
        //
        let querySnapshot2;
        querySnapshot2 = await admin
            .firestore()
            .collection("govtEntities")
            .where("participantId", "==", invoice.govtEntity.split("#")[1])
            .get();
        if (querySnapshot2.docs.length > 0) {
            const customerRef = querySnapshot2.docs[0].ref;
            const qs = await customerRef
                .collection("invoices")
                .where("invoiceId", "==", invoice.invoiceId)
                .get()
                .catch(e => {
                console.log(e);
                handleError("Invoice(customer) isOnOffer update failed");
            });
            if (qs.docs.length > 0) {
                const inv = qs.docs[0].data();
                inv.isOnOffer = true;
                qs.docs[0].ref.set(inv);
                console.log("Invoice updated (customer), isOnOffer = true ..Firestore");
            }
        }
    }
    async function sendMessageToTopic(mdata) {
        const topic = `offers`;
        const payload = {
            data: {
                messageType: "OFFER",
                json: JSON.stringify(mdata)
            },
            notification: {
                title: "BFN Offer",
                body: "Offer from " + mdata.supplierName + " amount: " + mdata.offerAmount
            }
        };
        console.log("sending Offer data to topic: " + topic);
        return await admin.messaging().sendToTopic(topic, payload);
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
//# sourceMappingURL=make-offer.js.map