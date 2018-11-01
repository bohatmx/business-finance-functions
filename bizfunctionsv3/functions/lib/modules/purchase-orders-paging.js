"use strict";
// ######################################################################
// List Purchase Orders with Paging
// ######################################################################
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Data = require("../models/data");
// const Firestore = require("firestore");
exports.getPurchaseOrdersWithPaging = functions.https.onRequest(async (request, response) => {
    if (!request.body) {
        console.log("ERROR - request has no body");
        return response.status(400).send("request has no body");
    }
    console.log(request.body);
    let date;
    if (request.body.date) {
        date = request.body.date;
    }
    let pageLimit = 20;
    if (request.body.pageLimit) {
        pageLimit = request.body.pageLimit;
    }
    let collection = 'suppliers';
    if (request.body.collection) {
        collection = request.body.collection;
    }
    const documentId = request.body.documentId;
    try {
        const firestore = admin.firestore();
        const settings = { /* your settings... */ timestampsInSnapshots: true };
        firestore.settings(settings);
        console.log("Firebase settings completed. Should be free of annoying messages");
    }
    catch (e) {
        console.log(e);
    }
    console.log(`##### Incoming date ${date}`);
    console.log(`##### Incoming pageLimit ${pageLimit}`);
    console.log(`##### Incoming documentId ${documentId}`);
    console.log(`##### Incoming collection ${collection}`);
    const purchaseOrders = [];
    const result = {
        purchaseOrders: purchaseOrders,
        totalPurchaseOrders: 0,
        totalAmount: 0.0,
        startedAfter: date
    };
    await getPurchaseOrders();
    return response.status(200).send(result);
    async function getPurchaseOrders() {
        let queryRef;
        if (date) {
            console.log("++++ we have a date for query " + date);
            queryRef = await admin
                .firestore()
                .collection(collection)
                .doc(documentId)
                .collection('purchaseOrders')
                .orderBy("intDate", "desc")
                .startAfter(date)
                .limit(pageLimit)
                .get()
                .catch(function (error) {
                console.log(error);
                handleError(error);
            });
        }
        else {
            console.log("------ we have a null date for query ");
            queryRef = await admin
                .firestore()
                .collection(collection)
                .doc(documentId)
                .collection('purchaseOrders')
                .orderBy("intDate", "desc")
                .limit(pageLimit)
                .get()
                .catch(function (error) {
                console.log(error);
                handleError(error);
            });
        }
        try {
            queryRef.docs.forEach(doc => {
                const po = new Data.PurchaseOrder();
                const data = doc.data();
                po.purchaseOrderId = data.purchaseOrderId;
                po.supplier = data.supplier;
                po.date = data.date;
                po.govtEntity = data.govtEntity;
                po.amount = data.amount;
                po.supplierDocumentRef = data.supplierDocumentRef;
                po.govtDocumentRef = data.govtDocumentRef;
                po.purchaseOrderNumber = data.purchaseOrderNumber;
                po.documentReference = doc.ref.path.split('/')[1];
                po.purchaserName = data.purchaserName;
                po.supplierName = data.supplierName;
                po.supplierDocumentRef = data.supplierDocumentRef;
                po.intDate = data.intDate;
                result.totalAmount += po.amount;
                result.totalPurchaseOrders++;
                purchaseOrders.push(po);
            });
            result.purchaseOrders = purchaseOrders;
            console.log(`## page returned has ${purchaseOrders.length} purchase orders`);
            return null;
        }
        catch (e) {
            console.log(e);
            handleError("getOpenOffersWithPaging Query failed: " + e);
        }
    }
    function handleError(message) {
        console.log("--- ERROR !!! --- sending error payload: msg:" + message);
        try {
            const payload = {
                name: "getOpenOffersWithPaging",
                message: message,
                date: new Date().toISOString()
            };
            console.log(payload);
            response.status(400).send(payload);
        }
        catch (e) {
            console.log("possible error propagation/cascade here. ignored");
            response.status(400).send("getOpenOffersWithPaging Query Failed");
        }
    }
});
//# sourceMappingURL=purchase-orders-paging.js.map