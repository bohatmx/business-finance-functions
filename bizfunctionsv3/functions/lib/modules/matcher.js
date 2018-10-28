"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const Data = require("../models/data");
class Matcher {
    static async match(profiles, orders, offers) {
        console.log("## start matching ............");
        const units = [];
        let pOffers = offers;
        let loopCount = 0;
        const MAX_LOOPS = 3;
        const MAX_UNITS = 100;
        const invalidSummary = {
            isValidInvoiceAmount: 0,
            isValidBalance: 0,
            isValidSector: 0,
            isValidSupplier: 0,
            isValidMinimumDiscount: 0,
            isvalidInvestorMax: 0,
            invalidTrades: 0,
            totalOpenOffers: offers.length,
            totalUnits: 0,
            date: new Date().toISOString()
        };
        let start;
        let end;
        console.log("getting each profiles total existing bids ...");
        for (const prof of profiles) {
            await getInvestorBidTotal(prof);
        }
        shuffleOffers();
        await initializeLoop();
        console.log("initializeLoop: Returning execution units to caller, units: " +
            units.length);
        return units;
        async function initializeLoop() {
            console.log("##### initializeLoop: loopCount: " +
                loopCount +
                " units: " +
                units.length +
                " offers outstanding: " +
                pOffers.length);
            for (const offer of pOffers) {
                if (units.length > MAX_UNITS) {
                    await sendMessageToHeartbeatTopic(`Built all ALLOWABLE execution units: ${units.length}`);
                    return units;
                }
                for (const order of orders) {
                    const isMatched = await findInvestorMatch(offer, order);
                    if (isMatched) {
                        console.log(`A match has been made: ${isMatched}`);
                        break;
                    }
                }
            }
            //create new offer list without the offers already taken
            const tempOffers = [];
            for (const off of offers) {
                let isFound = false;
                for (const unit of units) {
                    if (off.offerId === unit.offer.offerId) {
                        isFound = true;
                    }
                }
                if (!isFound) {
                    tempOffers.push(off);
                }
            }
            pOffers = tempOffers;
            loopCount++;
            console.log("######## loop complete, next loop is: " +
                loopCount +
                " MAX_LOOPS: " +
                MAX_LOOPS);
            if (invalidSummary.invalidTrades > 0) {
                if (loopCount < MAX_LOOPS) {
                    shuffleOffers();
                    await initializeLoop();
                }
            }
            console.log("##### MATCHING COMPLETE: ########### units: see invalidSummary above ...");
            console.log(invalidSummary);
            await admin.firestore().collection('invalidSummaries').add(invalidSummary).catch(e => {
                console.log(e);
            });
            console.log('record written to /invalidSummaries on Firestore');
            return units;
        }
        async function findInvestorMatch(mOffer, mOrder) {
            for (const profile of profiles) {
                start = new Date().getTime();
                const isValidBid = await validate(profile, mOffer);
                end = new Date().getTime();
                //console.log(`One validation took ${(end - start) / 1000} seconds`);
                if (isValidBid) {
                    const unit = new Data.ExecutionUnit();
                    unit.offer = mOffer;
                    unit.profile = profile;
                    unit.order = mOrder;
                    units.push(unit);
                    profile.totalBidAmount += mOffer.offerAmount;
                    await sendMessageToHeartbeatTopic(`${unit.profile.name} found a match: ${unit.offer.supplierName} for ${unit.offer.offerAmount}`);
                    console.log("## valid execution unit created and added to units: " +
                        units.length);
                    return isValidBid;
                }
                else {
                    invalidSummary.invalidTrades++;
                }
            }
            return false;
        }
        async function sendMessageToHeartbeatTopic(message) {
            const hb = {
                date: new Date().toISOString(),
                message: message
            };
            const topic = `heartbeats`;
            const payload = {
                data: {
                    messageType: "HEARTBEAT",
                    json: JSON.stringify(hb)
                },
                notification: {
                    title: "Heartbeat",
                    body: "Heartbeat: " + message
                }
            };
            console.log("sending heartbeat to topic: " + topic);
            return await admin.messaging().sendToTopic(topic, payload);
        }
        async function validate(profile, offer) {
            let isValidTotal = false;
            const isValidSupplier = isWithinSupplierList(profile, offer);
            const isValidSector = isWithinSectorList(profile, offer);
            const isValidAccountBalance = await isAccountBalanceOK(profile);
            let isValidInvoiceAmount = false;
            let isValidMinimumDiscount = false;
            const mTotal = profile.totalBidAmount + offer.offerAmount;
            if (mTotal < profile.maxInvestableAmount ||
                mTotal === profile.maxInvestableAmount) {
                isValidTotal = true;
            }
            else {
                invalidSummary.isvalidInvestorMax++;
            }
            if (offer.discountPercent > profile.minimumDiscount ||
                offer.discountPercent === profile.minimumDiscount) {
                isValidMinimumDiscount = true;
            }
            else {
                invalidSummary.isValidMinimumDiscount++;
            }
            if (offer.offerAmount < profile.maxInvoiceAmount ||
                offer.offerAmount === profile.maxInvoiceAmount) {
                isValidInvoiceAmount = true;
            }
            else {
                invalidSummary.isValidInvoiceAmount++;
            }
            if (isValidTotal &&
                isValidSupplier &&
                isValidSector &&
                isValidInvoiceAmount &&
                isValidMinimumDiscount &&
                isValidAccountBalance) {
                return true;
            }
            else {
                return false;
            }
        }
        async function getInvestorBidTotal(profile) {
            let querySnap;
            querySnap = await admin
                .firestore()
                .collection("investors")
                .where("participantId", "==", profile.investor.split("#")[1])
                .get();
            if (querySnap.docs.length > 0) {
                const investorRef = querySnap.docs[0].ref;
                let bidQuerySnap;
                bidQuerySnap = await investorRef
                    .collection("invoiceBids")
                    .where("isSettled", "==", false)
                    .get();
                if (bidQuerySnap.docs.length === 0) {
                    return true;
                }
                else {
                    let total = 0.0;
                    bidQuerySnap.forEach(doc => {
                        const bid = doc.data();
                        total += bid.amount;
                    });
                    profile.totalBidAmount = total;
                }
            }
            await sendMessageToHeartbeatTopic(`completed trade data aggregation for investor existing bids: ${profile.name}`);
            console.log("Total existing bid amount: " +
                profile.totalBidAmount +
                " for " +
                profile.name);
            return true;
        }
        function isWithinSupplierList(profile, offer) {
            if (!profile.suppliers) {
                return true;
            }
            let isSupplierOK = false;
            profile.suppliers.forEach(supplier => {
                if (offer.supplier ===
                    `resource:com.oneconnect.biz.Supplier#${supplier.split("#")[1]}`) {
                    isSupplierOK = true;
                }
            });
            if (!isSupplierOK) {
                invalidSummary.isValidSupplier++;
            }
            return isSupplierOK;
        }
        function isWithinSectorList(profile, offer) {
            if (!profile.sectors) {
                return true;
            }
            let isSectorOK = false;
            profile.sectors.forEach(sector => {
                if (offer.sector ===
                    `resource:com.oneconnect.biz.Sector#${sector.split("#")[1]}`) {
                    isSectorOK = true;
                }
            });
            if (!isSectorOK) {
                invalidSummary.isValidSector++;
            }
            return isSectorOK;
        }
        async function isAccountBalanceOK(profile) {
            //TODO - connect to Stellar/WorldWire here
            return true;
        }
        function shuffleOffers() {
            for (let i = offers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [offers[i], offers[j]] = [offers[j], offers[i]];
            }
            console.log("########## shuffled offers ........");
        }
    }
}
exports.Matcher = Matcher;
//# sourceMappingURL=matcher.js.map