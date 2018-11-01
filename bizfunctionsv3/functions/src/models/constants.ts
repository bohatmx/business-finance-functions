export class Constants {

    static DEBUG_URL = 'https://bfnrestv3.eu-gb.mybluemix.net/api/'; //FIBRE
    static RELEASE_URL = 'https://bfnrestv3.eu-gb.mybluemix.net/api/'; //CLOUD
    static NameSpace = 'resource:com.oneconnect.biz.';

    static DEBUG_FUNCTIONS_URL = 'https://us-central1-business-finance-dev.cloudfunctions.net/'; //FIBRE
    static RELEASE_FUNCTIONS_URL= 'https://us-central1-business-finance-prod.cloudfunctions.net/'; //CLOUD

    static TOPIC_PURCHASE_ORDERS = 'purchaseOrders'
    static TOPIC_DELIVERY_NOTES = 'deliveryNotes'
    static TOPIC_DELIVERY_ACCEPTANCES = 'deliveryAcceptances'
    static TOPIC_INVOICES = 'invoices'
    static TOPIC_INVOICE_ACCEPTANCES = 'invoiceAcceptances'
    static TOPIC_OFFERS = 'offers'
    static TOPIC_AUTO_TRADES = 'autoTrades'
    static TOPIC_GENERAL_MESSAGE = 'messages'
    static TOPIC_INVOICE_BIDS = 'invoiceBids'
    static TOPIC_SUPPLIERS = 'suppliers'
    static TOPIC_CUSTOMERS = 'customers'
    static TOPIC_INVESTORS = 'investors'

    static getDebugURL() {
        return this.DEBUG_URL;
    }
    static getReleaseURL() {
        return this.RELEASE_URL;
    }
}
