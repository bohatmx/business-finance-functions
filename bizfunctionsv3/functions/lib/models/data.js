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
    json2typescript_1.JsonProperty('date', String),
    __metadata("design:type", String)
], AutoTradeOrder.prototype, "date", void 0);
__decorate([
    json2typescript_1.JsonProperty('investorName', String),
    __metadata("design:type", String)
], AutoTradeOrder.prototype, "investorName", void 0);
__decorate([
    json2typescript_1.JsonProperty('dateCancelled', String),
    __metadata("design:type", String)
], AutoTradeOrder.prototype, "dateCancelled", void 0);
__decorate([
    json2typescript_1.JsonProperty('wallet', String),
    __metadata("design:type", String)
], AutoTradeOrder.prototype, "wallet", void 0);
__decorate([
    json2typescript_1.JsonProperty('investorProfile', String),
    __metadata("design:type", String)
], AutoTradeOrder.prototype, "investorProfile", void 0);
__decorate([
    json2typescript_1.JsonProperty('user', String),
    __metadata("design:type", String)
], AutoTradeOrder.prototype, "user", void 0);
__decorate([
    json2typescript_1.JsonProperty('investor', String),
    __metadata("design:type", String)
], AutoTradeOrder.prototype, "investor", void 0);
__decorate([
    json2typescript_1.JsonProperty('isCancelled', Boolean),
    __metadata("design:type", Boolean)
], AutoTradeOrder.prototype, "isCancelled", void 0);
AutoTradeOrder = __decorate([
    json2typescript_1.JsonObject('AutoTradeOrder')
], AutoTradeOrder);
exports.AutoTradeOrder = AutoTradeOrder;
let InvestorProfile = class InvestorProfile {
    constructor() {
        this.totalBidAmount = 0.00;
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
    json2typescript_1.JsonObject('InvestorProfile')
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
    json2typescript_1.JsonObject('Offer')
], Offer);
exports.Offer = Offer;
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
], InvoiceBid.prototype, "supplierId", void 0);
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
InvoiceBid = __decorate([
    json2typescript_1.JsonObject('InvoiceBid')
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
    json2typescript_1.JsonObject('Supplier')
], Supplier);
exports.Supplier = Supplier;
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
    json2typescript_1.JsonObject('AutoTradeStart')
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
    json2typescript_1.JsonObject('Balance')
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
    json2typescript_1.JsonObject('Account')
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
    json2typescript_1.JsonObject('ExecutionUnit')
], ExecutionUnit);
exports.ExecutionUnit = ExecutionUnit;
/*
String stellarPublicKey;
  String dateRegistered;
  String name;
  String govtEntity;
  String company;
  String supplier;
  String procurementOffice;
  String oneConnect;
  String auditor, sourceSeed;
  String bank, secret, fcmToken, encryptedSecret;
  String investor, documentReference;
*/
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
    json2typescript_1.JsonObject('Wallet')
], Wallet);
exports.Wallet = Wallet;
//# sourceMappingURL=data.js.map