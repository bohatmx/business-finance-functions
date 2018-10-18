// ######################################################################
// Add DeliveryNote to BFN and Firestore
// ######################################################################

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as BFNConstants from '../models/constants';
import * as AxiosComms from './axios-comms';
const uuid = require('uuid/v1')
const Firestore = require("firestore");

export const acceptDeliveryNote = functions.https.onRequest(async (request, response) => {
    if (!request.body) {
        console.log('ERROR - request has no body')
        return response.sendStatus(400)
    }
    // const firestore = new Firestore();
    // const settings = { /* your settings... */ timestampsInSnapshots: true };
    // firestore.settings(settings);

    console.log(`##### Incoming debug ${request.body.debug}`)
    console.log(`##### Incoming data ${JSON.stringify(request.body.data)}`)

    const debug = request.body.debug
    const data = request.body.data

    const apiSuffix = 'AcceptDelivery'

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

        console.log('####### --- writing Delivery Acceptance to BFN: ---> ' + url)
        data['acceptanceId'] = uuid()
        // Send a POST request to BFN
        try {
            const mresponse = await AxiosComms.AxiosComms.execute(url,data)
            if (mresponse.status === 200) {
                return writeToFirestore(mresponse.data)
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

    async function writeToFirestore(mdata) {
        console.log('################### writeToFirestore, data from BFN:\n '
            + JSON.stringify(mdata))
        // Add a new data to Firestore collection 
        try {
            let mdocID;
            if (!mdata.govtDocumentRef) {
                const key = mdata.govtEntity.split('#')[1]
                const snapshot = await admin.firestore()
                    .collection('govtEntities').where('participantId', '==', key)
                    .get().catch(function (error) {
                        console.log("Error getting Firestore document ");
                        console.log(error)
                        return null
                    });
                snapshot.forEach(doc => {
                    mdocID = doc.id
                });

            } else {
                mdocID = mdata.govtDocumentRef
            }
            let ref1
            if (mdocID) {
                 ref1 = await admin.firestore()
                    .collection('govtEntities').doc(mdocID)
                    .collection('deliveryAcceptances').add(mdata)
                    .catch(function (error) {
                        console.log("Error getting Firestore document ");
                        console.log(error)
                        return null
                    });
                console.log(`********** Data successfully written to Firestore! ${ref1.path}`)
            }

            let docID;
            if (!mdata.supplierDocumentRef) {
                const key = mdata.supplier.split('#')[1]
                const snapshot = await admin.firestore()
                    .collection('suppliers').where('participantId', '==', key)
                    .get().catch(function (error) {
                        console.log("Error writing Firestore document ");
                        console.log(error)
                        return null
                    });
                snapshot.forEach(doc => {
                    docID = doc.id
                });

            } else {
                docID = mdata.supplierDocumentRef
            }
            if (docID) {
                const ref2 = await admin.firestore()
                    .collection('suppliers').doc(docID)
                    .collection('deliveryAcceptances').add(mdata)
                    .catch(function (error) {
                        console.log("Error writing Firestore document ");
                        console.log(error)
                        return null
                    });
                console.log(`********** Data successfully written to Firestore! ${ref2.path}`)
            }
            return ref1
        } catch (e) {
            console.log('##### ERROR, probably JSON data format related')
            console.log(e)
            return null
        }

    }
});
