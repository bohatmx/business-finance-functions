// ###########################################################################
// Execute Auto Trading Session - investors matched with offers and bids made
// ###########################################################################

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as BFNConstants from '../models/constants';
import * as BFNComms from './axios-comms';
import * as Data from '../models/data';
const uuid = require('uuid/v1');
//curl --header "Content-Type: application/json"   --request POST   --data '{"debug": "true"}'   https://us-central1-business-finance-dev.cloudfunctions.net/executeAutoTrade

export const executeAutoTrades = functions
    .runWith({ memory: '256MB', timeoutSeconds: 30 })
    .https.onRequest(async (request, response) => {
        if (!request.body) {
            console.log('ERROR - request has no body')
            return response.status(500).send('Request has no body')
        }
        console.log(`##### Incoming debug ${request.body.debug}`)
        const debug = request.body.debug

        const orders: Data.AutoTradeOrder[] = []
        const profiles: Data.InvestorProfile[] = []
        const offers: Data.Offer[] = []
        const units: Data.ExecutionUnit[] = []

        let possibleAmount = 0.0
        const startKey = `start-${new Date().getTime()}`
        const startTime = new Date().getTime()
        const startDate = new Date().toISOString()
        let bidCount = 0
        const OFFERS_AVAILABLE = 0


        await startAutoTradeSession()
        return null

        async function startAutoTradeSession() {
            const date = new Date().toISOString()
            console.log(`################### starting AutoTrade Session ########### ${date}`)
            const result = await getData()
            if (result === OFFERS_AVAILABLE) {
                buildUnits()
                await writeAutoTradeStart()
                await validateBids()
            } else {
                console.log('################ Done. Auto Trade Session stopped - No open offers ############')
            }

            await updateAutoTradeStart();

            if (bidCount > 0) {
                return response.status(200).send(`\n\nAuto Trading Session:  No open offers. Quitting\n\n`);
            } else {
                const now: number = new Date().getTime()
                const elapsed = (now - startTime) / 1000
                console.log(`Auto Trading Session complete. Be Happy! execution units: ${units.length} bidCount: ${bidCount}`)
                return response.status(200).send(`Auto Trading Session: Processed 
                        ${bidCount} of possible ${units.length} trades. Elapsed seconds: ${elapsed}\n`);
            }
        }

        async function validateBids() {

            const promises = []
            units.forEach(unit => {
                const promise = validateBid(unit)
                promises.push(promise);
            })
            console.log(`######## validateBids complete. returning Promise.all ....`)
            return 0
            //return Promise.all(promises)
        }

        async function validateBid(unit) {
            console.log(`-----------> validating possible bid: ${unit.offer.offerAmount} for: 
            ${unit.offer.supplierName} to ${unit.order.name}`)

            let validInvoiceAmount = false
            let validSec = false
            let validSupp = false
            let validTotal = false
            let validMinimumDiscount = false
            let validAccountBalance = false
            // let total = 0.00;

            if (unit.offer.discountPercent >= unit.profile.minimumDiscount) {
                validMinimumDiscount = true
            }
            if (unit.offer.offerAmount >= unit.profile.maxInvoiceAmount) {
                validInvoiceAmount = true
            }
            //TODO - add validation checks here
            if (debug === 'true') {
                validSec = true
                validAccountBalance = true
                validSupp = true
                validTotal = true
            }

            //check validity of ALL indicators
            if (validInvoiceAmount
                && validMinimumDiscount
                && validSec
                && validSupp
                && validTotal
                && validAccountBalance) {
                return await writeBidToBFN(unit)

            } else {
                //this offer has not met all validation requirements
                console.log(`---- Offer validation failed, bid ignored. offerAmount: ${unit.offer.offerAmount} investor: ${unit.profile.name}`)
                return 0
            }
        }

        async function writeBidToBFN(unit) {
            //get existing invoice bids for this offer
            const colRef = admin.firestore().collection('invoiceOffers')
            const querySnap = await colRef.where('offerId', '==', unit.offer.offerId).get()
            let docId
            querySnap.forEach(doc => {
                docId = doc.id
            })
            const apiSuffix = 'MakeInvoiceBid'
            const bidQuerySnap = await admin.firestore().collection('invoiceOffers').doc(docId).collection('invoiceBids').get()
            let reserveTotal = 0.0
            bidQuerySnap.forEach(doc => {
                reserveTotal += doc.data()['reservePercent']
            })
            console.log(`&&&&&&&&& total precent reserved: ${reserveTotal} % from ${bidQuerySnap.size} existing bids. Offer amt: ${unit.offer.offerAmount}`)
            const myReserve = 100.0 - reserveTotal
            const myAmount = unit.offer.offerAmount * (myReserve / 100)
            const bid = {
                'invoiceBidId': uuid(),
                'amount': myAmount,
                'reservePercent': myReserve,
                'autoTradeOrder': `resource:com.oneconnect.biz.AutoTradeOrder#${unit.order.autoTradeOrderId}`,
                'investor': unit.order.investor,
                'offer': `resource:com.oneconnect.biz.Offer#${unit.offer.offerId}`,
                'investorName': unit.order.investorName,
                'wallet': unit.order.wallet,
                'date': new Date().toISOString(),
                'discountPercent': unit.offer.discountPercent,
                'isSettled': false,
                'startTime': new Date().toISOString(),
                'endTime': new Date().toISOString(),
            }
            console.log(`++++ bid to be written to BFN: ${JSON.stringify(bid)}`)
            let url;
            if (debug === 'true') {
                url = BFNConstants.Constants.DEBUG_URL + apiSuffix
            } else {
                url = BFNConstants.Constants.RELEASE_URL + apiSuffix
            }
            console.log(`####### --- executing ${apiSuffix} on BFN Blockchain: --- ####### ${url}`)
            const blockchainResponse = await BFNComms.AxiosComms.execute(url, bid).catch(e => {
                console.log(e)
                throw new Error(`AxiosComms failed to add bid. ${e}`)
            })
            if (blockchainResponse.status === 200) {
                return await writeBidToFirestore(docId, bid, unit.offer.offerId)
            } else {
                console.log(`******** BFN ERROR ########### mresponse.status: ${blockchainResponse.status}`)
                throw new Error(`BFN failed to add bid. mresponse.status: ${blockchainResponse.status}`)
            }
        }
        async function writeBidToFirestore(docId, bid, offerId) {
            await admin.firestore()
                .collection('invoiceOffers')
                .doc(docId).collection('invoiceBids')
                .add(bid).catch(e => {
                    console.log(e)
                    throw new Error(`Failed to add bid to invoiceOffers collection on Firestore. ${e}`)
                })
            const invRef = await admin.firestore().collection('investors').where('participantId', '==', bid.investor.split('#')[1]).get()
            const investorDocId = invRef.docs[0].id
            const xref = await admin.firestore().collection('investors').doc(investorDocId).collection('invoiceBids').add(bid)
                .catch(e => {
                    console.log(e)
                    throw new Error(`Failed to add bid to investors collection on Firestore. ${e}`)
                })
            console.log(`++++++++ invoiceBid written to investor invoiceBids on Firestore: ${bid.investorName} for amount: ${bid.amount} ref: ${xref}`)
            console.log(`Auto Trading Session: processed ${bidCount} bids of a possible ${units.length}, date: ${new Date().toISOString()}`)

            return await closeOfferOnBFN(offerId)

        }

        //close Offer on BFN
        async function closeOfferOnBFN(offerId) {
            let url;
            if (debug === 'true') {
                url = BFNConstants.Constants.DEBUG_URL + 'CloseOffer'
            } else {
                url = BFNConstants.Constants.RELEASE_URL + 'CloseOffer'
            }

            const map = new Map();
            map['offerId'] = offerId
            console.log(`####### --- executing CloseOffer on BFN Blockchain: --- ####### ${url}`)
            const blockchainResponse = await BFNComms.AxiosComms.execute(url, map)
                .catch(e => {
                    console.log(e)
                    throw new Error(`AxiosComms failed. ${e}`)
                })

            if (blockchainResponse.status === 200) {
                return await closeOfferOnFirestore(offerId)
            } else {
                console.log(`******** BFN ERROR ########### mresponse.status: ${blockchainResponse.status}`)
                throw new Error(`Error: closing Offer on BFN. status: ${blockchainResponse.status} `)
            }

        }

        async function closeOfferOnFirestore(offerId) {

            let mdocID
            let mData
            const offerSnapshot = await admin.firestore()
                .collection('invoiceOffers').where('offerId', '==', offerId)
                .get().catch(error => {
                    console.log("Error getting Firestore document ");
                    console.log(error)
                    throw new Error('Error getting Firestore invoiceOffer document ')
                })

            offerSnapshot.forEach(doc => {
                mdocID = doc.id
                mData = doc.data()
                mData.isOpen = false
                mData.dateClosed = new Date().toISOString()
            });
            if (mdocID) {
                const m = await admin.firestore()
                    .collection('invoiceOffers').doc(mdocID).set(mData)
                    .catch(error => {
                        console.log("----- Error updating Firestore Offer document ");
                        console.log(error)
                        throw new Error('Error adding Firestore invoiceOffers document ')
                    })
                console.log(`################### closeOfferOnFirestore, closed offerId :${offerId}`)
                bidCount++
                return m
            } else {
                return 0
            }

        }
        async function getData() {
            console.log('################### getData ######################')
            const qso = await admin.firestore()
                .collection('invoiceOffers').where('isOpen', '==', true).get()
                .catch(e => {
                    console.log(e)
                    throw new Error(`Failed to get open invoiceOffers from Firestore`)
                })
            qso.docs.forEach(doc => {
                const data = doc.data()
                const offer: Data.Offer = new Data.Offer()
                offer.offerId = data['offerId']
                offer.isOpen = data['isOpen']
                offer.isCancelled = data['isCancelled']
                offer.offerAmount = data['offerAmount']
                offer.discountPercent = data['discountPercent']
                offer.startTime = data['startTime']
                offer.endTime = data['endTime']
                offer.invoice = data['invoice']
                offer.date = data['date']
                offer.invoiceAmount = data['invoiceAmount']
                offer.customerName = data['customerName']
                offer.supplier = data['supplier']
                offer.supplierName = data['supplierName']
                offers.push(offer)
                console.log(`###### offer by: ${offer.supplierName} offerAmount: ${offer.offerAmount} endTime: ${offer.endTime}`)
            })

            if (qso.docs.length === 0) {
                console.log('No open offers found. quitting ...')
                response.status(200).send(`Auto Trading Session complete. No open offers found for auto trades; Session stopped\n`);
                return 9
            }


            ///////
            const qs = await admin.firestore()
                .collection('autoTradeOrders').where('isCancelled', '==', false).get()
                .catch(e => {
                    console.log(e)
                    throw new Error(`Failed to get auto trade orders from Firestore`)
                })
            qs.docs.forEach(doc => {
                const data = doc.data()
                const order: Data.AutoTradeOrder = new Data.AutoTradeOrder()
                order.autoTradeOrderId = data['autoTradeOrderId']
                order.date = data['date']
                order.investor = data['investor']
                order.investorName = data['investorName']
                order.wallet = data['wallet']
                order.isCancelled = data['isCancelled']
                order.investorProfile = data['investorProfile']
                order.user = data['user']
                // console.log(JSON.stringify(data))
                // const orderx: Data.AutoTradeOrder = jsonConvert.deserializeObject(data, Data.AutoTradeStart);
                orders.push(order)
                console.log(`###### order for: ${order.investorName} wallet key: ${order.wallet.split('#')[1]}`)
            })

            const qsp = await admin.firestore()
                .collection('investorProfiles').get()
                .catch(e => {
                    console.log(e)
                    throw new Error(`Failed to get investorProfiles from Firestore`)
                })
            qsp.docs.forEach(doc => {
                const data = doc.data()
                const profile: Data.InvestorProfile = new Data.InvestorProfile()
                profile.profileId = data['profileId']
                profile.name = data['name']
                profile.investor = data['investor']
                profile.maxInvestableAmount = data['maxInvestableAmount']
                profile.maxInvoiceAmount = data['maxInvoiceAmount']
                profile.minimumDiscount = data['minimumDiscount']
                profile.sectors = data['sectors']
                profile.suppliers = data['suppliers']
                profiles.push(profile)
                console.log(`###### profile for: ${profile.name} minimumDiscount: ${profile.minimumDiscount} maxInvestableAmount: ${profile.maxInvestableAmount} maxInvoiceAmount: ${profile.maxInvoiceAmount} `)
            })

            return OFFERS_AVAILABLE;

        }
        function buildUnits() {
            console.log('################### buildUnits ######################')
            let orderIndex = 0;
            let offerIndex = 0
            do {
                console.log(`+++ buildUnits, offer, supplier: ${offers[offerIndex].supplierName} customerName: ${offers[offerIndex].customerName} 
            offerAmount: ${offers[offerIndex].offerAmount} discountPercent: ${offers[offerIndex].discountPercent} %`)
                const unit = new Data.ExecutionUnit()
                unit.offer = offers[offerIndex]
                if (orderIndex === orders.length) {
                    orderIndex = 0;
                }
                unit.order = orders[orderIndex]
                profiles.forEach((p) => {
                    if (p.investor === unit.order.investor) {
                        unit.profile = p;
                    }
                })
                orderIndex++
                units.push(unit)
                offerIndex++
            } while (offerIndex < offers.length);

            shuffleOffers(units)
            console.log(`++++++++++++++++++++ :: ExecutionUnits ready for processing, execution units: ${units.length}, offers assigned: ${offerIndex}`)
        }
        function shuffleOffers(offerUnits) {
            for (let i = offerUnits.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [offerUnits[i], offerUnits[j]] = [offerUnits[j], offerUnits[i]];
            }
        }
        async function writeAutoTradeStart() {
            console.log('################### writeAutoTradeStart II ######################')

            units.forEach((u) => {
                possibleAmount += u.offer.offerAmount
            })
            const mStart = {
                'dateStarted': new Date().toISOString(),
                'possibleAmount': possibleAmount,
                'possibleTrades': units.length
            }

            console.log(`*********** autoTradeStart possibleAmount: ${mStart.possibleAmount} possibleTrades: ${mStart.possibleTrades}`)

            await admin.firestore().collection('autoTradeStarts').doc(startKey).set(mStart).catch((e) => {
                console.error(e)
                throw new Error(`Failed to write AutoTradeStart to Firestore. ${e}`)
            })
            console.log(`*********** autoTradeStart written to Firestore startKey: ${startKey}`)
            return 0
        }
        async function updateAutoTradeStart() {
            console.log('################### updateAutoTradeStart ######################')
            const endTime = new Date().getTime()
            const elapsed = (endTime - startTime) / 1000
            const mStart = {
                'dateStarted': startDate,
                'dateEnded': new Date().toISOString(),
                'possibleAmount': possibleAmount,
                'possibleTrades': units.length,
                'elapsedSeconds': elapsed,
                'bidCount': bidCount
            }
            const mf = await admin.firestore().collection('autoTradeStarts').doc(startKey)
                .set(mStart)
                .catch((e) => {
                    console.log(e)
                    throw new Error(`Failed to update AutoTradeStart to Firestore. ${e}`)
                })
            console.log(`######## Auto Trading Session completed; autoTradeStart updated. Done in 
            ${elapsed} seconds. We are HAPPY, Houston!!`)
            return mf;
        }
    });

