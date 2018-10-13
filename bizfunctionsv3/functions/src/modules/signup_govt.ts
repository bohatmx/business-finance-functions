// ######################################################################
// Add DeliveryNote to BFN and Firestore
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as BFNConstants from "../models/constants";
import * as AxiosComms from "./axios-comms";
const uuid = require("uuid/v1");

export const signUpCustomer = functions.https.onRequest(
  async (request, response) => {
    if (!request.body) {
      console.log("ERROR - request has no body");
      return response.status(400).send("request has no body");
    }

    console.log(`##### Incoming debug ${request.body.debug}`);
    console.log(`##### Incoming data ${JSON.stringify(request.body.data)}`);

    const debug = request.body.debug;
    const data = request.body.data;

    const apiSuffix = "GovtEntity";

    const ref = await writeToBFN();
    if (ref) {
      response.status(200).send('Customer signed in');
    } else {
      response.sendStatus(400);
    }

    return null;

    //add customer to bfn blockchain
    async function writeToBFN() {
      let url;
      if (debug) {
        url = BFNConstants.Constants.DEBUG_URL + apiSuffix;
      } else {
        url = BFNConstants.Constants.RELEASE_URL + apiSuffix;
      }

      console.log("####### --- writing Del Note to BFN: ---> " + url);
      data["participantId"] = uuid();
      // Send a POST request to BFN
      try {
        const qs = await admin
          .firestore()
          .collection("govtEntities")
          .where("name", "==", data.name)
          .where("country", "==", data.country)
          .get()
          .catch(e => {
            console.log(`SignUp.signUpGovtEntity ERROR ${e}`);
            throw new Error("Unable to check duplicate customer");
          });
        if (!qs.empty) {
            throw new Error('Customer already exists')
        }
        const mresponse = await AxiosComms.AxiosComms.execute(url, data);
        console.log(
          `####### BFN response status: ##########: ${mresponse.status}`
        );
        if (mresponse.status === 200) {
          return await writeToFirestore(mresponse.data);
        } else {
          console.log("******** BFN ERROR ###########");
          throw new Error(`GovtEntity failed: ${mresponse.status}`);
        }
      } catch (error) {
        console.log(
          "--------------- axios: BFN blockchain problem -----------------"
        );
        console.log(error);
        throw new Error(`GovtEntity failed: ${error}`);
      }
      return 'OK';
    }

    async function writeToFirestore(mdata) {
      console.log(
        "################### writeToFirestore, Customer data from BFN:\n " +
          JSON.stringify(mdata)
      );
      // Add a new customer to Firestore collection
      try {
          const uref = await admin.firestore().collection('govtEntities').add(mdata)
          .catch(err => {
              throw new Error(`GovtEntity failed: ${err}`);
          })
          console.log(uref)
          //create wallet ....
      } catch (e) {
        console.log("##### ERROR, probably JSON data format related");
        console.log(e);
        throw new Error(`GovtEntity failed: ${e}`);
      }
    }
  }
);
