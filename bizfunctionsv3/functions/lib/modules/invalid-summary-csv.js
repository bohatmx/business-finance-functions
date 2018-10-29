"use strict";
// ######################################################################
// Open Offers with Paging
// ######################################################################
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Data = require("../models/data");
// import * as JSON2CSV from "json2csv";
const Json2csvParser = require("json2csv").Parser;
//curl --header "Content-Type: application/json"  --request GET  https://us-central1-business-finance-dev.cloudfunctions.net/getInvalidSummariesCSV
exports.getInvalidSummariesCSV = functions.https.onRequest(async (request, response) => {
    const invalidSummaries = [];
    try {
        const firestore = admin.firestore();
        const settings = { /* your settings... */ timestampsInSnapshots: true };
        firestore.settings(settings);
        console.log("Firebase settings completed. Should be free of annoying messages from Google");
    }
    catch (e) {
        console.log(e);
    }
    console.log('## started getInvalidSummariesCSV .....');
    await getRecords();
    return null;
    async function getRecords() {
        let qs;
        qs = await admin
            .firestore()
            .collection("invalidSummaries")
            .get()
            .catch(e => {
            console.log(e);
            handleError('invalidSummary query failed');
        });
        qs.docs.forEach(doc => {
            const invalidSummary = new Data.InvalidSummary();
            const data = doc.data();
            invalidSummary.invalidTrades = data.invalidTrades;
            invalidSummary.isValidBalance = data.isValidBalance;
            invalidSummary.isValidInvestorMax = data.isValidInvestorMax;
            invalidSummary.isValidInvoiceAmount = data.isValidInvoiceAmount;
            invalidSummary.isValidMinimumDiscount = data.isValidMinimumDiscount;
            invalidSummary.isValidSector = data.isValidSector;
            invalidSummary.isValidSupplier = data.isValidSupplier;
            invalidSummary.date = data.date;
            invalidSummary.totalOpenOffers = data.totalOpenOffers;
            invalidSummary.totalUnits = data.totalUnits;
            invalidSummaries.push(invalidSummary);
        });
        const fields = [
            "invalidTrades",
            "isValidBalance",
            "isValidInvestorMax",
            "isValidInvoiceAmount",
            "isValidMinimumDiscount",
            "isValidSector",
            "isValidSupplier",
            "date",
            "totalOpenOffers",
            "totalOpenOffers"
        ];
        let csv;
        const opts = { fields };
        try {
            const parser = new Json2csvParser(opts);
            csv = parser.parse(invalidSummaries);
            console.log(csv);
        }
        catch (err) {
            console.error(err);
            handleError("JSON to CSV conversion failed");
        }
        response.status(200).send(csv);
        return csv;
    }
    function handleError(message) {
        console.log("--- ERROR !!! --- sending error payload: msg:" + message);
        try {
            const payload = {
                name: "getInvalidSummariesCSV",
                message: message,
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
//# sourceMappingURL=invalid-summary-csv.js.map