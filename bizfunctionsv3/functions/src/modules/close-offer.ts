// ######################################################################
// Add CloseOffer to BFN and update Firestore
// ######################################################################

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as BFNConstants from '../models/constants';
import * as AxiosComms from './axios-comms';

export const closeOffer = functions.https.onRequest(async (request, response) => {
    if (!request.body) {
        console.log('ERROR - request has no body')
        return response.sendStatus(400)
    }
    console.log(`##### Incoming debug ${request.body.debug}`)
    console.log(`##### Incoming data ${JSON.stringify(request.body.data)}`)

    const debug = request.body.debug
    const offerId = request.body.offerId
    const map = new Map();
    map['offerId'] = offerId

    const apiSuffix = 'CloseOffer'

    const ref = await writeToBFN()
    if (ref) {
        response.status(200).send(ref.path);
    } else {
        response.sendStatus(400)
    }

    return null

    //add customer to bfn blockchain
    async function writeToBFN() {
        let url;
        if (debug) {
            url = BFNConstants.Constants.DEBUG_URL + apiSuffix
        } else {
            url = BFNConstants.Constants.RELEASE_URL + apiSuffix
        }

        console.log('####### --- writing CloseOffer to BFN: ---> ' + url)

        // Send a POST request to BFN
        try {
            const mresponse = await AxiosComms.AxiosComms.execute(url,map)
            console.log(`####### BFN response status: ##########: ${mresponse.status}`)
            if (mresponse.status === 200) {
                return writeToFirestore()
            } else {
                console.log('******** BFN ERROR ###########')
                return null
            }

        } catch (error) {
            console.log('--------------- axios: BFN blockchain problem -----------------')
            console.log(error);
            return null;
        }

    }

    async function writeToFirestore() {
        console.log('################### writeToFirestore, close Offer :')
        // Add a new data to Firestore collection 
        try {
            let mdocID
            let mData
            const snapshot = await admin.firestore()
                .collection('invoiceOffers').where('offerId', '==', offerId)
                .get().catch(function (error) {
                    console.log("Error getting Firestore document ");
                    console.log(error)
                    return null
                });
            snapshot.forEach(doc => {
                mdocID = doc.id
                mData = doc.data
                mData.isOpen = false
                mData.dateClosed = new Date().toISOString
            });
            let ref1
            if (mdocID) {
                 ref1 = await admin.firestore()
                    .collection('invoiceOffers').doc(mdocID).set(mData)
                    .catch(function (error) {
                        console.log("Error getting Firestore document ");
                        console.log(error)
                        return null
                    });
                console.log(`********** Data successfully updated on Firestore!`)
            }
            return ref1
        } catch (e) {
            console.log('##### ERROR, probably JSON data format related')
            console.log(e)
            return null
        }

    }
});
