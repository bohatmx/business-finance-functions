"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const Data = require("../models/data");
class Matcher {
    static async match(profiles, orders, offers) {
        console.log("## start matching ............");
        const units = [];
        let pOffers = offers;
        let invalidCount = 0;
        let loopCount = 0;
        const MAX_LOOPS = 1;
        console.log('getting each profiles total existing bids ...');
        for (const prof of profiles) {
            await getInvestorBidTotal(prof);
        }
        await initializeLoop();
        console.log("Returning execution units to caller, units: " + units.length);
        return units;
        async function initializeLoop() {
            console.log("##### initializeLoop: loopCount: " +
                loopCount +
                " units: " +
                units.length +
                " offers outstanding: " +
                pOffers.length);
            for (const offer of pOffers) {
                if (units.length > 99) {
                    return units;
                }
                for (const order of orders) {
                    const isMatched = await findInvestorMatch(offer, order);
                    if (isMatched) {
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
            console.log("######## loop complete, next loop: " +
                loopCount +
                " MAX_LOOPS: " +
                MAX_LOOPS +
                " invalidCount: " +
                invalidCount);
            if (invalidCount > 0) {
                invalidCount = 0;
                if (loopCount < MAX_LOOPS) {
                    await initializeLoop();
                }
            }
            console.log("##### MATCHING COMPLETE: units: " +
                units.length +
                " offers outstanding: " +
                pOffers.length);
            return units;
        }
        async function findInvestorMatch(mOffer, mOrder) {
            for (const profile of profiles) {
                const isValidBid = await validate(profile, mOffer);
                if (isValidBid) {
                    const unit = new Data.ExecutionUnit();
                    unit.offer = mOffer;
                    unit.profile = profile;
                    unit.order = mOrder;
                    units.push(unit);
                    profile.totalBidAmount += mOffer.offerAmount;
                    console.log("## valid execution unit created and added to list: " + units.length + ' invalid attempts: ' + invalidCount);
                    return isValidBid;
                }
                else {
                    invalidCount++;
                }
            }
            return false;
        }
        async function validate(profile, offer) {
            let isValidTotal = false;
            const isValidSupplier = isWithinSupplierList(profile, offer);
            const isValidSector = isWithinSectorList(profile, offer);
            const isValidAccountBalance = await isAccountBalanceOK(profile);
            let isValidInvoiceAmount = false;
            let isValidMinimumDiscount = false;
            const mTotal = profile.totalBidAmount + offer.offerAmount;
            if (mTotal < profile.maxInvestableAmount || mTotal === profile.maxInvestableAmount) {
                isValidTotal = true;
            }
            if (offer.discountPercent > profile.minimumDiscount ||
                offer.discountPercent === profile.minimumDiscount) {
                isValidMinimumDiscount = true;
            }
            if (offer.offerAmount < profile.maxInvoiceAmount ||
                offer.offerAmount === profile.maxInvoiceAmount) {
                isValidInvoiceAmount = true;
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
                const invalid = {
                    date: new Date().toISOString(),
                    offer: JSON.stringify(offer),
                    profile: JSON.stringify(profile),
                    validTotal: isValidTotal,
                    validSector: isValidSector,
                    validSupplier: isValidSupplier,
                    validInvoiceAmount: isValidInvoiceAmount,
                    validAccountBalance: isValidAccountBalance,
                    validMinimumDiscount: isValidMinimumDiscount
                };
                await admin
                    .firestore()
                    .collection("invalidAutoTrades")
                    .add(invalid)
                    .catch(e => {
                    console.log(e);
                });
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
            console.log('Total existing bid amount: ' + profile.totalBidAmount + ' for ' + profile.name);
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
            return isSectorOK;
        }
        async function isAccountBalanceOK(profile) {
            //TODO - connect to Stellar/WorldWire here
            return true;
        }
    }
}
exports.Matcher = Matcher;
//# sourceMappingURL=matcher.js.map