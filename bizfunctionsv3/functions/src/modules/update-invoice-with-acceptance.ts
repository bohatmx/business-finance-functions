    import * as admin from "firebase-admin";

    export async function updateInvoice(mdata) {
      try {
        let govtQuerySnapshot;
        govtQuerySnapshot = await admin
          .firestore()
          .collection("govtEntities")
          .where("participantId", "==", mdata.govtEntity.split("#")[1])
          .get();

        const govtRef = govtQuerySnapshot.docs[0].ref;
        let invQuerySnapshot;
        invQuerySnapshot = await govtRef
          .collection("invoices")
          .where("invoiceId", "==", mdata.invoice.split("#")[1])
          .get();

        const govtInvoice = invQuerySnapshot.docs[0].data();
        govtInvoice.invoiceAcceptance = `resource:com.oneconnect.biz.InvoiceAcceptance#${
          mdata.acceptanceId
        }`;

        await govtRef
          .collection("invoices")
          .doc(invQuerySnapshot.docs[0].id)
          .set(govtInvoice);
        console.log("## invoice (customer) updated with acceptance");

        let querySnapshot;
        querySnapshot = await admin
          .firestore()
          .collection("suppliers")
          .doc(mdata.supplierDocumentRef)
          .collection("invoices")
          .where("invoiceId", "==", mdata.invoice.split("#")[1])
          .get();
        const supplierInvoice = querySnapshot.docs[0].data();
        supplierInvoice.invoiceAcceptance = `resource:com.oneconnect.biz.InvoiceAcceptance#${
          mdata.acceptanceId
        }`;
        await querySnapshot.docs[0].ref
          .collection("invoices")
          .doc(querySnapshot.docs[0].id)
          .set(supplierInvoice);

        console.log("## invoice (supplier) updated with acceptance");
      } catch (e) {
        console.log(e);
        throw e
      }
    }