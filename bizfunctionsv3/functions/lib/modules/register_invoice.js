"use strict";
// ######################################################################
// Add Invoice to BFN and Firestore
// ######################################################################
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const BFNConstants = require("../models/constants");
const AxiosComms = require("./axios-comms");
const InvoiceUpdate = require("../modules/update-invoice-with-acceptance");
const uuid = require("uuid/v1");
exports.registerInvoice = functions.https.onRequest(async (request, response) => {
    console.log(`##### Incoming debug ${request.body.debug}`);
    console.log(`##### Incoming data ${JSON.stringify(request.body.data)}`);
    try {
        const firestore = admin.firestore();
        const settings = { /* your settings... */ timestampsInSnapshots: true };
        firestore.settings(settings);
        console.log("Firebase settings completed. Should be free of annoying messages from Google");
    }
    catch (e) {
        console.log(e);
    }
    const debug = request.body.debug;
    const data = request.body.data;
    const apiSuffix = "RegisterInvoice";
    if (validate() === true) {
        await writeToBFN();
    }
    return null;
    function validate() {
        if (!request.body) {
            console.log("ERROR - request has no body");
            return response.status(400).send("request has no body");
        }
        // if (!request.body.debug) {
        //   console.log("ERROR - request has no debug flag");
        //   return response.status(400).send(" request has no debug flag");
        // }
        if (!request.body.data) {
            console.log("ERROR - request has no data");
            return response.status(400).send(" request has no data");
        }
        return true;
    }
    //add customer to bfn blockchain
    async function writeToBFN() {
        let url;
        if (debug) {
            url = BFNConstants.Constants.DEBUG_URL + apiSuffix;
        }
        else {
            url = BFNConstants.Constants.RELEASE_URL + apiSuffix;
        }
        if (!data.invoiceId) {
            data["invoiceId"] = uuid();
        }
        try {
            const mresponse = await AxiosComms.AxiosComms.execute(url, data);
            if (mresponse.status === 200) {
                return writeToFirestore(mresponse.data);
            }
            else {
                console.log("******** BFN ERROR ### status: " + mresponse.status);
                handleError(mresponse.data);
            }
        }
        catch (error) {
            console.log(error);
            handleError('RegisterInvoice failed');
        }
    }
    async function writeToFirestore(mdata) {
        mdata.intDate = new Date().getUTCMilliseconds();
        mdata.date = new Date().toUTCString();
        try {
            const mdocID = mdata.govtDocumentRef;
            let ref1;
            ref1 = await admin
                .firestore()
                .collection("govtEntities")
                .doc(mdocID)
                .collection("invoices")
                .add(mdata)
                .catch(function (error) {
                console.log(error);
                handleError(`RegisterInvoice failed: ${error}`);
            });
            console.log(`*** Data successfully written to Firestore! ${ref1.path}`);
            const docID = mdata.supplierDocumentRef;
            let ref3;
            if (docID) {
                ref3 = await admin
                    .firestore()
                    .collection("suppliers")
                    .doc(docID)
                    .collection("invoices")
                    .add(mdata)
                    .catch(function (error) {
                    console.log(error);
                    handleError(`RegisterInvoice failed: ${error}`);
                });
                console.log(`*** Data written to Firestore suppliers/invoices ${ref3.path}`);
                await sendMessageToTopic(mdata);
                await checkAutoAccept(mdata);
            }
        }
        catch (e) {
            console.log(e);
            handleError(`RegisterInvoice failed: ${e}`);
        }
    }
    async function sendMessageToTopic(mdata) {
        const topic = BFNConstants.Constants.TOPIC_INVOICES + mdata.govtEntity.split('#')[1];
        const topic2 = BFNConstants.Constants.TOPIC_INVOICES + 'admin';
        const payload = {
            data: {
                messageType: "INVOICE",
                json: JSON.stringify(mdata)
            },
            notification: {
                title: "Invoice",
                body: "Invoice from " +
                    mdata.supplierName +
                    " amount: " +
                    mdata.amount
            }
        };
        console.log("sending invoice data to topic: " + topic + ' ' + topic2);
        await admin.messaging().sendToTopic(topic2, payload);
        return await admin.messaging().sendToTopic(topic, payload);
    }
    async function checkAutoAccept(invoice) {
        console.log("checkAutoAccept, cust ref: " + invoice.govtDocumentRef);
        let docSnapshot;
        docSnapshot = await admin
            .firestore()
            .collection("govtEntities")
            .doc(invoice.govtDocumentRef)
            .get();
        console.log(docSnapshot.data());
        if (docSnapshot) {
            if (docSnapshot.data().allowAutoAccept) {
                console.log("Issue an InvoiceAcceptance and write to BFN & Firestore");
                return await acceptInvoice(invoice);
            }
            else {
                console.log('Customer has no autoAccept - send 200 with invoice');
                response.status(200).send(invoice);
                return null;
            }
        }
        else {
            const msg = 'Customer record not found';
            console.log(msg);
            response.status(400).send(msg);
            return null;
        }
    }
    async function acceptInvoice(invoice) {
        const invoiceAcceptance = {
            acceptanceId: uuid(),
            supplierName: invoice.supplierName,
            customerName: invoice.customerName,
            invoiceNumber: invoice.invoiceNumber,
            date: new Date().toISOString(),
            invoice: `resource:com.oneconnect.biz.Invoice#${invoice.invoiceId}`,
            govtEntity: invoice.govtEntity,
            supplierDocumentRef: invoice.supplierDocumentRef
        };
        console.log(invoiceAcceptance);
        let url;
        const suffix = "AcceptInvoice";
        if (debug) {
            url = BFNConstants.Constants.DEBUG_URL + suffix;
        }
        else {
            url = BFNConstants.Constants.RELEASE_URL + suffix;
        }
        try {
            const mresponse = await AxiosComms.AxiosComms.execute(url, invoiceAcceptance);
            if (mresponse.status === 200) {
                let mRef;
                mRef = await admin
                    .firestore()
                    .collection("suppliers")
                    .doc(invoice.supplierDocumentRef)
                    .collection("invoiceAcceptances")
                    .add(mresponse.data)
                    .catch(function (error) {
                    console.log(error);
                    handleError(error);
                });
                console.log(`Firestore document added: ${mRef.path}`);
                await InvoiceUpdate.updateInvoice(mresponse.data);
                response.status(201).send(invoice);
                return null;
            }
            else {
                console.log(`** BFN ERROR ## status: ${mresponse.data}`);
                handleError(mresponse);
            }
        }
        catch (error) {
            console.log(error);
            handleError(error);
        }
    }
    function handleError(message) {
        console.log("--- ERROR !!! --- sending error payload: msg:" + message);
        try {
            const payload = {
                message: message,
                date: new Date().toISOString()
            };
            console.log(payload);
            response.status(400).send(payload);
        }
        catch (e) {
            console.log('possible error propagation/cascade here. ignored');
            response.status(400).send('RegisterInvoice failed');
        }
    }
});
//# sourceMappingURL=register_invoice.js.map