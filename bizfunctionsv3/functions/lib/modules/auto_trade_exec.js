"use strict";
// ###########################################################################
// Execute Auto Trading Session - investors matched with offers and bids
// ###########################################################################
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Data = require("../models/data");
const Matcher = require("./matcher");
const invoice_bid_helper_1 = require("./invoice-bid-helper");
const uuid = require("uuid/v1");
//curl --header "Content-Type: application/json"   --request POST   --data '{"debug": "true"}'   https://us-central1-business-finance-dev.cloudfunctions.net/executeAutoTrade
exports.executeAutoTrades = functions
    .runWith({ memory: "512MB", timeoutSeconds: 540 })
    .https.onRequest(async (request, response) => {
    try {
        const firestore = admin.firestore();
        const settings = { /* your settings... */ timestampsInSnapshots: true };
        firestore.settings(settings);
        console.log("Firebase settings completed. Should be free of annoying messages from Google :) :)");
    }
    catch (e) {
        console.log(e);
    }
    if (!request.body) {
        console.log("ERROR - request has no body");
        return response.status(500).send("Request has no body");
    }
    console.log(`##### Incoming debug ${request.body.debug}`);
    const debug = request.body.debug;
    let orders = [];
    let profiles = [];
    let offers = [];
    let units = [];
    const summary = {
        totalValidBids: 0,
        totalOffers: 0,
        totalInvalidBids: 0,
        possibleAmount: 0.0,
        totalAmount: 0.0,
        elapsedSeconds: 0.0,
        closedOffers: 0,
        dateStarted: new Date().toISOString(),
        dateEnded: null
    };
    const startKey = `start-${new Date().getTime()}`;
    const startTime = new Date().getTime();
    await sendMessageToHeartbeatTopic(`AutoTrade Session started: ${new Date().toISOString()}`);
    await startAutoTradeSession();
    return null;
    async function startAutoTradeSession() {
        const date = new Date().toISOString();
        console.log(`### starting AutoTrade Session ########### ${date}`);
        await writeAutoTradeStart();
        const result = await getData();
        if (result > 0) {
            await buildUnits();
            units.map(unit => {
                summary.possibleAmount += unit.offer.offerAmount;
            });
            await sendMessageToHeartbeatTopic("Preparing to start writing bids to BFN");
            await writeBids();
        }
        console.log(summary);
        return finishAutoTrades();
    }
    async function finishAutoTrades() {
        const now = new Date().getTime();
        const elapsed = (now - startTime) / 1000;
        summary.elapsedSeconds = elapsed;
        await updateAutoTradeStart();
        console.log(`######## Auto Trading Session completed; autoTradeStart updated. Done in 
            ${summary.elapsedSeconds} seconds. We are HAPPY, Houston!!`);
        await sendMessageToHeartbeatTopic(`AutoTrade Session complete, elapsed: ${summary.elapsedSeconds} seconds`);
        return response.status(200).send(summary);
    }
    async function writeBids() {
        for (const unit of units) {
            await writeBidToBFN(unit);
        }
        console.log(`######## validateBids complete. ...closing up! ################`);
        return 0;
    }
    async function writeBidToBFN(unit) {
        try {
            //get existing invoice bids for this offer
            const bidQuerySnap = await admin
                .firestore()
                .collection("invoiceOffers")
                .doc(unit.offer.offerDocRef)
                .collection("invoiceBids")
                .get();
            let reserveTotal = 0.0;
            bidQuerySnap.docs.forEach(doc => {
                reserveTotal += doc.data()["reservePercent"];
            });
            if (reserveTotal > 0) {
                console.log(`&&&&&&&&& total percent reserved: ${reserveTotal} % from ${bidQuerySnap.size} existing bids. Offer amt: ${unit.offer.offerAmount}`);
            }
            const myReserve = 100.0 - reserveTotal;
            const myAmount = unit.offer.offerAmount * (myReserve / 100);
            const ONE_HOUR = 1000 * 60 * 60;
            const ONE_DAY = ONE_HOUR * 24;
            const ONE_WEEK_FROM_NOW = new Date().getTime() + ONE_DAY * 14;
            const mdate = new Date(ONE_WEEK_FROM_NOW);
            if (!unit.offer.customer) {
                throw new Error("Customer is null: .... wtf?");
            }
            const bid = {
                invoiceBidId: uuid(),
                amount: myAmount,
                reservePercent: myReserve,
                autoTradeOrder: `resource:com.oneconnect.biz.AutoTradeOrder#${unit.order.autoTradeOrderId}`,
                investor: unit.order.investor,
                offer: `resource:com.oneconnect.biz.Offer#${unit.offer.offerId}`,
                investorName: unit.order.investorName,
                wallet: unit.order.wallet,
                date: new Date().toISOString(),
                intDate: null,
                isSettled: false,
                supplier: unit.offer.supplier,
                supplierName: unit.offer.supplierName,
                customerName: unit.offer.customerName,
                customer: unit.offer.customer,
                discountPercent: unit.offer.discountPercent,
                investorDocRef: unit.profile.investorDocRef,
                offerDocRef: unit.offer.offerDocRef,
                startTime: new Date().toISOString(),
                endTime: mdate.toISOString()
            };
            console.log(`++++ bid to be written to BFN: ${JSON.stringify(bid)}`);
            await invoice_bid_helper_1.InvoiceBidHelper.writeInvoiceBidToBFNandFirestore(bid, debug);
        }
        catch (e) {
            console.log(e);
            throw e;
        }
    }
    async function getData() {
        console.log("################### getData ######################");
        await sendMessageToHeartbeatTopic("Collecting auto trade base data");
        let qso;
        qso = await admin
            .firestore()
            .collection("invoiceOffers")
            .where("isOpen", "==", true)
            .where("endTime", ">", new Date().toISOString())
            .orderBy("endTime")
            .get()
            .catch(e => {
            console.log(e);
            handleError(e);
        });
        console.log(`###### open offers found: ${qso.docs.length}`);
        summary.totalOffers = qso.docs.length;
        offers = [];
        qso.docs.forEach(doc => {
            const data = doc.data();
            const offer = new Data.Offer();
            offer.offerId = data["offerId"];
            offer.isOpen = data["isOpen"];
            offer.isCancelled = data["isCancelled"];
            offer.offerAmount = data["offerAmount"];
            offer.discountPercent = data["discountPercent"];
            offer.startTime = data["startTime"];
            offer.endTime = data["endTime"];
            offer.invoice = data["invoice"];
            offer.date = data["date"];
            offer.invoiceAmount = data["invoiceAmount"];
            offer.customerName = data["customerName"];
            offer.supplier = data["supplier"];
            offer.supplierName = data["supplierName"];
            if (!data["customer"]) {
                throw new Error(`##### ERROR - customer is NULL. you have to be kidding! ${doc.ref.path}`);
            }
            offer.customer = data["customer"];
            offers.push(offer);
        });
        if (qso.docs.length === 0) {
            console.log("No open offers found. quitting ...");
            return 0;
        }
        else {
            console.log("### Open offers found: " + qso.docs.length);
        }
        shuffleOffers();
        ///////
        let qs;
        qs = await admin
            .firestore()
            .collection("autoTradeOrders")
            .where("isCancelled", "==", false)
            .get()
            .catch(e => {
            console.log(e);
            handleError(e);
        });
        orders = [];
        qs.docs.forEach(doc => {
            const data = doc.data();
            const order = new Data.AutoTradeOrder();
            order.autoTradeOrderId = data["autoTradeOrderId"];
            order.date = data["date"];
            order.investor = data["investor"];
            order.investorName = data["investorName"];
            order.wallet = data["wallet"];
            order.isCancelled = data["isCancelled"];
            order.investorProfile = data["investorProfile"];
            order.user = data["user"];
            // console.log(JSON.stringify(data))
            // const orderx: Data.AutoTradeOrder = jsonConvert.deserializeObject(data, Data.AutoTradeStart);
            orders.push(order);
            console.log(`###### order for: ${order.investorName} wallet key: ${order.wallet.split("#")[1]}`);
        });
        shuffleOrders();
        let qsp;
        qsp = await admin
            .firestore()
            .collection("investorProfiles")
            .get()
            .catch(e => {
            console.log(e);
            handleError(e);
        });
        profiles = [];
        qsp.docs.forEach(doc => {
            const data = doc.data();
            const profile = new Data.InvestorProfile();
            profile.profileId = data["profileId"];
            profile.name = data["name"];
            profile.investor = data["investor"];
            profile.maxInvestableAmount = data["maxInvestableAmount"];
            profile.maxInvoiceAmount = data["maxInvoiceAmount"];
            profile.minimumDiscount = data["minimumDiscount"];
            profile.sectors = data["sectors"];
            profile.suppliers = data["suppliers"];
            profile.investorDocRef = data["investorDocRef"];
            profiles.push(profile);
            console.log(`###### profile for: ${profile.name} minimumDiscount: ${profile.minimumDiscount} maxInvestableAmount: ${profile.maxInvestableAmount} maxInvoiceAmount: ${profile.maxInvoiceAmount} `);
            console.log(profile);
        });
        await sendMessageToHeartbeatTopic(`Completed data collection, about to build valid execution units`);
        return offers.length;
    }
    async function buildUnits() {
        console.log("################### buildUnits ######################");
        try {
            units = await Matcher.Matcher.match(profiles, orders, offers);
            if (units.length > 50) {
                handleError("We gotta a big problem! units: " + units.length);
            }
        }
        catch (e) {
            console.log(e);
            handleError("Matching fell down.");
        }
        await sendMessageToHeartbeatTopic(`Matcher has created ${units.length} execution unit`);
        console.log(`++++++++++++++++++++ :: ExecutionUnits ready for processing, execution units: ${units.length}, offers : ${offers.length}`);
        return units;
    }
    function shuffleOrders() {
        console.log(orders);
        for (let i = orders.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [orders[i], orders[j]] = [orders[j], orders[i]];
        }
        console.log("########## shuffled orders ........check above vs below.. wtf?");
        console.log(orders);
    }
    function shuffleOffers() {
        // console.log(offers);
        for (let i = offers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [offers[i], offers[j]] = [offers[j], offers[i]];
        }
        console.log("########## shuffled offers ........");
        // console.log(offers);
    }
    async function writeAutoTradeStart() {
        await admin
            .firestore()
            .collection("autoTradeStarts")
            .doc(startKey)
            .set(summary)
            .catch(e => {
            console.error(e);
            handleError(e);
        });
        console.log(`*********** autoTradeStart written to Firestore startKey: ${startKey}`);
        return 0;
    }
    async function updateAutoTradeStart() {
        summary.dateEnded = new Date().toISOString();
        let mf;
        mf = await admin
            .firestore()
            .collection("autoTradeStarts")
            .doc(startKey)
            .set(summary)
            .catch(e => {
            console.log(e);
            handleError(e);
        });
        console.log("################### updated AutoTradeStart ######################");
        return mf;
    }
    async function sendMessageToHeartbeatTopic(message) {
        const hb = {
            date: new Date().toISOString(),
            message: message
        };
        const mTopic = `heartbeats`;
        const payload = {
            data: {
                messageType: "HEARTBEAT",
                json: JSON.stringify(hb)
            },
            notification: {
                title: "Heartbeat",
                body: "Heartbeat: " + message
            }
        };
        console.log("sending heartbeat to topic: " + mTopic);
        return await admin.messaging().sendToTopic(mTopic, payload);
    }
    function handleError(message) {
        console.log("--- ERROR !!! --- sending error payload: msg:" + message);
        const now = new Date().getTime();
        const elapsed = (now - startTime) / 1000;
        summary.elapsedSeconds = elapsed;
        try {
            const payload = {
                name: "AutoTradeExecution",
                message: message,
                date: new Date().toISOString(),
                summary: summary
            };
            console.log(payload);
            response.status(400).send(payload);
        }
        catch (e) {
            console.log("possible error propagation/cascade here. ignored");
            response
                .status(400)
                .send("Auto Trade fell down and could not get up again!");
        }
    }
});
//# sourceMappingURL=auto_trade_exec.js.map