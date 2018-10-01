// ###########################################################################
// Execute Auto Trading Session - investors matched with offers and bids made
// ###########################################################################

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as BFNConstants from '../models/constants';
import * as AxiosComms from './axios-comms';
import * as Data from '../models/data';
const uuid = require('uuid/v1');
//curl --header "Content-Type: application/json"   --request POST   --data '{"debug": "true"}'   https://us-central1-business-finance-dev.cloudfunctions.net/executeAutoTrade

export const executeAutoTrades = functions.https.onRequest(async (request, response) => {
    if (!request.body) {
        console.log('ERROR - request has no body')
        return response.sendStatus(500)
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
    const apiSuffix = 'MakeInvoiceBid'
    let cIndex = 0
    let bidCount = 0

    await startAutoTradeSession()
    return null

    async function startAutoTradeSession() {
        const date = new Date().toISOString()
        console.log(`################### starting AutoTrade Session ########### ${date}`)
        const result = await getData()
        if (result === 0) {
            buildUnits()
            await writeAutoTradeStart()
            cIndex = 0
            control()
        } else {
            console.log('################ Done. Auto Trade Session stopped - No open offers ############')
            return null
        }
    }

    function control() {
        if (cIndex < units.length) {
            validateBid(units[cIndex])
        } else {
            updateAutoTradeStart().then(function (d) {
                if (cIndex === units.length + 1) {
                    console.log(`Auto Trading Session ERROR encountered. Processed ${bidCount} of possible ${units.length} trades`)
                    response.status(400).send(`Auto Trading Session ERROR encountered. Processed ${bidCount} of possible ${units.length} trades`)
                } else {
                    const now: number = new Date().getTime()
                    const elapsed = (now - startTime) / 1000
                    console.log(`Auto Trading Session complete. Be Happy! execution units: ${units.length} bidCount: ${bidCount}`)
                    response.status(200).send(`Auto Trading Session: Processed ${bidCount} of possible ${units.length} trades. Elapsed seconds: ${elapsed}\n`);
                }
            }).catch(function (e) {
                console.log(e)
                response.status(400).send(`Failed to update AutoTradeStart ${e}`)
            })

        }
    }
    function validateBid(unit) {
        console.log(`-----------> validating possible bid: ${unit.offer.offerAmount} for: ${unit.offer.supplierName} to ${unit.order.name}`)
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
        //TODO - add validation checks here
        if (debug === 'true') {
            validSec = true
            validAccountBalance = true
            validInvoiceAmount = true
            validSupp = true
            validTotal = true
        }

        //check validity of all indicators
        if (validInvoiceAmount
            && validMinimumDiscount
            && validSec
            && validSupp
            && validTotal
            && validAccountBalance) {
            writeBidToBFN(unit)

        } else {
            //this offer has not met all validation requirements
            console.log(`---- Offer validation failed, bid ignored. offerAmount: ${unit.offer.offerAmount} investor: ${unit.profile.name}`)
            cIndex++
            control()
        }
    }

    function writeBidToBFN(unit) {
        console.log('################# writeBid ####################')
        //get existing invoice bids for this offer
        const colRef = admin.firestore().collection('invoiceOffers')
        colRef.where('offerId', '==', unit.offer.offerId).get().then(function (querySnap) {
            let docId
            querySnap.forEach(doc => {
                docId = doc.id
            })
            admin.firestore().collection('invoiceOffers').doc(docId).collection('invoiceBids').get()
                .then(function (mqs) {
                    let reserveTotal = 0.0
                    mqs.forEach(doc => {
                        reserveTotal += doc.data()['reservePercent']
                    })
                    console.log(`&&&&&&&&& total precent reserved: ${reserveTotal} % from ${mqs.size} existing bids. Offer amt: ${unit.offer.offerAmount}`)
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
                    try {
                        AxiosComms.AxiosComms.execute(url, bid)
                            .then(function (mresponse) {
                                if (mresponse.status === 200) {
                                    writeBidToFirestore(docId, bid, unit.offer.offerId)
                                } else {
                                    console.log(`******** BFN ERROR ########### mresponse.status: ${mresponse.status}`)
                                    throw new Error(`BFN failed to add bid. mresponse.status: ${mresponse.status}`)
                                }
                            }).catch(e => {
                                console.log(e)
                                throw new Error(`AxiosComms failed to add bid. ${e}`)
                            })
                    } catch (error) {
                        console.log('--------------- axios: BFN blockchain encountered a problem -----------------')
                        console.log(error);
                        throw new Error(`AxiosComms failed to add bid. ${error}`)
                    }
                })
        }).catch(e => {
            console.log(e)
            throw new Error(`Failed to write bid to BFN. ${e}`)
        })

    }
    function writeBidToFirestore(docId, bid, offerId) {
        admin.firestore()
            .collection('invoiceOffers')
            .doc(docId).collection('invoiceBids')
            .add(bid).catch(e => {
                console.log(e)
                throw new Error(`Failed to add bid to invoiceOffers collection on Firestore. ${e}`)
            }).then(eRef => {
                console.log(`++++++++ invoiceBid written to invoiceOffers on Firestore: ${bid.investorName} for amount: ${bid.amount} ref: ${eRef}`)
                bidCount++
                admin.firestore().collection('investors').where('participantId', '==', bid.investor.split('#')[1]).get()
                    .then(nref => {
                        const investorDocId = nref.docs[0].id
                        admin.firestore().collection('investors').doc(investorDocId).collection('invoiceBids').add(bid)
                            .then(xref => {
                                console.log(`++++++++ invoiceBid written to investor invoiceBids on Firestore: ${bid.investorName} for amount: ${bid.amount} ref: ${xref}`)
                                console.log(`Auto Trading Session: processed ${bidCount} bids of a possible ${units.length}, date: ${new Date().toISOString()}`)
                                closeOfferOnBFN(offerId)
                                cIndex++
                                control()
                            }).catch(er => {
                                console.log(er)
                                throw new Error(`Failed to add bid to investors collection on Firestore. ${er}`)

                            })
                    })

            }).catch(e => {
                console.log(e);
                throw new Error(`Failed to write bid to Firestore. ${e}`)
            })
    }

    //close Offer on BFN
    function closeOfferOnBFN(offerId) {
        console.log(`##################### closeOfferOnBFN ###################### offerId: ${offerId}`)
        let url;
        if (debug === 'true') {
            url = BFNConstants.Constants.DEBUG_URL + 'CloseOffer'
        } else {
            url = BFNConstants.Constants.RELEASE_URL + 'CloseOffer'
        }

        const map = new Map();
        map['offerId'] = offerId
        console.log(`####### --- executing CloseOffer on BFN Blockchain: --- ####### ${url}`)
        try {
            AxiosComms.AxiosComms.execute(url, map)
                .then(mresponse => {
                    if (mresponse.status === 200) {
                        closeOfferOnFirestore(offerId)
                    } else {
                        console.log(`******** BFN ERROR ########### mresponse.status: ${mresponse.status}`)
                        throw new Error(`Error: closing Offer on BFN. status: ${mresponse.status} `)
                    }
                }).catch(e => {
                    console.log(e)
                    throw new Error(`AxiosComms failed. ${e}`)
                })

        } catch (error) {
            console.log('--------------- axios: BFN blockchain encountered a problem -----------------')
            console.log(error);
            throw new Error(`Error: closing Offer on BFN: ${error}`)
        }

    }

    function closeOfferOnFirestore(offerId) {
        console.log(`################### closeOfferOnFirestore, close offerId :${offerId}`)
        try {
            let mdocID
            let mData
            admin.firestore()
                .collection('invoiceOffers').where('offerId', '==', offerId)
                .get().catch(function (error) {
                    console.log("Error getting Firestore document ");
                    console.log(error)
                    throw new Error('Error getting Firestore invoiceOffer document ')
                }).then(snapshot => {
                    snapshot.forEach(doc => {
                        mdocID = doc.id
                        mData = doc.data()
                        mData.isOpen = false
                        mData.dateClosed = new Date().toISOString()
                    });
                    console.log(`********************* offer documentID: ${mdocID}`)
                    console.log(`********************* offer updated data, mData.isOpen = false: ${JSON.stringify(mData)}`)
                    if (mdocID) {
                        admin.firestore()
                            .collection('invoiceOffers').doc(mdocID).set(mData)
                            .catch(function (error) {
                                console.log("----- Error updating Firestore Offer document ");
                                console.log(error)
                                throw new Error('Error adding Firestore invoiceOffers document ')
                            }).then(ref1 => {
                                console.log(`********** Data successfully updated on Firestore: \n ${JSON.stringify(mData)}`)
                            });

                    }
                });
        } catch (e) {
            console.log(e)
            console.log(`----- Error closeOfferOnFirestore, offerId: ${offerId} `);
            throw new Error(`----- Error closeOfferOnFirestore, offerId: ${offerId} `)
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

        return 0;

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

        console.log(`++++++++++++++++++++ :: ExecutionUnits ready for processing, execution units: ${units.length}, offers assigned: ${offerIndex}`)
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
        console.log(`######## Auto Trading Session completed in ${elapsed} seconds. We are HAPPY, Houston!!`)
        return mf;
    }
});

