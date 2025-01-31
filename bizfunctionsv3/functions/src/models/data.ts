import { JsonObject, JsonProperty } from "json2typescript";

@JsonObject("AutoTradeOrder")
export class AutoTradeOrder {
  @JsonProperty("name", String)
  name: string = undefined;
  @JsonProperty("autoTradeOrderId", String)
  autoTradeOrderId: string = undefined;
  @JsonProperty("date", String)
  date: string = undefined;
  @JsonProperty("investorName", String)
  investorName: string = undefined;
  @JsonProperty("dateCancelled", String)
  dateCancelled: string = undefined;
  @JsonProperty("wallet", String)
  wallet: string = undefined;
  @JsonProperty("investorProfile", String)
  investorProfile: string = undefined;
  @JsonProperty("user", String)
  user: string = undefined;
  @JsonProperty("investor", String)
  investor: string = undefined;
  @JsonProperty("isCancelled", Boolean)
  isCancelled: boolean = undefined;
}
@JsonObject("InvestorProfile")
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
  investorDocRef: string;
  @JsonProperty()
  sectors: string[];
  @JsonProperty()
  suppliers: string[];
  @JsonProperty()
  totalBidAmount: number = 0.0;
}
@JsonObject("Offer")
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
  customer: string;
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
@JsonObject("InvoiceBid")
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
  supplier: string;
  @JsonProperty()
  invoiceBidAcceptance: string;
  @JsonProperty()
  investorName: string;
  @JsonProperty()
  isSettled: boolean;
  @JsonProperty()
  supplierName: string;
  @JsonProperty()
  customerName: string;
  @JsonProperty()
  customer: string;
  @JsonProperty()
  supplierDocRef: string;
  @JsonProperty()
  offerDocRef: string;
  @JsonProperty()
  investorDocRef: string;
  @JsonProperty()
  intDate: number;
}
@JsonObject("Supplier")
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
@JsonObject("Investor")
export class Investor {
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
}
@JsonObject("AutoTradeStart")
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
@JsonObject("Balance")
export class Balance {
  @JsonProperty()
  balance: string;
  @JsonProperty()
  asset_type: string;
}
@JsonObject("Account")
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
@JsonObject("ExecutionUnit")
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
@JsonObject("DeliveryNote")
export class DeliveryNote {
  @JsonProperty()
  deliveryNoteId: string;
  @JsonProperty()
  govtEntity: string;
  @JsonProperty()
  user: string;
  @JsonProperty()
  supplier: string;
  @JsonProperty()
  supplierName: string;
  @JsonProperty()
  date: string;
  @JsonProperty()
  amount: number;
  @JsonProperty()
  vat: number;
  @JsonProperty()
  totalAmount: number;
  @JsonProperty()
  supplierDocumentRef: string;
  @JsonProperty()
  purchaseOrderNumber: string;
  @JsonProperty()
  customerName: string;
  @JsonProperty()
  purchaseOrder: string;
  @JsonProperty()
  intDate: number;
}
@JsonObject("Wallet")
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
@JsonObject("PurchaseOrder")
export class PurchaseOrder {
  @JsonProperty()
  purchaseOrderId: string;

  @JsonProperty()
  supplier: string;
  @JsonProperty()
  govtEntity: string;
  @JsonProperty()
  date: string;
  @JsonProperty()
  intDate: number;
  @JsonProperty()
  amount: number;
  @JsonProperty()
  purchaseOrderNumber: string;
  @JsonProperty()
  purchaserName: string;
  @JsonProperty()
  supplierName: string;
  @JsonProperty()
  supplierDocumentRef: string;
  @JsonProperty()
  govtDocumentRef: string;
  @JsonProperty()
  documentReference: string;
}

@JsonObject("InvalidSummary")
export class InvalidSummary {
  @JsonProperty()
  isValidInvoiceAmount: number = 0;
  @JsonProperty()
  isValidBalance: number = 0;
  @JsonProperty()
  isValidSector: number = 0;
  @JsonProperty()
  isValidSupplier: number = 0;
  @JsonProperty()
  isValidMinimumDiscount: number = 0;
  @JsonProperty()
  isValidInvestorMax: number = 0;
  @JsonProperty()
  invalidTrades: number = 0;
  @JsonProperty()
  totalOpenOffers: number = 0;
  @JsonProperty()
  totalUnits: number = 0;
  @JsonProperty()
  date: string = new Date().toISOString();

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
}
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
@JsonObject("Invoice")
export class Invoice {
  @JsonProperty()
  invoiceId: string;

  @JsonProperty()
  purchaseOrder: string;
  @JsonProperty()
  invoiceNumber: string;
  @JsonProperty()
  date: string;
  @JsonProperty()
  intDate: number;
  @JsonProperty()
  amount: number;
  @JsonProperty()
  purchaseOrderNumber: string;
  @JsonProperty()
  customerName: string;
  @JsonProperty()
  supplierName: string;
  @JsonProperty()
  govtEntity: string;
  @JsonProperty()
  totalAmount: number;
  @JsonProperty()
  valueAddedTax: number;
  @JsonProperty()
  supplier: string;
  @JsonProperty()
  isOnOffer: boolean;
  @JsonProperty()
  isSettled: boolean;
  @JsonProperty()
  contractURL: string;
  @JsonProperty()
  deliveryNote: string;
}
