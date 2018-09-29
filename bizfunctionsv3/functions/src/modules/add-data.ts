// ######################################################################
// Add customer to BFN and Firestore
// ######################################################################

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as BFNConstants from '../models/constants';
import * as requestor from 'request';

import * as Axios from 'axios';
const axios = require('axios');

export const addData = functions.https.onRequest(async (request, response) => {
    if (!request.body) {
        console.log('ERROR - request has no body')
        return response.sendStatus(500)
    }
    console.log(`##### Incoming debug ${request.body.debug}`)
    console.log(`##### Incoming collectionName ${request.body.collectionName}`)
    console.log(`##### Incoming apiSuffix ${request.body.apiSuffix}`)
    console.log(`##### Incoming data ${JSON.stringify(request.body.data)}`)

    const debug = request.body.debug
    const collectionName = request.body.collectionName
    const apiSuffix = request.body.apiSuffix
    const data = request.body.data

    const ref = await writeToBFN()
    if (ref) {
        response.send(ref)
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
       
        console.log('####### --- writing to BFN: ---> ' + url)

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
        console.log('################### writeToFirestore ###################### data:\n '
            + JSON.stringify(mdata))
        // Add a new data to Firestore collection 
        try {
            const reference = await admin.firestore().collection(collectionName).add(mdata)
                .catch(function (error) {
                    console.log("Error writing Firestore document ");
                    console.log(error)
                    return null
                });
            console.log(`********** Customer successfully written to Firestore! ${reference.path}`)
            return reference
        } catch (e) {
            console.log('##### ERROR, probably JSON data format related')
            console.log(e)
            return null
        }

    }
});
