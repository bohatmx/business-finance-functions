// ###########################################################################
// Execute Auto Trading Session - investors matched with offers and bids made
// ###########################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as BFNConstants from "../models/constants";
import * as BFNComms from "./axios-comms";
import * as Data from "../models/data";
import { topic } from "firebase-functions/lib/providers/pubsub";
// const Firestore = require("firestore");
const uuid = require("uuid/v1");
//curl --header "Content-Type: application/json"   --request POST   --data '{"debug": "true"}'   https://us-central1-business-finance-dev.cloudfunctions.net/executeAutoTrade

export const executeAutoTrades = functions
  .runWith({ memory: "256MB", timeoutSeconds: 480 })
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
        buildUnits();
        await validateBids();
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
    async function validateBids() {
      for (const unit of units) {
        await validateBid(unit);
      }
      console.log(
        `######## validateBids complete. ...closing up! ################`
      );
      return 0;
    }
    async function isInvestorTotalOK(profile, offerAmount) {
      let querySnap;
      querySnap = await admin
        .firestore()
        .collection("investors")
        .where("participantId", "==", profile.investor.split("#")[1])
        .get();
      if (querySnap.docs.length > 0) {
        const investorRef = querySnap.docs[0].ref;
        let bidQuerySnap;
        bidQuerySnap = await investorRef
          .collection("invoiceBids")
          .where("isSettled", "==", false)
          .get();
        if (bidQuerySnap.docs.length === 0) {
          return true;
        } else {
          let total = 0.0;
          bidQuerySnap.forEach(doc => {
            const bid = doc.data();
            total += bid.amount;
          });
          total += offerAmount;
          if (
            total < profile.maxInvestableAmount ||
            total === profile.maxInvestableAmount
          ) {
            return true;
          } else {
            console.log(
              `Total unsettled bids: ${total} are more than the maxInvestableAmount: ${
                profile.maxInvestableAmount
              }, - DECLINED. name: ${profile.name}`
            );
            return false;
          }
        }
      }
      return true;
    }
    function isWithinSupplierList(profile, offer) {
      if (!offer.suppliers) {
        return true;
      }
      let isSupplierOK = false;
      profile.suppliers.forEach(supplier => {
        if (
          offer.supplier ===
          `resource:com.oneconnect.biz.Supplier#${supplier.participantId}`
        ) {
          isSupplierOK = true;
        }
      });

      return isSupplierOK;
    }
    function isWithinSectorList(profile, offer) {
      if (!offer.sectors) {
        return true;
      }
      let isSectorOK = false;
      profile.sectors.forEach(sector => {
        if (
          offer.sector ===
          `resource:com.oneconnect.biz.Sector#${sector.participantId}`
        ) {
          isSectorOK = true;
        }
      });

      return isSectorOK;
    }
    async function isAccountBalanceOK(profile) {
      let wallet;
      wallets.forEach(w => {
        if (profile.investor === w.investor) {
          wallet = w;
        }
      });
      //TODO - connect to Stellar/WorldWire here
      return true;
    }
    async function validateBid(unit) {
      let validInvoiceAmount = false;
      let validSector = false;
      let validSupplier = false;
      let validTotal = false;
      let validMinimumDiscount = false;
      let validAccountBalance = false;

      validTotal = await isInvestorTotalOK(
        unit.profile,
        unit.offer.offerAmount
      );
      validSector = isWithinSectorList(unit.profile, unit.offer);
      validSupplier = isWithinSupplierList(unit.profile, unit.offer);
      validAccountBalance = await isAccountBalanceOK(unit.profile);

      if (
        unit.offer.discountPercent > unit.profile.minimumDiscount ||
        unit.offer.discountPercent === unit.profile.minimumDiscount
      ) {
        validMinimumDiscount = true;
      } else {
        console.log(
          `-- validMinimumDiscount check failed. discount offered: ${
            unit.offer.discountPercent
          }% minimumDiscount required: ${unit.profile.minimumDiscount}% - ${unit.profile.name}`
        );
      }
      if (
        unit.offer.offerAmount < unit.profile.maxInvoiceAmount ||
        unit.offer.offerAmount === unit.profile.maxInvoiceAmount
      ) {
        validInvoiceAmount = true;
      } else {
        const invalid = {
          'date': new Date().toISOString(),
          'offer': JSON.stringify(unit.offer),
          'profile': JSON.stringify(unit.profile),        
          'validTotal': validTotal,
          'validSector': validSector,
          'validSupplier': validSupplier,
          'validInvoiceAmount': validInvoiceAmount,
          'validAccountBalance': validAccountBalance,
          'validMinimumDiscount': validMinimumDiscount,
          
        }
        await admin.firestore().collection('invalidAutoTrades').add(invalid).catch(e => {
          console.log(e);
        })
        await sendInvalidToTopic(invalid)
        console.log(
          `-- validInvoiceAmount check failed. offered: ${
            unit.offer.offerAmount
          } max limit: ${unit.profile.maxInvoiceAmount} - ${unit.profile.name}`
        );
      }

      //check validity of ALL indicators
      if (
        validInvoiceAmount &&
        validMinimumDiscount &&
        validSector &&
        validSupplier &&
        validTotal &&
        validAccountBalance
      ) {
        return await writeBidToBFN(unit);
      } else {
        //this offer has not met all validation requirements
        summary.totalInvalidBids++;
        return 0;
      }
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
        bidCount++
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
    async function sendInvalidToTopic(invalid) {
      const mTopic = `invalidAutoTrades`;
      const payload = {
        data: {
          messageType: "INVALID_TRADE",
          json: JSON.stringify(invalid)
        },
        notification: {
          title: "Invalid Trade",
          body:
            "Invalid Bid on Offer " +
            invalid.profile.name +
            " amount: " +
            invalid.offer.offerAmount
        }
      };
      console.log("sending invalid bid data to topic: " + mTopic);
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
    async function getWallets() {
      let qs;
      qs = await admin
        .firestore()
        .collection("wallets")
        .get();
      qs.docs.forEach(doc => {
        const data = doc.data();
        const wallet: Data.Wallet = new Data.Wallet();
        wallet.stellarPublicKey = data["stellarPublicKey"];
        wallet.investor = data["investor"];
        wallets.push(wallet);
      });
      console.log("###### get wallets: " + wallets.length + " found");
    }
    async function getData() {
      console.log("################### getData ######################");
      await getWallets();
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
        console.log(
          `###### offer by: ${offer.supplierName} offerAmount: ${
            offer.offerAmount
          } endTime: ${offer.endTime}`
        );
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
    function buildUnits() {
      console.log("################### buildUnits ######################");
      let orderIndex = 0;
      let offerIndex = 0;
      units = [];
      do {
        const unit = new Data.ExecutionUnit();
        unit.offer = offers[offerIndex];
        if (orderIndex === orders.length) {
          orderIndex = 0;
        }
        unit.order = orders[orderIndex];
        profiles.forEach(p => {
          if (p.investor === unit.order.investor) {
            unit.profile = p;
          }
        });
        orderIndex++;
        units.push(unit);
        offerIndex++;
      } while (offerIndex < offers.length);

      console.log(
        `++++++++++++++++++++ :: ExecutionUnits ready for processing, execution units: ${
          units.length
        }, offers assigned: ${offers.length}`
      );
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
