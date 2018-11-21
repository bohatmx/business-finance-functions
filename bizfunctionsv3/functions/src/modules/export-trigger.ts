// ######################################################################
// Triggered by record added to firestore. export data
// ######################################################################
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { firestoreExport } from "node-firestore-import-export";
//curl --header "Content-Type: application/json"   --request POST   --data '{"debug": "true","path":"investors"}'   https://us-central1-business-finance-dev.cloudfunctions.net/exportData

export const exportData = functions
  .runWith({ memory: "1GB", timeoutSeconds: 540 })
  .https.onRequest(async (request, response) => {
    try {
      const firestore = admin.firestore();
      const settings = { /* your settings... */ timestampsInSnapshots: true };
      firestore.settings(settings);
      console.log(
        "Firebase settings completed. Should be free of annoying messages from Google"
      );
    } catch (e) {
      console.log("just Google letting us know about shit in Firestore");
    }
    let path = request.body.path;
    if (!path) {
      path = "invoiceOffers";
    }

    const result = {
      log: [],
      data: null
    };

    try {
      await testOfferQuery();
      if (request.body.path) {
        console.log(`Will be exporting data from ${path}`);
        await exportFirestoreData();
      }
    } catch (e) {
      console.log(e);
      response.status(400).send("Exception during data export: " + e);
    }

    return null;

    async function exportFirestoreData() {
      console.log("Exporting data from Firestore " + path);
      const start = new Date().getTime();
      const collectionRef = admin.firestore().collection(path);
      try {
        firestoreExport(collectionRef).then(data => {
          result.log.push(`starting data export: ${new Date().toISOString()}`);
          const end = new Date().getTime();
          const msg = `data exported, elapsed ${end - start} milliseconds`;
          result.log.push(msg);
          result.data = data;
          console.log(msg);
          response.status(200).send("\n\n" + result);
        });
      } catch (e) {
        console.log(e);
        response.status(400).send("Exception during data export: " + e);
      }
    }
    async function testOfferQuery() {
      console.log("Testing Offer query. Something weird going on!");
      result.log.push(`starting test queries: ${new Date().toISOString()}`);
      const start = new Date().getTime();
      let qs1;
      qs1 = await admin
        .firestore()
        .collection("invoiceOffers")
        .get();
      const end1 = new Date().getTime();
      const msg1 = `offers query, no conditions, found ${
        qs1.docs.length
      } elapsed ${end1 - start} milliseconds`;

      result.log.push(msg1);
      console.log(msg1);
      //
      let qs2;
      qs2 = await admin
        .firestore()
        .collection("invoiceOffers")
        .limit(100)
        .get();
      const end2 = new Date().getTime();
      const msg2 = `offers query, limit = 100, found ${
        qs2.docs.length
      } elapsed ${end2 - end1} milliseconds`;
      result.log.push(msg2);
      console.log(msg2);

      let qs3;
      qs3 = await admin
        .firestore()
        .collection("invoiceOffers")
        .where("isOpen", "==", true)
        .limit(100)
        .get();
      const end3 = new Date().getTime();
      const msg3 = `offers query, limit = 100, where isOpen = true, found ${
        qs3.docs.length
      } elapsed ${end3 - end2} milliseconds`;
      result.log.push(msg3);
      console.log(msg3);

      let qs4;
      qs4 = await admin
        .firestore()
        .collection("invoiceOffers")
        .where("isOpen", "==", true)
        .where("endTime", ">", new Date().toISOString())
        .limit(100)
        .get();
      const end4 = new Date().getTime();
      const msg4 = `offers query, limit = 100, where isOpen = true, where endTime = now, found ${
        qs4.docs.length
      } elapsed ${end4 - end3} milliseconds`;
      result.log.push(msg4);
      console.log(msg4);

      // ############################

      let end5 = new Date().getTime();
      try {
        let qs5;
        qs5 = await admin
          .firestore()
          .collection("invoiceOffers")
          .where("isOpen", "==", true)
          .where("endTime", ">", new Date().toISOString())
          .get();
        end5 = new Date().getTime();
        const msg5 = `offers query, where isOpen = true, where endTime = now, found ${
          qs5.docs.length
        } elapsed ${end5 - end4} milliseconds`;
        result.log.push(msg5);
        console.log(msg5);
      } catch (e) {
        console.log(e);
      }
      let end6 = new Date().getTime();
      try {
        let qs6;
        qs6 = await admin
          .firestore()
          .collection("invoiceOffers")
          .where("endTime", ">", new Date().toISOString())
          .get();
        end6 = new Date().getTime();
        const msg6 = `offers query, where endTime = now, found ${
          qs6.docs.length
        } elapsed ${end6 - end5} milliseconds`;
        result.log.push(msg6);
        console.log(msg6);
      } catch (e) {
        console.log(e);
      }
      let end7 = new Date().getTime();
      try {
        let qs7;
        qs7 = await admin
          .firestore()
          .collection("invoiceOffers")
          .where("isOpen", "==", true)
          .get();
        end7 = new Date().getTime();
        const msg7 = `offers query, where isOpen = true, found ${
          qs7.docs.length
        } elapsed ${end7 - end6} milliseconds`;
        result.log.push(msg7);
        console.log(msg7);
      } catch (e) {
        console.log(e);
      }
      let end8 = new Date().getTime();
      try {
        let qs8;
        qs8 = await admin
          .firestore()
          .collection("invoiceOffers")
          .where("isOpen", "==", false)
          .get();
        end8 = new Date().getTime();
        const msg8 = `offers query, where isOpen = false, found ${
          qs8.docs.length
        } elapsed ${end8 - end7} milliseconds`;
        result.log.push(msg8);
        console.log(msg8);
        result.log.push(`completed test queries: ${new Date().toISOString()}`);
      } catch (e) {
        console.log(e);
      }
    }
  });
