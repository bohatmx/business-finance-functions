// ###########################################################################
// Execute Auto Trading Session - investors matched with offers and bids
// ###########################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as Data from "../models/data";
import * as Matcher from "./matcher";
import { InvoiceBidHelper } from "./invoice-bid-helper";
const uuid = require("uuid/v1");
const cors = require("cors")({ origin: true });
//curl --header "Content-Type: application/json"   --request POST   --data '{"debug": "true"}'   https://us-central1-business-finance-dev.cloudfunctions.net/executeAutoTrade

export const executeAutoTrades = functions
  .runWith({ memory: "512MB", timeoutSeconds: 540 })
  .https.onRequest(async (request, response) => {
    const debug = request.body.debug;
    let orders: Data.AutoTradeOrder[] = [];
    let profiles: Data.InvestorProfile[] = [];
    let offers: Data.Offer[] = [];
    let units: Data.ExecutionUnit[] = [];
    const autoTradeStart = {
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
    const fs = admin.firestore();
    //enable CORS 
    cors(request, response, async () => {
      console.log("######## wrapped everything in cors");
      if (!request.body) {
        console.log("ERROR - request has no body");
        return response.status(500).send("Request has no body");
      }
      try {
        const firestore = admin.firestore();
        const settings = { /* your settings... */ timestampsInSnapshots: true };
        firestore.settings(settings);
      } catch (e) {}
      console.log(`##### Incoming data ${request.body}`);
      await sendMessageToHeartbeatTopic(
        `AutoTrade Session started: ${new Date().toISOString()}`
      );
      await startAutoTradeSession();
      return null;
    });

    async function startAutoTradeSession() {
      const date = new Date().toISOString();
      console.log(`### starting AutoTrade Session ########### ${date}`);
      await writeAutoTradeStart();
      const result = await getData();
      if (result > 0) {
        await buildUnits();
        units.map(unit => {
          autoTradeStart.possibleAmount += unit.offer.offerAmount;
        });
        await sendMessageToHeartbeatTopic(
          "Preparing to start writing bids to BFN"
        );
        await writeBids();
      }
      console.log(autoTradeStart);
      return finishAutoTrades();
    }
    async function finishAutoTrades() {
      const now: number = new Date().getTime();
      const elapsed = (now - startTime) / 1000;
      autoTradeStart.elapsedSeconds = elapsed;
      await updateAutoTradeStart();

      console.log(`######## Auto Trading Session completed; autoTradeStart updated. Done in 
            ${autoTradeStart.elapsedSeconds} seconds. We are HAPPY, Houston!!`);
      await sendMessageToHeartbeatTopic(
        `AutoTrade Session complete, elapsed: ${
          autoTradeStart.elapsedSeconds
        } seconds`
      );
      return response.status(200).send(autoTradeStart);
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
      if (!unit.offer.documentReference) {
        console.log(`Offer has no documentReference. Bailing out!`);
        throw new Error(`Offer has no documentReference. Bailing out!`);
      }
      console.log(`offer document ref: ${unit.offer.documentReference}`);
      try {
        //get existing invoice bids for this offer
        const bidQuerySnap = await fs
          .collection("invoiceOffers")
          .doc(unit.offer.documentReference)
          .collection("invoiceBids")
          .get();

        let reserveTotal = 0.0;
        bidQuerySnap.docs.forEach(doc => {
          reserveTotal += doc.data()["reservePercent"];
        });
        if (reserveTotal > 0) {
          console.log(
            `&&&&&&&&& total percent reserved: ${reserveTotal} % from ${
              bidQuerySnap.size
            } existing bids. Offer amt: ${unit.offer.offerAmount}`
          );
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
          autoTradeOrder: `resource:com.oneconnect.biz.AutoTradeOrder#${
            unit.order.autoTradeOrderId
          }`,
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
          offerDocRef: unit.offer.documentReference,
          supplierDocRef: unit.offer.supplierDocumentRef,
          startTime: new Date().toISOString(),
          endTime: mdate.toISOString()
        };
        console.log(unit.offer);
        console.log(`++++ bid to be written to BFN: ${JSON.stringify(bid)}`);
        if (!bid.offerDocRef) {
          console.log("####### SOS SOS abandoning ship! offerDocRef is null");
          throw new Error(
            `Houston, stubborn error - offerDocRef is always NULL: ${
              bid.offerDocRef
            }`
          );
        }
        await InvoiceBidHelper.writeInvoiceBidToBFNandFirestore(bid, debug);
        autoTradeStart.totalValidBids++;
      } catch (e) {
        console.log(e);
        throw e;
      }
    }

    async function getData() {
      console.log("################### getData ######################");
      await sendMessageToHeartbeatTopic("Collecting auto trade base data");
      let qso;
      qso = await fs
        .collection("invoiceOffers")
        .where("isOpen", "==", true)
        .where("endTime", ">", new Date().toISOString())
        .orderBy("endTime")
        .get()
        .catch(e => {
          console.log(e);
          throw e;
        });
      console.log(`###### open offers found: ${qso.docs.length}`);
      autoTradeStart.totalOffers = qso.docs.length;
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
        offer.documentReference = data["documentReference"];

        if (!data["customer"]) {
          throw new Error(
            `##### ERROR - customer is NULL. you have to be kidding! ${
              doc.ref.path
            }`
          );
        }
        offer.customer = data["customer"];
        offers.push(offer);
      });

      if (qso.docs.length === 0) {
        console.log("No open offers found. quitting ...");
        return 0;
      } else {
        console.log("### Open offers found: " + qso.docs.length);
      }

      let qs;
      qs = await fs
        .collection("autoTradeOrders")
        .where("isCancelled", "==", false)
        .get()
        .catch(e => {
          console.log(e);
          throw e;
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
      qsp = await fs
        .collection("investorProfiles")
        .get()
        .catch(e => {
          console.log(e);
          throw e;
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
        profile.investorDocRef = data["investorDocRef"];
        profiles.push(profile);
        console.log(
          `###### profile for: ${profile.name} minimumDiscount: ${
            profile.minimumDiscount
          } maxInvestableAmount: ${
            profile.maxInvestableAmount
          } maxInvoiceAmount: ${profile.maxInvoiceAmount} `
        );
        console.log(profile);
      });
      await sendMessageToHeartbeatTopic(
        `Completed data collection, about to build valid execution units`
      );
      return offers.length;
    }
    async function buildUnits() {
      console.log("################### buildUnits ######################");
      try {
        units = await Matcher.Matcher.match(profiles, orders, offers);
      } catch (e) {
        console.log(e);
        throw new Error(`Matching fell down. ${e}`);
      }
      await sendMessageToHeartbeatTopic(
        `Matcher has created ${units.length} execution units. Ready to rumble!`
      );
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
      console.log(
        "########## shuffled orders ........check above vs below.. wtf?"
      );
      console.log(orders);
    }

    async function writeAutoTradeStart() {
      await fs
        .collection("autoTradeStarts")
        .doc(startKey)
        .set(autoTradeStart)
        .catch(e => {
          console.error(e);
          throw e;
        });
      console.log(
        `*********** autoTradeStart written to Firestore startKey: ${startKey}`
      );
      return 0;
    }
    async function updateAutoTradeStart() {
      autoTradeStart.dateEnded = new Date().toISOString();
      let t = 0.0;
      units.forEach(u => {
        t += u.offer.offerAmount;
      });
      autoTradeStart.totalAmount = t;
      let mf;
      mf = await fs
        .collection("autoTradeStarts")
        .doc(startKey)
        .set(autoTradeStart)
        .catch(e => {
          console.log(e);
          throw e;
        });
      console.log(
        "################### updated AutoTradeStart ######################"
      );
      return mf;
    }
    async function sendMessageToHeartbeatTopic(message: string) {
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
  });
