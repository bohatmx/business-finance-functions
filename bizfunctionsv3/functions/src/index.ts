import * as admin from 'firebase-admin'
import * as Hello from './modules/hello'
import * as GovtInvoice from './modules/govt-invoice-created'
import * as GovtDeliveryNote from './modules/govt-delivery-note-created'
import * as WalletAdded from './modules/wallet-added'
import * as InvoiceBid from './modules/invoice-bid-created'
import * as Offer from './modules/offer-created'
import * as UserAdded from './modules/user-added'
import * as UserDeleted from './modules/user-deleted'
import * as PurchaseOrder from './modules/purchase-order-created'
import * as GovtDeliveryAcceptance from './modules/delivery-acceptance'

admin.initializeApp();

export const hello = Hello.helloWorld
export const walletAdded = WalletAdded.onWalletAdded
export const govtDeliveryNote = GovtDeliveryNote.govtDeliveryNoteCreated
export const govtDeliveryAcceptance = GovtDeliveryAcceptance.deliveryAcceptanceCreated
export const govtInvoice = GovtInvoice.govtInvoiceCreated
export const invoiceBid = InvoiceBid.invoiceBidCreated
export const offer = Offer.offerCreated
export const purchaseOrder = PurchaseOrder.purchaseOrderCreated
export const userAdded = UserAdded.userCreated
export const userDeleted = UserDeleted.userDeleted

