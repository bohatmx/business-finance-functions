import { JsonObject, JsonProperty } from "json2typescript";

@JsonObject('AutoTradeOrder')
export class AutoTradeOrder {
    @JsonProperty("name", String)
    name: string = undefined;
    @JsonProperty("autoTradeOrderId", String)
    autoTradeOrderId: string = undefined;
    @JsonProperty('date', String)
    date: string = undefined;
    @JsonProperty('investorName', String)
    investorName: string = undefined;
    @JsonProperty('dateCancelled', String)
    dateCancelled: string = undefined;
    @JsonProperty('wallet', String)
    wallet: string = undefined;
    @JsonProperty('investorProfile', String)
    investorProfile: string = undefined;
    @JsonProperty('user', String)
    user: string = undefined;
    @JsonProperty('investor', String)
    investor: string = undefined;
    @JsonProperty('isCancelled', Boolean)
    isCancelled: boolean = undefined;
}
@JsonObject('InvestorProfile')
export class InvestorProfile {
    @JsonProperty()
    profileId: string;
    @JsonProperty()
    name: string;
    @JsonProperty()
    cellphone: string;
    @JsonProperty()
    email: string;
    @JsonProperty()
    date: string;
    @JsonProperty()
    maxInvestableAmount: number;
    @JsonProperty()
    maxInvoiceAmount: number;
    @JsonProperty()
    minimumDiscount: number;
    @JsonProperty()
    investor: string;
    @JsonProperty()
    sectors: string[];
    @JsonProperty()
    suppliers: string[]
    @JsonProperty()
    totalBidAmount: number = 0.00;
}
@JsonObject('Offer')
export class Offer {
    @JsonProperty()
    offerId: string;
    @JsonProperty()
    intDate: number;
    @JsonProperty()
    startTime: string;
    @JsonProperty()
    endTime: string;
    @JsonProperty()
    offerCancellation: string;
    @JsonProperty()
    invoice: string;
    @JsonProperty()
    documentReference: string;
    @JsonProperty()
    purchaseOrder: string;
    @JsonProperty()
    participantId: string;
    @JsonProperty()
    wallet: string;
    @JsonProperty()
    user: string;
    @JsonProperty()
    date: string;
    @JsonProperty()
    supplier: string;
    @JsonProperty()
    contractURL: string;
    @JsonProperty()
    invoiceDocumentRef: string;
    @JsonProperty()
    supplierName: string;
    @JsonProperty()
    customerName: string;
    @JsonProperty()
    dateClosed: string;
    @JsonProperty()
    supplierDocumentRef: string;
    @JsonProperty()
    supplierFCMToken: string;
    @JsonProperty()
    invoiceAmount: number;
    @JsonProperty()
    offerAmount: number;
    @JsonProperty()
    discountPercent: number;
    @JsonProperty()
    isCancelled: boolean;
    @JsonProperty()
    isOpen: boolean;
    @JsonProperty()
    sector: string;
    @JsonProperty()
    sectorName: string;
    @JsonProperty()
    invoiceBids: string[];
}
@JsonObject('InvoiceBid')
export class InvoiceBid {
    @JsonProperty()
    invoiceBidId: string;
    @JsonProperty()
    startTime: string;
    @JsonProperty()
    endTime: string;
    @JsonProperty()
    reservePercent: number;
    @JsonProperty()
    amount: number;
    @JsonProperty()
    discountPercent: number;
    @JsonProperty()
    offer: string;
    @JsonProperty()
    supplierFCMToken: string;
    @JsonProperty()
    wallet: string;
    @JsonProperty()
    investor: string;
    @JsonProperty()
    date: string;
    @JsonProperty()
    autoTradeOrder: string;
    @JsonProperty()
    user: string;
    @JsonProperty()
    documentReference: string;
    @JsonProperty()
    supplierId: string;
    @JsonProperty()
    invoiceBidAcceptance: string;
    @JsonProperty()
    investorName: string;
    @JsonProperty()
    isSettled: boolean;
}
@JsonObject('Supplier')
export class Supplier {
    @JsonProperty()
    participantId: string;
    @JsonProperty()
    name: string;
    @JsonProperty()
    cellphone: string;
    @JsonProperty()
    email: string;
    @JsonProperty()
    documentReference: string;
    @JsonProperty()
    description: string;
    @JsonProperty()
    address: string;
    @JsonProperty()
    dateRegistered: string;
    @JsonProperty()
    sector: string;
    @JsonProperty()
    country: string;

}
@JsonObject('AutoTradeStart')
export class AutoTradeStart {
    @JsonProperty()
    dateStarted: string;
    @JsonProperty()
    dateEnded: string;
    @JsonProperty()
    possibleTrades: number;
    @JsonProperty()
    possibleAmount: number;
    @JsonProperty()
    elapsedSeconds: number;
}
@JsonObject('Balance')
export class Balance {
    @JsonProperty()
    balance: string;
    @JsonProperty()
    asset_type: string;
}
@JsonObject('Account')
export class Account {
    @JsonProperty()
    id;
    @JsonProperty()
    paging_token;
    @JsonProperty()
    account_id;
    @JsonProperty()
    sequence;
    @JsonProperty()
    balances: Balance[];
}
@JsonObject('ExecutionUnit')
export class ExecutionUnit {
    @JsonProperty()
    order: AutoTradeOrder;
    @JsonProperty()
    profile: InvestorProfile;
    @JsonProperty()
    offer: Offer;
    @JsonProperty()
    account: Account;
    @JsonProperty()
    date: string;

    static Success = 0;
    static ErrorInvalidTrade = 1;
    static ErrorBadBid = 2;
}
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
@JsonObject('Wallet')
export class Wallet {
    @JsonProperty()
    dateRegistered: string;
    @JsonProperty()
    name: string;
    @JsonProperty()
    govtEntity: string;
    @JsonProperty()
    supplier: string;
    @JsonProperty()
    investor: string;
    @JsonProperty()
    oneConnect: string;
    @JsonProperty()
    stellarPublicKey: string;

}
