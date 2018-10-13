// ######################################################################
// Add DeliveryNote to BFN and Firestore
// ######################################################################

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as BFNConstants from '../models/constants';
import * as AxiosComms from './axios-comms';
const uuid = require('uuid/v1')

export const makeOffer = functions.https.onRequest(async (request, response) => {
    if (!request.body) {
        console.log('ERROR - request has no body')
        return response.sendStatus(400)
    }
    console.log(`##### Incoming debug ${request.body.debug}`)
    console.log(`##### Incoming data ${JSON.stringify(request.body.data)}`)

    const debug = request.body.debug
    const data = request.body.data

    const apiSuffix = 'MakeOffer'

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

        console.log('####### --- writing Offer to BFN: ---> ' + url)
        data['offerId'] = uuid()
        // Send a POST request to BFN
        try {
            const mresponse = await AxiosComms.AxiosComms.execute(url,data)
            console.log(`####### BFN response status: ##########: ${mresponse.status}`)
            if (mresponse.status === 200) {
                return writeToFirestore(mresponse.data)
            } else {
                console.log('******** BFN ERROR ###########')
                throw new Error(`MakeOffer failed: ${mresponse.status}`)
            }

        } catch (error) {
            console.log('--------------- axios: BFN blockchain problem -----------------')
            console.log(error);
            throw new Error(`MakeOffer failed: ${error}`)
        }

    }

    async function writeToFirestore(mdata) {
        console.log('################### writeToFirestore, Offer data from BFN:\n '
            + JSON.stringify(mdata))
        // Add a new data to Firestore collection 
        try {
            const ref1 = await admin.firestore()
                .collection('invoiceOffers').add(mdata)
                .catch(function (error) {
                    console.log("Error getting Firestore document ");
                    console.log(error)
                    throw new Error(`MakeOffer failed: ${error}`)
                });
            console.log(`********** Data successfully written to Firestore! ${ref1.path}`)

            return ref1
        } catch (e) {
            console.log('##### ERROR, probably JSON data format related')
            console.log(e)
            throw new Error(`MakeOffer failed: ${e}`)
        }

    }
});
