import * as admin from "firebase-admin";
import * as BFNConstants from "../models/constants";
import * as AxiosComms from "./axios-comms";

export class CloseHelper {
  static async writeCloseOfferToBFN(offerId, offerDocRef, debug) {
    let url;
    const map = new Map();
    map["offerId"] = offerId;
    if (debug) {
      url = BFNConstants.Constants.DEBUG_BFN_URL + "CloseOffer";
    } else {
      url = BFNConstants.Constants.RELEASE_BFN_URL + "CloseOffer";
    }

    try {
      const mresponse = await AxiosComms.AxiosComms.execute(url, map);
      if (mresponse.status === 200) {
        return updateCloseOfferToFirestore();
      } else {
        console.log(
          `******** BFN ERROR ########### mresponse.status: ${mresponse.status}`
        );
        throw new Error(
          `BFN error  status: ${mresponse.status} ${mresponse.body}`
        );
      }
    } catch (error) {
      console.log(
        "--------------- axios: BFN blockchain encountered a problem -----------------"
      );
      console.log(error);
      throw error;
    }
    async function updateCloseOfferToFirestore() {
      console.log(
        `################### writeToFirestore, close Offer :${offerDocRef}`
      );

      try {
        const snapshot = await admin
          .firestore()
          .collection("invoiceOffers")
          .doc(offerDocRef)
          .get();

        const mData = snapshot.data();
        mData.isOpen = false;
        mData.dateClosed = new Date().toISOString();
        await snapshot.ref.set(mData);
        console.log(
          `offer closed , isOpen set to false - updated on Firestore`
        );

        console.log(
          `********************* offer data: ${JSON.stringify(mData)}`
        );
        return null;
      } catch (e) {
        console.log("##### ERROR, probably JSON data format related:");
        console.log(e);
        throw e;
      }
    }
  }
}
