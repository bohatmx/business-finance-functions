// ######################################################################
// Add basic data to BFN and Firestore
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as BFNConstants from "../models/constants";
import * as AxiosComms from "./axios-comms";
// const Firestore = require("firestore");
export const addData = functions
  .runWith({ memory: "256MB", timeoutSeconds: 60 })
  .https.onRequest(async (request, response) => {
    // const firestore = new Firestore();
    // const settings = { /* your settings... */ timestampsInSnapshots: true };
    // firestore.settings(settings);
    if (!request.body) {
      console.log("ERROR - request has no body");
      return response.status(400).send("request has no body");
    }
    if (!request.body.apiSuffix) {
      console.log("ERROR - request needs an apiSuffix");
      return response.status(400).send("request has no apiSuffix");
    }
    console.log(`##### Incoming debug: ${request.body.debug}`);
    console.log(
      `##### Incoming collectionName: ${request.body.collectionName}`
    );
    console.log(`##### Incoming apiSuffix: ${request.body.apiSuffix}`);
    console.log(`##### Incoming data: ${JSON.stringify(request.body.data)}`);

    const debug = request.body.debug;
    const collectionName = request.body.collectionName;
    const apiSuffix = request.body.apiSuffix;
    const data = request.body.data;

    const ref = await writeToBFN();
    const result = {
      reference: ref,
      date: new Date().toISOString()
    };

    console.log(result);
    console.log(
      "#### Everything seems A-OK. Sending result and status code 200"
    );
    response.status(200).send(result);

    return null;
    //add customer to bfn blockchain
    async function writeToBFN() {
      console.log("####### --- entering writeToBFN() .....");
      let url;
      console.log("####### --- writing to BFN: ---> " + url);
      // Send a POST request to BFN
      try {
        if (debug) {
          url = BFNConstants.Constants.DEBUG_URL + apiSuffix;
        } else {
          url = BFNConstants.Constants.RELEASE_URL + apiSuffix;
        }
        const mresponse = await AxiosComms.AxiosComms.execute(url, data);
        if (mresponse.status === 200) {
          return writeToFirestore(mresponse.data);
        } else {
          console.log(
            "******** BFN ERROR ########### status:" + mresponse.status
          );
          handleError("BFN failed to add data");
        }
      } catch (error) {
        console.log(
          "--------------- axios: BFN blockchain problem -----------------"
        );
        console.log(error);
        handleError("BFN failed to add data");
      }
    }
    async function writeToFirestore(mdata) {
      console.log(
        "### writeToFirestore ###################### data:\n " +
          JSON.stringify(mdata)
      );
      mdata.intDate = new Date().getUTCMilliseconds()
      mdata.date = new Date().toUTCString()
      try {
        const reference = await admin
          .firestore()
          .collection(collectionName)
          .add(mdata)
          .catch(function(error) {
            console.log("Error writing Firestore document ");
            console.log(error);
            handleError("Error writing Firestore document");
          });
        console.log(
          `********** Data successfully written to Firestore! ${reference}`
        );

        return reference;
      } catch (e) {
        console.log(e);
        handleError(`Unable to add data to Firestore: ${e}`);
      }
    }
    function handleError(message) {
      console.log("-------- ERROR ------ sending " + message);
      try {
        const payload = {
          message: message,
          data: request.body.data,
          apiSuffix: request.body.apiSuffix,
          date: new Date().toISOString()
        };
        console.log(payload);
        response.status(400).send(payload);
      } catch (e) {
        response.status(400).send(message);
      }
    }
  });
