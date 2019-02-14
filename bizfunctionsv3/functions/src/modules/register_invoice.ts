// ######################################################################
// Add Invoice to BFN and Firestore
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as BFNConstants from "../models/constants";
import * as AxiosComms from "./axios-comms";
import * as InvoiceUpdate from "../modules/update-invoice-with-acceptance";
const uuid = require("uuid/v1");

export const registerInvoice = functions.https.onRequest(
  async (request, response) => {
    console.log(`##### Incoming debug ${request.body.debug}`);
    console.log(`##### Incoming data ${JSON.stringify(request.body.data)}`);
    const fs = admin.firestore()
    try {
      const settings = { /* your settings... */ timestampsInSnapshots: true };
      fs.settings(settings);
    } catch (e) {
      console.log(e);
    }

    const debug = request.body.debug;
    const data = request.body.data;
    const functionName = "addInvoice";
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
     
      try {
        data.date = new Date().toISOString();
        const mresponse = await AxiosComms.AxiosComms.executeTransaction(functionName, data);
        if (mresponse.status === 200) {
          return writeToFirestore(mresponse.data);
        } else {
          console.log("******** BFN ERROR ### status: " + mresponse.status);
          throw new Error(mresponse.data);
        }
      } catch (error) {
        console.log(error);
        throw error;
      }
    }
    async function writeToFirestore(mdata) {
      mdata.intDate = new Date().getTime();
      mdata.date = new Date().toISOString();
      try {
        const mdocID = mdata.govtDocumentRef;

        let ref1;
        ref1 = await fs
          .collection("govtEntities")
          .doc(mdocID)
          .collection("invoices")
          .add(mdata);

        console.log(`*** Data successfully written to Firestore! ${ref1.path}`);

        const docID = mdata.supplierDocumentRef;
        let ref3;
        if (docID) {
          ref3 = await fs
            .collection("suppliers")
            .doc(docID)
            .collection("invoices")
            .add(mdata);

          console.log(
            `*** Data written to Firestore suppliers/invoices ${ref3.path}`
          );
          await sendMessageToTopic(mdata)
          await checkAutoAccept(mdata);
        }
      } catch (e) {
        console.log(e);
        throw new Error(`RegisterInvoice failed: ${e}`);
      }
    }
    async function sendMessageToTopic(mdata) {
      const topic =
        BFNConstants.Constants.TOPIC_INVOICES + mdata.govtEntity.split("#")[1];
      const topic1 =
        BFNConstants.Constants.TOPIC_INVOICES + mdata.supplier.split("#")[1];
      const topic2 = BFNConstants.Constants.TOPIC_INVOICES;
      const mCondition = `'${topic}' in topics || '${topic2}' in topics || '${topic1}' in topics`;

      const payload = {
        data: {
          messageType: "INVOICE",
          json: JSON.stringify(mdata)
        },
        notification: {
          title: "Invoice",
          body:
            "Invoice from " + mdata.supplierName + " amount: " + mdata.amount
        },
        condition: mCondition
      };

      console.log("sending invoice data to topics: " + topic + " " + topic2 + ' ' + topic1);
      await admin.messaging().send(payload)
      return null;
    }
    async function sendAcceptanceToTopic(mdata) {
      const topic =
        BFNConstants.Constants.TOPIC_INVOICE_ACCEPTANCES +
        mdata.govtEntity.split("#")[1];
      const topic2 =
        BFNConstants.Constants.TOPIC_INVOICE_ACCEPTANCES +
        mdata.supplierDocumentRef;
      const topic3 = BFNConstants.Constants.TOPIC_INVOICE_ACCEPTANCES;
      const payload = {
        data: {
          messageType: "INVOICE_ACCEPTANCE",
          json: JSON.stringify(mdata)
        },
        notification: {
          title: "Invoice Acceptance",
          body: "Invoice Acceptance from " + mdata.customerName
        }
      };

      console.log(
        "sending invoice acceptance to topic: " +
          topic +
          " " +
          topic2 +
          " " +
          topic3
      );
      await admin.messaging().sendToTopic(topic3, payload);
      await admin.messaging().sendToTopic(topic2, payload);
      return await admin.messaging().sendToTopic(topic, payload);
    }
    async function checkAutoAccept(invoice) {
      console.log("checkAutoAccept, cust ref: " + invoice.govtDocumentRef);
      let docSnapshot;
      docSnapshot = await admin
        .firestore()
        .collection("govtEntities")
        .doc(invoice.govtDocumentRef)
        .get();
      console.log(docSnapshot.data());
      if (docSnapshot) {
        if (docSnapshot.data().allowAutoAccept) {
          console.log(
            "Issue an InvoiceAcceptance and write to BFN & Firestore"
          );
          return await acceptInvoice(invoice);
        } else {
          console.log("Customer has no autoAccept - send 200 with invoice");
          return response.status(200).send(invoice);
        }
      } else {
        const msg = "Customer record not found";
        console.log(msg);
        throw new Error(msg);
      }
    }
    async function acceptInvoice(invoice) {
      const invoiceAcceptance = {
        acceptanceId: uuid(),
        supplierName: invoice.supplierName,
        customerName: invoice.customerName,
        invoiceNumber: invoice.invoiceNumber,
        date: new Date().toISOString(),
        invoice: `resource:com.oneconnect.biz.Invoice#${invoice.invoiceId}`,
        govtEntity: invoice.govtEntity,
        supplierDocumentRef: invoice.supplierDocumentRef
      };
      console.log(invoiceAcceptance);
      let url;
      const suffix = "AcceptInvoice";
      if (debug) {
        url = BFNConstants.Constants.DEBUG_BFN_URL + suffix;
      } else {
        url = BFNConstants.Constants.RELEASE_BFN_URL + suffix;
      }

      try {
        const mresponse = await AxiosComms.AxiosComms.execute(
          url,
          invoiceAcceptance
        );
        if (mresponse.status === 200) {
          let mRef;
          mRef = await admin
            .firestore()
            .collection("suppliers")
            .doc(invoice.supplierDocumentRef)
            .collection("invoiceAcceptances")
            .add(mresponse.data)
            
          console.log(`Firestore document added: ${mRef.path}`);
          const dRef = await admin
            .firestore()
            .collection("govtEntities")
            .doc(invoice.govtDocumentRef)
            .collection("invoiceAcceptances")
            .add(mresponse.data);
          console.log(`Firestore document added: ${dRef.path}`);
          await InvoiceUpdate.updateInvoice(mresponse.data);
          await sendAcceptanceToTopic(mresponse.data);
          response.status(201).send(invoice);
          return null;
        } else {
          console.log(`** BFN ERROR ## status: ${mresponse.data}`);
          throw new Error(mresponse);
        }
      } catch (error) {
        console.log(error);
        throw error;
      }
    }

    
  }
);
