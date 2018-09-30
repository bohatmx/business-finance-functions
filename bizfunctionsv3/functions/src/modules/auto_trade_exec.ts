// ######################################################################
// Execute Auto Trading Session
// ######################################################################

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as BFNConstants from '../models/constants';
import * as AxiosComms from './axios-comms';
import * as Data from '../models/data';
// import { QuerySnapshot, CollectionReference } from '@google-cloud/firestore';
import * as J2T from "json2typescript";
const uuid = require('uuid/v1');
//curl --header "Content-Type: application/json"   --request POST   --data '{"debug": "true"}'   https://us-central1-business-finance-dev.cloudfunctions.net/executeAutoTrade

export const executeAutoTrades = functions.https.onRequest(async (request, response) => {
    if (!request.body) {
        console.log('ERROR - request has no body')
        return response.sendStatus(500)
    }
    console.log(`##### Incoming debug ${request.body.debug}`)
    const jsonConvert: J2T.JsonConvert = new J2T.JsonConvert();
    const debug = request.body.debug

    const orders: Data.AutoTradeOrder[] = []
    const profiles: Data.InvestorProfile[] = []
    const offers: Data.Offer[] = []
    const units: Data.ExecutionUnit[] = []

    let possibleAmount = 0.0
    const startKey = `start${new Date().getTime()}`
    const startTime = new Date().getTime()
    const apiSuffix = 'MakeInvoiceBid'
    let cIndex = 0
    let bidCount = 0

    await startAutoTradeSession()
    return null

    async function startAutoTradeSession() {
        console.log(`################### startAutoTradeSession ########### ${new Date().toISOString}`)
        await getData()
        buildUnits()
        await writeAutoTradeStart()

        cIndex = 0
        control()
    }

    function control() {
        if (cIndex < units.length) {
            validateBid(units[cIndex])
        } else {
            updateAutoTradeStart().then(function (d) {
                if (cIndex === units.length + 1) {
                    console.log(`Auto Trading Session ERROR encountered. Processed ${bidCount} of possible ${units.length} trades`)
                    response.sendStatus(400)
                } else {
                    console.log(`Auto Trading Session complete. Be Happy! execution units: ${units.length}`)
                    response.status(200).send(`Auto Trading Session: Processed ${bidCount} of possible ${units.length} trades`);
                }
            }).catch(function (e) {
                console.log(e)
                response.sendStatus(400)
            })

        }
    }
    function validateBid(unit) {
        console.log(`------ validating possible bid: ${unit.offer.offerAmount} for: ${unit.offer.supplierName} to ${unit.order.name}`)
        let validInvoiceAmount = false
        let validSec = false
        let validSupp = false
        let validTotal = false
        let validMinimumDiscount = false
        let validAccountBalance = false
        let total = 0.00;

        if (unit.offer.discountPercent >= unit.profile.minimumDiscount) {
            validMinimumDiscount = true
        }
        if (debug) {
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
            writeBid(unit)

        } else {
            cIndex++
            control()
        }
    }

    function writeBid(unit) {
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
                        reserveTotal += doc.data()['amount']
                    })
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
                    if (debug) {
                        url = BFNConstants.Constants.DEBUG_URL + apiSuffix
                    } else {
                        url = BFNConstants.Constants.RELEASE_URL + apiSuffix
                    }
                    console.log(`####### --- executing ${apiSuffix} on BFN Blockchain: --- ####### ${url}`)
                    try {
                        AxiosComms.AxiosComms.execute(url, bid)
                            .then(function (mresponse) {
                                if (mresponse.status === 200) {
                                    writeToFirestore(docId, bid)
                                } else {
                                    console.log(`******** BFN ERROR ########### mresponse.status: ${mresponse.status}`)
                                    cIndex = units.length + 1
                                    control()
                                }
                            }).catch(function (e) {
                                console.log(e)
                                cIndex = units.length + 1
                                control()
                            })
                    } catch (error) {
                        console.log('--------------- axios: BFN blockchain encountered a problem -----------------')
                        console.log(error);
                        cIndex = units.length + 1
                        control()
                    }
                })
        }).catch(e => {
            console.log(e)
        })

    }
    function writeToFirestore(docId, bid) {
        admin.firestore()
            .collection('invoiceOffers')
            .doc(docId).collection('invoiceBids')
            .add(bid).catch(e => {
                console.log(e)
                cIndex = units.length + 1
                control()
            }).then(function (e) {
                console.log(`++++++++ invoiceBid written to Firestore: ${bid.investorName} for amount: ${bid.amount}`)
                console.log(`Auto Trading Session: processed ${bidCount} bids of a possible ${units.length} date: ${new Date().toISOString}`)
                bidCount++
                cIndex++
                control()
            })
    }
    async function getData() {
        console.log('################### getData ######################')

        const qs = await admin.firestore()
            .collection('autoTradeOrders').where('isCancelled', '==', false).get();
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
            console.log(`###### order for: ${order.investorName} wallet: ${order.wallet}`)
        })

        const qsp = await admin.firestore()
            .collection('investorProfiles').get();
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
        const qso = await admin.firestore()
            .collection('invoiceOffers').where('isOpen', '==', true).get();
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


    }
    function buildUnits() {
        console.log('################### buildUnits ######################')
        let orderIndex = 0;
        do {
            console.log(`+++ offer: ${offers[0].supplierName} customerName: ${offers[0].customerName} offerAmount: ${offers[0].offerAmount} discountPercent: ${offers[0].discountPercent} %`)
            const unit = new Data.ExecutionUnit()
            unit.offer = offers[offers.length - 1]
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
            offers.pop()
        } while (offers.length > 0);

        console.log(`++++++++++++++++++++ :: ExecutionUnits ready for processing: ${units.length} offers assigned: ${offers.length}`)
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
            return 9
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
        const mf = await admin.firestore().collection('autoTradeStarts').doc(startKey).set(mStart).catch((e) => {
            console.log(e)
            return null
        })
        console.log(`######## Auto Trading Session completed in ${elapsed} seconds. Hooray!!`)
        return mf;
    }
});

