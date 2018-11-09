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
        const MAX_UNITS = 50;
        const invalidSummary = new Data.InvalidSummary();
        invalidSummary.date = new Date().toISOString();
        let start;
        let end;
        let orderIndex = 0;
        let offerIndex = 0;
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
            orderIndex = 0;
            offerIndex = 0;
            if (units.length === MAX_UNITS || units.length > MAX_UNITS) {
                return units;
            }
            await control();
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
            await admin
                .firestore()
                .collection("invalidSummaries")
                .add(invalidSummary.toJSON())
                .catch(e => {
                console.log(e);
            });
            console.log("record written to /invalidSummaries on Firestore");
            return units;
        }
        async function control() {
            if (units.length === MAX_UNITS || units.length > MAX_UNITS) {
                return null;
            }
            if (offerIndex === pOffers.length) {
                return null;
            }
            if (orderIndex < orders.length) {
                const isValid = await findInvestorMatch(pOffers[offerIndex], orders[orderIndex]);
                if (isValid) {
                    orderIndex++;
                    offerIndex++;
                    await control();
                }
                else {
                    orderIndex++;
                    await control();
                }
            }
            else {
                orderIndex = 0;
                offerIndex++;
                if (offerIndex === pOffers.length) {
                    return null;
                }
                await control();
            }
            return null;
        }
        async function findInvestorMatch(mOffer, mOrder) {
            // console.log(
            //   `find match for ${mOrder.investorName} --> ${mOffer.supplierName} ${
            //     mOffer.offerAmount
            //   } profiles: ${profiles.length}`
            // );
            let profile;
            profiles.forEach(p => {
                if (mOrder.investorProfile ===
                    `resource:com.oneconnect.biz.InvestorProfile#${p.profileId}`) {
                    profile = p;
                }
            });
            if (profile === null) {
                console.log(`#### profile is NULL for ${mOrder.investorName}`);
                return false;
            }
            start = new Date().getTime();
            const isValidBid = await validate(profile, mOffer);
            end = new Date().getTime();
            if (isValidBid) {
                const unit = new Data.ExecutionUnit();
                unit.offer = mOffer;
                unit.profile = profile;
                unit.order = mOrder;
                units.push(unit);
                invalidSummary.totalUnits++;
                profile.totalBidAmount += mOffer.offerAmount;
                console.log(`## valid execution unit created, units: ${units.length}, added for ${unit.profile.name}, amt: ${unit.offer.offerAmount}`);
                return isValidBid;
            }
            else {
                invalidSummary.invalidTrades++;
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
            if (profile === null) {
                return false;
            }
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
                invalidSummary.isValidInvestorMax++;
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
            try {
                if (profile === null) {
                    return true;
                }
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
            catch (e) {
                console.log(e);
                console.log(`FAILED: supplier validation - for ${offer.supplierName} ${offer.offerAmount}`);
                return true;
            }
        }
        function isWithinSectorList(profile, offer) {
            try {
                if (profile === null) {
                    return true;
                }
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
            catch (e) {
                console.log(e);
                console.log(`FAILED: sector validation for ${offer.supplierName} ${offer.offerAmount}`);
                return true;
            }
        }
        async function isAccountBalanceOK(profile) {
            //TODO - connect to Stellar/WorldWire here
            return true;
        }
        function shuffleProfiles() {
            for (let i = profiles.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [profiles[i], profiles[j]] = [profiles[j], profiles[i]];
            }
        }
        function shuffleOffers() {
            for (let i = offers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [offers[i], offers[j]] = [offers[j], offers[i]];
            }
            console.log("########## shuffled offers ........");
        }
        function shuffleOrders() {
            for (let i = orders.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [orders[i], orders[j]] = [orders[j], orders[i]];
            }
            console.log("########## shuffled units ........");
        }
    }
}
exports.Matcher = Matcher;
//# sourceMappingURL=matcher.js.map