// ######################################################################
// Add basic data to BFN and Firestore
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as BFNConstants from "../models/constants";
import * as AxiosComms from "./axios-comms";

export const addData = functions
  .runWith({ memory: "256MB", timeoutSeconds: 60 })
  .https.onRequest(async (request, response) => {
    
    
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

    if (!request.body) {
      console.log("ERROR - request has no body");
      return response.status(400).send("request has no body");
    }
    if (!request.body.functionName) {
      console.log("ERROR - request needs an functionName");
      return response.status(400).send("request has no functionName");
    }
    console.log(`##### Incoming debug: ${request.body.debug}`);
    console.log(
      `##### Incoming collectionName: ${request.body.collectionName}`
    );
    console.log(`##### Incoming functionName: ${request.body.functionName}`);
    console.log(`##### Incoming data: ${JSON.stringify(request.body.data)}`);

    const debug = request.body.debug;
    const collectionName = request.body.collectionName;
    const functionName = request.body.functionName;
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
      // Send a POST request to BFN
      try {
        
        const mresponse = await AxiosComms.AxiosComms.executeTransaction(functionName, data);
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
      mdata.intDate = new Date().getTime()
      mdata.date = new Date().toISOString()
      try {
        let reference;
         reference = await admin
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
        mdata.documentReference = reference.path.split('#')(1);
        await reference.set(mdata);
        console.log('DocumentReference updated: ', mdata.documentReference)
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
          functionName: request.body.functionName,
          date: new Date().toISOString()
        };
        console.log(payload);
        response.status(400).send(payload);
      } catch (e) {
        response.status(400).send(message);
      }
    }
  });
