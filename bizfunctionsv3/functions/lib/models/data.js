"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const json2typescript_1 = require("json2typescript");
let AutoTradeOrder = class AutoTradeOrder {
    constructor() {
        this.name = undefined;
        this.autoTradeOrderId = undefined;
        this.date = undefined;
        this.investorName = undefined;
        this.dateCancelled = undefined;
        this.wallet = undefined;
        this.investorProfile = undefined;
        this.user = undefined;
        this.investor = undefined;
        this.isCancelled = undefined;
    }
};
__decorate([
    json2typescript_1.JsonProperty("name", String),
    __metadata("design:type", String)
], AutoTradeOrder.prototype, "name", void 0);
__decorate([
    json2typescript_1.JsonProperty("autoTradeOrderId", String),
    __metadata("design:type", String)
], AutoTradeOrder.prototype, "autoTradeOrderId", void 0);
__decorate([
    json2typescript_1.JsonProperty("date", String),
    __metadata("design:type", String)
], AutoTradeOrder.prototype, "date", void 0);
__decorate([
    json2typescript_1.JsonProperty("investorName", String),
    __metadata("design:type", String)
], AutoTradeOrder.prototype, "investorName", void 0);
__decorate([
    json2typescript_1.JsonProperty("dateCancelled", String),
    __metadata("design:type", String)
], AutoTradeOrder.prototype, "dateCancelled", void 0);
__decorate([
    json2typescript_1.JsonProperty("wallet", String),
    __metadata("design:type", String)
], AutoTradeOrder.prototype, "wallet", void 0);
__decorate([
    json2typescript_1.JsonProperty("investorProfile", String),
    __metadata("design:type", String)
], AutoTradeOrder.prototype, "investorProfile", void 0);
__decorate([
    json2typescript_1.JsonProperty("user", String),
    __metadata("design:type", String)
], AutoTradeOrder.prototype, "user", void 0);
__decorate([
    json2typescript_1.JsonProperty("investor", String),
    __metadata("design:type", String)
], AutoTradeOrder.prototype, "investor", void 0);
__decorate([
    json2typescript_1.JsonProperty("isCancelled", Boolean),
    __metadata("design:type", Boolean)
], AutoTradeOrder.prototype, "isCancelled", void 0);
AutoTradeOrder = __decorate([
    json2typescript_1.JsonObject("AutoTradeOrder")
], AutoTradeOrder);
exports.AutoTradeOrder = AutoTradeOrder;
let InvestorProfile = class InvestorProfile {
    constructor() {
        this.totalBidAmount = 0.0;
    }
};
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvestorProfile.prototype, "profileId", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvestorProfile.prototype, "name", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvestorProfile.prototype, "cellphone", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvestorProfile.prototype, "email", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvestorProfile.prototype, "date", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], InvestorProfile.prototype, "maxInvestableAmount", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], InvestorProfile.prototype, "maxInvoiceAmount", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], InvestorProfile.prototype, "minimumDiscount", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvestorProfile.prototype, "investor", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvestorProfile.prototype, "investorDocRef", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Array)
], InvestorProfile.prototype, "sectors", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Array)
], InvestorProfile.prototype, "suppliers", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], InvestorProfile.prototype, "totalBidAmount", void 0);
InvestorProfile = __decorate([
    json2typescript_1.JsonObject("InvestorProfile")
], InvestorProfile);
exports.InvestorProfile = InvestorProfile;
let Offer = class Offer {
};
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "offerId", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], Offer.prototype, "intDate", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "startTime", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "endTime", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "offerCancellation", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "invoice", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "documentReference", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "purchaseOrder", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "participantId", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "wallet", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "user", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "date", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "supplier", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "contractURL", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "invoiceDocumentRef", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "supplierName", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "customerName", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "customer", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "dateClosed", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "supplierDocumentRef", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "supplierFCMToken", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], Offer.prototype, "invoiceAmount", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], Offer.prototype, "offerAmount", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], Offer.prototype, "discountPercent", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Boolean)
], Offer.prototype, "isCancelled", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Boolean)
], Offer.prototype, "isOpen", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "sector", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Offer.prototype, "sectorName", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Array)
], Offer.prototype, "invoiceBids", void 0);
Offer = __decorate([
    json2typescript_1.JsonObject("Offer")
], Offer);
exports.Offer = Offer;
/*
InvoiceBid(
      {this.invoiceBidId,
      this.startTime,
      this.endTime,
      this.reservePercent,
      this.amount,
      this.discountPercent,
      this.offer,
      this.investor,
      this.user,
      this.investorName,
      this.date,
      this.autoTradeOrder,
      this.wallet,
      this.isSettled,
      this.supplier,
      this.supplierDocRef,
      this.offerDocRef,
      this.investorDocRef,
      this.supplierFCMToken,
      this.investorFCMToken,
      this.customerFCMToken,
      this.documentReference,
      this.invoiceBidAcceptance,
      this.supplierName,
      this.customerName,
      this.customer});
*/
let InvoiceBid = class InvoiceBid {
};
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvoiceBid.prototype, "invoiceBidId", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvoiceBid.prototype, "startTime", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvoiceBid.prototype, "endTime", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], InvoiceBid.prototype, "reservePercent", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], InvoiceBid.prototype, "amount", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], InvoiceBid.prototype, "discountPercent", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvoiceBid.prototype, "offer", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvoiceBid.prototype, "supplierFCMToken", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvoiceBid.prototype, "wallet", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvoiceBid.prototype, "investor", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvoiceBid.prototype, "date", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvoiceBid.prototype, "autoTradeOrder", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvoiceBid.prototype, "user", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvoiceBid.prototype, "documentReference", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvoiceBid.prototype, "supplier", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvoiceBid.prototype, "invoiceBidAcceptance", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvoiceBid.prototype, "investorName", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Boolean)
], InvoiceBid.prototype, "isSettled", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvoiceBid.prototype, "supplierName", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvoiceBid.prototype, "customerName", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvoiceBid.prototype, "customer", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvoiceBid.prototype, "supplierDocRef", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvoiceBid.prototype, "offerDocRef", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvoiceBid.prototype, "investorDocRef", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], InvoiceBid.prototype, "intDate", void 0);
InvoiceBid = __decorate([
    json2typescript_1.JsonObject("InvoiceBid")
], InvoiceBid);
exports.InvoiceBid = InvoiceBid;
let Supplier = class Supplier {
};
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Supplier.prototype, "participantId", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Supplier.prototype, "name", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Supplier.prototype, "cellphone", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Supplier.prototype, "email", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Supplier.prototype, "documentReference", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Supplier.prototype, "description", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Supplier.prototype, "address", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Supplier.prototype, "dateRegistered", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Supplier.prototype, "sector", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Supplier.prototype, "country", void 0);
Supplier = __decorate([
    json2typescript_1.JsonObject("Supplier")
], Supplier);
exports.Supplier = Supplier;
let Investor = class Investor {
};
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Investor.prototype, "participantId", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Investor.prototype, "name", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Investor.prototype, "cellphone", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Investor.prototype, "email", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Investor.prototype, "documentReference", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Investor.prototype, "description", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Investor.prototype, "address", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Investor.prototype, "dateRegistered", void 0);
Investor = __decorate([
    json2typescript_1.JsonObject("Investor")
], Investor);
exports.Investor = Investor;
let AutoTradeStart = class AutoTradeStart {
};
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], AutoTradeStart.prototype, "dateStarted", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], AutoTradeStart.prototype, "dateEnded", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], AutoTradeStart.prototype, "possibleTrades", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], AutoTradeStart.prototype, "possibleAmount", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], AutoTradeStart.prototype, "elapsedSeconds", void 0);
AutoTradeStart = __decorate([
    json2typescript_1.JsonObject("AutoTradeStart")
], AutoTradeStart);
exports.AutoTradeStart = AutoTradeStart;
let Balance = class Balance {
};
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Balance.prototype, "balance", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Balance.prototype, "asset_type", void 0);
Balance = __decorate([
    json2typescript_1.JsonObject("Balance")
], Balance);
exports.Balance = Balance;
let Account = class Account {
};
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Object)
], Account.prototype, "id", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Object)
], Account.prototype, "paging_token", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Object)
], Account.prototype, "account_id", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Object)
], Account.prototype, "sequence", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Array)
], Account.prototype, "balances", void 0);
Account = __decorate([
    json2typescript_1.JsonObject("Account")
], Account);
exports.Account = Account;
let ExecutionUnit = class ExecutionUnit {
};
ExecutionUnit.Success = 0;
ExecutionUnit.ErrorInvalidTrade = 1;
ExecutionUnit.ErrorBadBid = 2;
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", AutoTradeOrder)
], ExecutionUnit.prototype, "order", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", InvestorProfile)
], ExecutionUnit.prototype, "profile", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Offer)
], ExecutionUnit.prototype, "offer", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Account)
], ExecutionUnit.prototype, "account", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], ExecutionUnit.prototype, "date", void 0);
ExecutionUnit = __decorate([
    json2typescript_1.JsonObject("ExecutionUnit")
], ExecutionUnit);
exports.ExecutionUnit = ExecutionUnit;
let DeliveryNote = class DeliveryNote {
};
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], DeliveryNote.prototype, "deliveryNoteId", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], DeliveryNote.prototype, "govtEntity", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], DeliveryNote.prototype, "user", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], DeliveryNote.prototype, "supplier", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], DeliveryNote.prototype, "supplierName", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], DeliveryNote.prototype, "date", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], DeliveryNote.prototype, "amount", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], DeliveryNote.prototype, "vat", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], DeliveryNote.prototype, "totalAmount", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], DeliveryNote.prototype, "supplierDocumentRef", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], DeliveryNote.prototype, "purchaseOrderNumber", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], DeliveryNote.prototype, "customerName", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], DeliveryNote.prototype, "purchaseOrder", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], DeliveryNote.prototype, "intDate", void 0);
DeliveryNote = __decorate([
    json2typescript_1.JsonObject("DeliveryNote")
], DeliveryNote);
exports.DeliveryNote = DeliveryNote;
let Wallet = class Wallet {
};
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Wallet.prototype, "dateRegistered", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Wallet.prototype, "name", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Wallet.prototype, "govtEntity", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Wallet.prototype, "supplier", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Wallet.prototype, "investor", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Wallet.prototype, "oneConnect", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Wallet.prototype, "stellarPublicKey", void 0);
Wallet = __decorate([
    json2typescript_1.JsonObject("Wallet")
], Wallet);
exports.Wallet = Wallet;
let PurchaseOrder = class PurchaseOrder {
};
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "purchaseOrderId", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "supplier", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "govtEntity", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "date", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], PurchaseOrder.prototype, "intDate", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], PurchaseOrder.prototype, "amount", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "purchaseOrderNumber", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "purchaserName", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "supplierName", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "supplierDocumentRef", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "govtDocumentRef", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "documentReference", void 0);
PurchaseOrder = __decorate([
    json2typescript_1.JsonObject("PurchaseOrder")
], PurchaseOrder);
exports.PurchaseOrder = PurchaseOrder;
let InvalidSummary = class InvalidSummary {
    constructor() {
        this.isValidInvoiceAmount = 0;
        this.isValidBalance = 0;
        this.isValidSector = 0;
        this.isValidSupplier = 0;
        this.isValidMinimumDiscount = 0;
        this.isValidInvestorMax = 0;
        this.invalidTrades = 0;
        this.totalOpenOffers = 0;
        this.totalUnits = 0;
        this.date = new Date().toISOString();
    }
    toJSON() {
        return {
            isValidInvoiceAmount: this.isValidInvoiceAmount,
            isValidBalance: this.isValidBalance,
            isValidSector: this.isValidSector,
            isValidSupplier: this.isValidSupplier,
            isValidMinimumDiscount: this.isValidMinimumDiscount,
            isValidInvestorMax: this.isValidInvestorMax,
            invalidTrades: this.invalidTrades,
            totalOpenOffers: this.totalOpenOffers,
            totalUnits: this.totalUnits,
            date: this.date
        };
    }
};
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], InvalidSummary.prototype, "isValidInvoiceAmount", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], InvalidSummary.prototype, "isValidBalance", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], InvalidSummary.prototype, "isValidSector", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], InvalidSummary.prototype, "isValidSupplier", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], InvalidSummary.prototype, "isValidMinimumDiscount", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], InvalidSummary.prototype, "isValidInvestorMax", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], InvalidSummary.prototype, "invalidTrades", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], InvalidSummary.prototype, "totalOpenOffers", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], InvalidSummary.prototype, "totalUnits", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], InvalidSummary.prototype, "date", void 0);
InvalidSummary = __decorate([
    json2typescript_1.JsonObject("InvalidSummary")
], InvalidSummary);
exports.InvalidSummary = InvalidSummary;
/*
String supplier,
      purchaseOrder,
      invoiceId,
      deliveryNote,
      company,
      govtEntity,
      wallet,
      user,
      invoiceNumber,
      description,
      reference,
      documentReference,
      supplierDocumentRef,
      govtDocumentRef,
      companyDocumentRef,
      supplierContract,
      contractDocumentRef,
      contractURL,
      companyInvoiceSettlement,
      offer,
      invoiceAcceptance,
      deliveryAcceptance,
      govtInvoiceSettlement,
      supplierName;
  bool isOnOffer, isSettled;
  String date, datePaymentRequired;
  String customerName, purchaseOrderNumber;
  List<String> investorInvoiceSettlements;
  double amount, totalAmount, valueAddedTax;

*/
let Invoice = class Invoice {
};
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Invoice.prototype, "invoiceId", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Invoice.prototype, "purchaseOrder", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Invoice.prototype, "invoiceNumber", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Invoice.prototype, "date", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], Invoice.prototype, "intDate", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], Invoice.prototype, "amount", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Invoice.prototype, "purchaseOrderNumber", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Invoice.prototype, "customerName", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Invoice.prototype, "supplierName", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Invoice.prototype, "govtEntity", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], Invoice.prototype, "totalAmount", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Number)
], Invoice.prototype, "valueAddedTax", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Invoice.prototype, "supplier", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Boolean)
], Invoice.prototype, "isOnOffer", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", Boolean)
], Invoice.prototype, "isSettled", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Invoice.prototype, "contractURL", void 0);
__decorate([
    json2typescript_1.JsonProperty(),
    __metadata("design:type", String)
], Invoice.prototype, "deliveryNote", void 0);
Invoice = __decorate([
    json2typescript_1.JsonObject("Invoice")
], Invoice);
exports.Invoice = Invoice;
//# sourceMappingURL=data.js.map