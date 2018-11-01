"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Constants {
    static getDebugURL() {
        return this.DEBUG_URL;
    }
    static getReleaseURL() {
        return this.RELEASE_URL;
    }
}
Constants.DEBUG_URL = 'https://bfnrestv3.eu-gb.mybluemix.net/api/'; //FIBRE
Constants.RELEASE_URL = 'https://bfnrestv3.eu-gb.mybluemix.net/api/'; //CLOUD
Constants.NameSpace = 'resource:com.oneconnect.biz.';
Constants.DEBUG_FUNCTIONS_URL = 'https://us-central1-business-finance-dev.cloudfunctions.net/'; //FIBRE
Constants.RELEASE_FUNCTIONS_URL = 'https://us-central1-business-finance-prod.cloudfunctions.net/'; //CLOUD
Constants.TOPIC_PURCHASE_ORDERS = 'purchaseOrders';
Constants.TOPIC_DELIVERY_NOTES = 'deliveryNotes';
Constants.TOPIC_DELIVERY_ACCEPTANCES = 'deliveryAcceptances';
Constants.TOPIC_INVOICES = 'invoices';
Constants.TOPIC_INVOICE_ACCEPTANCES = 'invoiceAcceptances';
Constants.TOPIC_OFFERS = 'offers';
Constants.TOPIC_AUTO_TRADES = 'autoTrades';
Constants.TOPIC_GENERAL_MESSAGE = 'messages';
Constants.TOPIC_INVOICE_BIDS = 'invoiceBids';
Constants.TOPIC_SUPPLIERS = 'suppliers';
Constants.TOPIC_CUSTOMERS = 'customers';
Constants.TOPIC_INVESTORS = 'investors';
exports.Constants = Constants;
//# sourceMappingURL=constants.js.map