// ######################################################################
// Add Invoice to BFN and Firestore
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as BFNConstants from "../models/constants";
import * as AxiosComms from "./axios-comms";
const uuid = require("uuid/v1");
// const Firestore = require("firestore");

export const makeInvoiceBid = functions.https.onRequest(
  async (request, response) => {
    if (!request.body) {
      console.log("ERROR - request has no body");
      return response.status(400).send("request has no body");
    }
     
    
    try {
      const firestore = admin.firestore();
      const settings = { /* your settings... */ timestampsInSnapshots: true };
      firestore.settings(settings);
      console.log(
        "Firebase settings completed. Should be free of annoying messages from Google"
      );
    } catch (e) {
      console.log(e);
    }


    console.log(`##### Incoming debug ${request.body.debug}`);
    console.log(`##### Incoming data ${JSON.stringify(request.body.data)}`);

    const debug = request.body.debug;
    const data = request.body.data;

    const apiSuffix = "MakeInvoiceBid";

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
      } else {
        url = BFNConstants.Constants.RELEASE_URL + apiSuffix;
      }

      if (!data.invoiceBidId) {
          data["invoiceBidId"] = uuid();
      }
      
      try {
        const mresponse = await AxiosComms.AxiosComms.execute(url, data);
        if (mresponse.status === 200) {
          return writeToFirestore(mresponse.data);
        } else {
          console.log(`** BFN ERROR ## ${mresponse.data}`);
          handleError(mresponse)
        }
      } catch (error) {
        handleError(error);
      }
    }

    async function writeToFirestore(mdata) {
      
      try {
        let mdocID;

        const key = mdata.investor.split("#")[1];
        const snapshot = await admin
          .firestore()
          .collection("investors")
          .where("participantId", "==", key)
          .get()
          .catch(function(error) {
            console.log(error);
            return null;
          });
        snapshot.forEach(doc => {
          mdocID = doc.id;
        });

        let ref1;
        if (mdocID) {
          ref1 = await admin
            .firestore()
            .collection("investors")
            .doc(mdocID)
            .collection("invoiceBids")
            .add(mdata)
            .catch(function(error) {
              console.log(error);
              throw new Error(`MakeInvoiceBid failed in Firestore`);
            });
          console.log(
            `** Data successfully written to Firestore! ${ref1.path}`
          );
        }

        let docID;

        const offerId = mdata.offer.split("#")[1];
        let msnapshot;
         msnapshot = await admin
          .firestore()
          .collection("invoiceOffers")
          .where("offerId", "==", offerId)
          .get()
          .catch(function(error) {
            console.log(error);
            handleError(error)
          });
        msnapshot.forEach(doc => {
          docID = doc.id;
        });

        if (docID) {
          let ref2;
          ref2 = await admin
            .firestore()
            .collection("invoiceOffers")
            .doc(docID)
            .collection("invoiceBids")
            .add(mdata)
            .catch(function(error) {
              console.log(error);
              handleError(error);
            });
          console.log(
            `** Data successfully written to Firestore! ${ref2.path}`
          );
        }
        await checkTotalBids(docID, offerId);
        await sendMessageToTopic(mdata, offerId);

        console.log("Everything seems OK. InvoiceBid done!");
        response.status(200).send(mdata);
      } catch (e) {
        console.log(e);
        handleError(e);
      }
    }
    async function sendMessageToTopic(mdata, offerId) {
      const topic = BFNConstants.Constants.TOPIC_INVOICE_BIDS + offerId
      const topic2 = BFNConstants.Constants.TOPIC_INVOICE_BIDS + 'admin'
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
      console.log("sending invoice bid data to topics: " + topic + " " + topic2);
      await admin.messaging().sendToTopic(topic, payload);
      return await admin.messaging().sendToTopic(topic2, payload);
    }
    async function checkTotalBids(offerDocID, offerId) {
      console.log(
        `############ checkTotalBids ......... offerDocID: ${offerDocID}`
      );

      const msnapshot = await admin
        .firestore()
        .collection("invoiceOffers")
        .doc(offerDocID)
        .collection("invoiceBids")
        .get()
        .catch(function(error) {
          console.log(error);
          handleError(error);
          return null;
        });
      let total: number = 0.0;
      try {
        msnapshot.forEach(doc => {
          const reservePercent = doc.data()["reservePercent"];
          const mReserve = parseFloat(reservePercent);
          total += mReserve;
        });
        if (total >= 100.0) {
          console.log(`######## closing offer, reservePercent == ${total} %`);
          // Send a POST request to BFN
          let url;
          if (debug) {
            url = BFNConstants.Constants.DEBUG_FUNCTIONS_URL + "closeOffer";
          } else {
            url = BFNConstants.Constants.RELEASE_FUNCTIONS_URL + "closeOffer";
          }
          const map = new Map();
          map["offerId"] = offerId;
          map["debug"] = debug;
          try {
            const mresponse = await AxiosComms.AxiosComms.execute(url, map);
            console.log(
              `####### Functions response status: ##########: ${
                mresponse.status
              }`
            );
            if (mresponse.status === 200) {
              console.log(
                "************* Offer closed by function call from this function"
              );
              return null;
            } else {
              console.log("******** BFN ERROR ###########");
              handleError(mresponse);
            }
          } catch (error) {
            console.log("------ axios: BFN blockchain problem -----");
            handleError(error);
          }
        } else {
          console.log(`# NOT closing offer, reservePercent == ${total} %`);
          return null;
        }
      } catch (e) {
        console.log("-- Firestore: Check Totals PROBLEM -----");
        console.log(e);
        handleError(e);
      }
      return null;
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
      } catch (e) {
        console.log("possible error propagation/cascade here. ignored");
      }
    }
  }
);
