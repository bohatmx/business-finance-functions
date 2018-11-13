export class Constants {
  static DEBUG_URL = "https://bfnrestv3.eu-gb.mybluemix.net/api/"; //FIBRE
  static RELEASE_URL = "https://bfnrestv3.eu-gb.mybluemix.net/api/"; //CLOUD
  static NameSpace = "resource:com.oneconnect.biz.";

  static DEBUG_FUNCTIONS_URL =
    "https://us-central1-business-finance-dev.cloudfunctions.net/"; //FIBRE
  static RELEASE_FUNCTIONS_URL =
    "https://us-central1-business-finance-prod.cloudfunctions.net/"; //CLOUD
  static PEACH_TEST_URL = "https://test.oppwa.com/";
  static PEACH_PROD_URL = "https://oppwa.com/";

  static TOPIC_PEACH_NOTIFY = "peachNotify";
  static TOPIC_PEACH_ERROR = "peachError";
  static TOPIC_PEACH_CANCEL = "peachCancel";
  static TOPIC_PEACH_SUCCESS = "peachSuccess";
  static TOPIC_PURCHASE_ORDERS = "purchaseOrders";
  static TOPIC_DELIVERY_NOTES = "deliveryNotes";
  static TOPIC_DELIVERY_ACCEPTANCES = "deliveryAcceptances";
  static TOPIC_INVOICES = "invoices";
  static TOPIC_INVOICE_ACCEPTANCES = "invoiceAcceptances";
  static TOPIC_OFFERS = "offers";
  static TOPIC_AUTO_TRADES = "autoTrades";
  static TOPIC_GENERAL_MESSAGE = "messages";
  static TOPIC_INVOICE_BIDS = "invoiceBids";
  static TOPIC_SUPPLIERS = "suppliers";
  static TOPIC_CUSTOMERS = "customers";
  static TOPIC_INVESTORS = "investors";

  static PEACH_USERID = "8ac7a4ca66f2eab3016706c87d6013e8";
  static PEACH_PASSWORD = "6PsDWg86RJ";
  static PEACH_ENTITYID_ONCEOFF = "8ac7a4ca66f2eab3016706c9812213ec";
  static PEACH_ENTITYID_RECURRING = "8ac7a4ca66f2eab3016706c9f4c113f0";

  static getDebugURL() {
    return this.DEBUG_URL;
  }
  static getReleaseURL() {
    return this.RELEASE_URL;
  }
}
