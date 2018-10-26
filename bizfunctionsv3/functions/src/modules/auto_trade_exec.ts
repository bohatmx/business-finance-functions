// ###########################################################################
// Execute Auto Trading Session - investors matched with offers and bids made
// ###########################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as BFNConstants from "../models/constants";
import * as BFNComms from "./axios-comms";
import * as Data from "../models/data";
import * as Matcher from "./matcher";
import { topic } from "firebase-functions/lib/providers/pubsub";
// const Firestore = require("firestore");
const uuid = require("uuid/v1");
//curl --header "Content-Type: application/json"   --request POST   --data '{"debug": "true"}'   https://us-central1-business-finance-dev.cloudfunctions.net/executeAutoTrade

export const executeAutoTrades = functions
  .runWith({ memory: "512MB", timeoutSeconds: 540 })
  .https.onRequest(async (request, response) => {
    // const firestore = new Firestore();
    // const settings = { /* your settings... */ timestampsInSnapshots: true };
    // firestore.settings(settings);
    if (!request.body) {
      console.log("ERROR - request has no body");
      return response.status(500).send("Request has no body");
    }
    console.log(`##### Incoming debug ${request.body.debug}`);
    const debug = request.body.debug;

    let orders: Data.AutoTradeOrder[] = [];
    let profiles: Data.InvestorProfile[] = [];
    let offers: Data.Offer[] = [];
    let units: Data.ExecutionUnit[] = [];
    const wallets: Data.Wallet[] = [];
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
    let bidCount = 0;

    await startAutoTradeSession();
    return null;

    async function startAutoTradeSession() {
      const date = new Date().toISOString();
      console.log(`### starting AutoTrade Session ########### ${date}`);
      await writeAutoTradeStart();
      const result = await getData();
      if (result > 0) {
        await buildUnits();
        await writeBids();
      }
      console.log(summary);
      return finishAutoTrades();
    }
    async function finishAutoTrades() {
      const now: number = new Date().getTime();
      const elapsed = (now - startTime) / 1000;
      summary.elapsedSeconds = elapsed;
      await updateAutoTradeStart();

      console.log(`######## Auto Trading Session completed; autoTradeStart updated. Done in 
            ${summary.elapsedSeconds} seconds. We are HAPPY, Houston!!`);
      return response.status(200).send(summary);
    }
    async function writeBids() {
      for (const unit of units) {
        await writeBidToBFN(unit);
      }
      console.log(
        `######## validateBids complete. ...closing up! ################`
      );
      return 0;
    }
    async function writeBidToBFN(unit) {
      //get existing invoice bids for this offer
      const colRef = admin.firestore().collection("invoiceOffers");
      let querySnap;
      querySnap = await colRef.where("offerId", "==", unit.offer.offerId).get();
      let docId;
      querySnap.forEach(doc => {
        docId = doc.id;
      });
      const apiSuffix = "MakeInvoiceBid";
      const bidQuerySnap = await admin
        .firestore()
        .collection("invoiceOffers")
        .doc(docId)
        .collection("invoiceBids")
        .get();
      let reserveTotal = 0.0;
      bidQuerySnap.forEach(doc => {
        reserveTotal += doc.data()["reservePercent"];
      });
      if (reserveTotal > 0) {
        console.log(
          `&&&&&&&&& total precent reserved: ${reserveTotal} % from ${
            bidQuerySnap.size
          } existing bids. Offer amt: ${unit.offer.offerAmount}`
        );
      }
      const myReserve = 100.0 - reserveTotal;
      const myAmount = unit.offer.offerAmount * (myReserve / 100);
      const bid = {
        invoiceBidId: uuid(),
        amount: myAmount,
        reservePercent: myReserve,
        autoTradeOrder: `resource:com.oneconnect.biz.AutoTradeOrder#${
          unit.order.autoTradeOrderId
        }`,
        investor: unit.order.investor,
        offer: `resource:com.oneconnect.biz.Offer#${unit.offer.offerId}`,
        investorName: unit.order.investorName,
        wallet: unit.order.wallet,
        date: new Date().toISOString(),
        discountPercent: unit.offer.discountPercent,
        isSettled: false,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      };
      console.log(`++++ bid to be written to BFN: ${JSON.stringify(bid)}`);
      let url;
      if (debug === "true") {
        url = BFNConstants.Constants.DEBUG_URL + apiSuffix;
      } else {
        url = BFNConstants.Constants.RELEASE_URL + apiSuffix;
      }

      const blockchainResponse = await BFNComms.AxiosComms.execute(
        url,
        bid
      ).catch(e => {
        console.log(e);
        handleError(e);
      });
      if (blockchainResponse.status === 200) {
        return await writeBidToFirestore(docId, bid, unit.offer.offerId);
      } else {
        console.log(
          `******** BFN ERROR ########### mresponse.status: ${
            blockchainResponse.status
          }`
        );
        handleError(blockchainResponse);
      }
    }
    async function writeBidToFirestore(docId, bid, offerId) {
      await admin
        .firestore()
        .collection("invoiceOffers")
        .doc(docId)
        .collection("invoiceBids")
        .add(bid)
        .catch(e => {
          console.log(e);
          handleError(e);
        });
      let invRequestSnapshot;
      invRequestSnapshot = await admin
        .firestore()
        .collection("investors")
        .where("participantId", "==", bid.investor.split("#")[1])
        .get();
      const investorRef = invRequestSnapshot.docs[0].ref;
      let xref;
      xref = await investorRef
        .collection("invoiceBids")
        .add(bid)
        .catch(e => {
          console.log(e);
          handleError(e);
        });
      console.log(
        `++++++++ invoiceBid written to investor invoiceBids on Firestore: ${
          bid.investorName
        } for amount: ${bid.amount} ref: ${xref.path}`
      );
      console.log(
        `Auto Trading Session: processed ${bidCount} bids of a possible ${
          units.length
        }, date: ${new Date().toISOString()}`
      );
      summary.totalAmount += bid.amount;
      summary.totalValidBids++;
      await sendMessageToTopic(bid);
      return await closeOfferOnBFN(offerId);
    }
    async function sendMessageToTopic(mdata) {
      const mTopic = `invoiceBids`;
      const payload = {
        data: {
          messageType: "INVOICE_BID",
          json: JSON.stringify(mdata)
        },
        notification: {
          title: "Invoice Bid",
          body:
            "Invoice Bid from " +
            mdata.investorName +
            " amount: " +
            mdata.amount
        }
      };
      if (mdata.supplierFCMToken) {
        console.log(
          "sending invoice bid data to supplier device: " +
            mdata.supplierFCMToken +
            " " +
            JSON.stringify(mdata)
        );
        const devices = [mdata.supplierFCMToken];
        await admin.messaging().sendToDevice(devices, payload);
      }
      console.log("sending invoice bid data to topic: " + mTopic);
      return await admin.messaging().sendToTopic(mTopic, payload);
    }
    async function closeOfferOnBFN(offerId) {
      let url;
      if (debug === "true") {
        url = BFNConstants.Constants.DEBUG_URL + "CloseOffer";
      } else {
        url = BFNConstants.Constants.RELEASE_URL + "CloseOffer";
      }

      const map = new Map();
      map["offerId"] = offerId;

      const blockchainResponse = await BFNComms.AxiosComms.execute(
        url,
        map
      ).catch(e => {
        handleError(e);
      });

      if (blockchainResponse.status === 200) {
        return await closeOfferOnFirestore(offerId);
      } else {
        console.log(`*** BFN ERROR ###status: ${blockchainResponse.status}`);
        handleError(blockchainResponse);
      }
    }
    async function closeOfferOnFirestore(offerId) {
      let mdocID;
      let mData;
      let offerSnapshot;
      offerSnapshot = await admin
        .firestore()
        .collection("invoiceOffers")
        .where("offerId", "==", offerId)
        .get()
        .catch(error => {
          console.log("Error getting Firestore document ");
          console.log(error);
          handleError(error);
        });

      offerSnapshot.forEach(doc => {
        mdocID = doc.id;
        mData = doc.data();
        mData.isOpen = false;
        mData.dateClosed = new Date().toISOString();
      });
      if (mdocID) {
        let m;
        m = await admin
          .firestore()
          .collection("invoiceOffers")
          .doc(mdocID)
          .set(mData)
          .catch(error => {
            console.log("----- Error updating Firestore Offer document ");
            console.log(error);
            handleError(error);
          });
        console.log(
          `################### closeOfferOnFirestore, closed offerId :${offerId}`
        );
        summary.closedOffers++;
        bidCount++;
        return m;
      } else {
        return 0;
      }
    }
    async function getData() {
      console.log("################### getData ######################");
      
      let qso;
      qso = await admin
        .firestore()
        .collection("invoiceOffers")
        .where("isOpen", "==", true)
        .get()
        .catch(e => {
          console.log(e);
          handleError(e);
        });

      summary.totalOffers = qso.docs.length;
      offers = [];
      qso.docs.forEach(doc => {
        const data = doc.data();
        const offer: Data.Offer = new Data.Offer();
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
        offers.push(offer);
        
      });

      if (qso.docs.length === 0) {
        console.log("No open offers found. quitting ...");
        return 0;
      } else {
        console.log("### Open offers found: " + qso.docs.length);
      }
      offers.map(offer => {
        summary.possibleAmount += offer.offerAmount;
      });
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
        const order: Data.AutoTradeOrder = new Data.AutoTradeOrder();
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
        console.log(
          `###### order for: ${order.investorName} wallet key: ${
            order.wallet.split("#")[1]
          }`
        );
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
        const profile: Data.InvestorProfile = new Data.InvestorProfile();
        profile.profileId = data["profileId"];
        profile.name = data["name"];
        profile.investor = data["investor"];
        profile.maxInvestableAmount = data["maxInvestableAmount"];
        profile.maxInvoiceAmount = data["maxInvoiceAmount"];
        profile.minimumDiscount = data["minimumDiscount"];
        profile.sectors = data["sectors"];
        profile.suppliers = data["suppliers"];
        profiles.push(profile);
        console.log(
          `###### profile for: ${profile.name} minimumDiscount: ${
            profile.minimumDiscount
          } maxInvestableAmount: ${
            profile.maxInvestableAmount
          } maxInvoiceAmount: ${profile.maxInvoiceAmount} `
        );
      });

      return offers.length;
    }
    async function buildUnits() {
      console.log("################### buildUnits ######################");
      try {
        units = await Matcher.Matcher.match(profiles, orders, offers);
      } catch (e) {
        console.log(e);
        handleError("Matching fell down.");
      }
      console.log(
        `++++++++++++++++++++ :: ExecutionUnits ready for processing, execution units: ${
          units.length
        }, offers : ${offers.length}`
      );
      return units;
    }
    function shuffleOrders() {
      console.log(orders);
      for (let i = orders.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [orders[i], orders[j]] = [orders[j], orders[i]];
      }
      console.log("########## shuffled orders ........");
      console.log(orders);
    }
    function shuffleOffers() {
      console.log(offers);
      for (let i = offers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [offers[i], offers[j]] = [offers[j], offers[i]];
      }
      console.log("########## shuffled offers ........");
      console.log(offers);
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
      console.log(
        `*********** autoTradeStart written to Firestore startKey: ${startKey}`
      );
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
      console.log(
        "################### updated AutoTradeStart ######################"
      );
      return mf;
    }
    function handleError(message) {
      console.log("--- ERROR !!! --- sending error payload: msg:" + message);
      const now: number = new Date().getTime();
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
      } catch (e) {
        console.log("possible error propagation/cascade here. ignored");
        response
          .status(400)
          .send("Auto Trade fell down and could not get up again!");
      }
    }
  });
