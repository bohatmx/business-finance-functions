// ######################################################################
// Add customer to BFN and Firestore
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as BFNConstants from "../models/constants";
import * as AxiosComms from "./axios-comms";
import * as Helper from "./wallet-helper";
const uuid = require("uuid/v1");

export const addData = functions
  .runWith({ memory: "256MB", timeoutSeconds: 120 })
  .https.onRequest(async (request, response) => {
    if (!request.body) {
      console.log("ERROR - request has no body");
      return response.status(400).send("request has no body");
    }
    if (!request.body.apiSuffix) {
      console.log("ERROR - request needs an apiSuffix");
      return response.status(400).send("request has no apiSuffix");
    }
    console.log(`##### Incoming debug ${request.body.debug}`);
    console.log(`##### Incoming collectionName ${request.body.collectionName}`);
    console.log(`##### Incoming apiSuffix ${request.body.apiSuffix}`);
    console.log(`##### Incoming data ${JSON.stringify(request.body.data)}`);

    const debug = request.body.debug;
    const collectionName = request.body.collectionName;
    const apiSuffix = request.body.apiSuffix;
    const data = request.body.data;
    const user = request.body.user;
    const sourceSeed = request.body.sourceSeed;

    const ref = await writeToBFN();
    let url;
    if (ref) {
      response.status(200).send("OK");
    } else {
      response.status(400).send("addData function failed");
    }

    return null;
    //add customer to bfn blockchain
    async function writeToBFN() {
      if (debug) {
        url = BFNConstants.Constants.DEBUG_URL + apiSuffix;
      } else {
        url = BFNConstants.Constants.RELEASE_URL + apiSuffix;
      }
      console.log("####### --- writing to BFN: ---> " + url);
      // Send a POST request to BFN
      try {
        const mresponse = await AxiosComms.AxiosComms.execute(url, data);
        console.log(
          `####### BFN response status: ##########: ${mresponse.status}`
        );
        if (mresponse.status === 200) {
          return writeToFirestore(mresponse.data);
        } else {
          console.log("******** BFN ERROR ###########");
          return null;
        }
      } catch (error) {
        console.log(
          "--------------- axios: BFN blockchain problem -----------------"
        );
        console.log(error);
        return null;
      }
    }

    async function writeToFirestore(mdata) {
      console.log(
        "### writeToFirestore ###################### data:\n " +
          JSON.stringify(mdata)
      );
      try {
        const reference = await admin
          .firestore()
          .collection(collectionName)
          .add(mdata)
          .catch(function(error) {
            console.log("Error writing Firestore document ");
            console.log(error);
            return null;
          });
        console.log(
          `********** Data successfully written to Firestore! ${reference.path}`
        );
        if (
          apiSuffix === "GovtEntity" ||
          apiSuffix === "Supplier" ||
          apiSuffix === "Investor"
        ) {
          await addUser();
          const result = await getWallet();
          console.log(`wallet creation result: ${result}`);
        }
        return reference;
      } catch (e) {
        console.log("##### ERROR, probably JSON data format related");
        console.log(e);
        throw new Error("Unable to add user or wallet to Firestore");
      }
    }
    async function addUser() {
      if (!user) {
        console.log("ERROR - user object not found");
        throw new Error("ERROR - user object not found in request data");
      }
      console.log(`..... adding Admin User: ${user}`);
      if (debug) {
        url = BFNConstants.Constants.DEBUG_URL + "User";
      } else {
        url = BFNConstants.Constants.RELEASE_URL + "User";
      }
      console.log("####### --- writing user to BFN: ---> " + url);
      try {
        const mresponse = await AxiosComms.AxiosComms.execute(url, data);
        console.log(`## BFN response status: ###: ${mresponse.status}`);
        if (mresponse.status === 200) {
          const zref = await admin
            .firestore()
            .collection("users")
            .add(mresponse.data)
            .catch(e => {
              console.log(e);
              throw new Error("Unable to add user to Firestore");
            });
          console.log(zref);
          return zref;
        } else {
          console.log("******** BFN ERROR ###########");
          throw new Error("Failed to add user");
        }
      } catch (error) {
        console.log(
          "--------------- axios: BFN blockchain problem -----------------"
        );
        console.log(error);
        throw new Error(`Failed to add user: ${error}`);
      }
    }
    async function getWallet() {
      console.log("... adding Stellar wallet in helper function");
      if (!sourceSeed) {
        throw new Error("sourceSeed not found for wallet creation");
      }
      let result;
      try {
        result = Helper.createWallet(sourceSeed, data.participantId, apiSuffix, debug);
        console.log(`++++ wallet creation result: ${result}`);
      } catch (e) {
        console.log(e);
      }
      return result;
    }
  });
