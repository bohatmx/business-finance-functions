// ######################################################################
// Add Invoice to BFN and Firestore
// ######################################################################

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as BFNConstants from '../models/constants';
const axios = require('axios');
const uuid = require('uuid/v1')

export const registerInvoice = functions.https.onRequest(async (request, response) => {
    if (!request.body) {
        console.log('ERROR - request has no body')
        return response.sendStatus(400)
    }
    console.log(`##### Incoming debug ${request.body.debug}`)
    console.log(`##### Incoming data ${JSON.stringify(request.body.data)}`)

    const debug = request.body.debug
    const data = request.body.data

    const apiSuffix = 'RegisterInvoice'

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

        console.log('####### --- writing Invoice to BFN: ---> ' + url)
        data['invoiceId'] = uuid()
        // Send a POST request to BFN
        try {
            const mresponse = await axios({
                method: 'post',
                url: url,
                data: data
            })
            console.log(`####### BFN response mresponse: ##########: ${mresponse}`)
            console.log(`####### BFN response status: ##########: ${mresponse.status}`)
            console.log(`####### BFN response data: ##########: ${mresponse.data}`)
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
        console.log('################### writeToFirestore, PO data from BFN:\n '
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
                    .collection('govtEntities').doc(mdata.govtDocumentRef)
                    .collection('invoices').add(mdata)
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
                    .collection('invoices').add(mdata)
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
