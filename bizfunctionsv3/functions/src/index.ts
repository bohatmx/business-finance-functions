import * as admin from 'firebase-admin'
import * as UserAdded from './modules/user-added'
import * as UserDeleted from './modules/user-deleted'
import * as Decryptor from './modules/decryptor'
import * as Encryptor from './modules/encryptor'
import * as DirectWallet from './modules/direct-wallet'
import * as AddData from './modules/add-data'
import * as RegisterPurchaseOrder from './modules/register_purchase_order'
import * as RegisterDeliveryNote from './modules/register_delivery_note'
import * as RegisterInvoice from './modules/register_invoice'
import * as AcceptDelivery from './modules/accept_delivery_note'
import * as AcceptInvoice from './modules/accept_invoice'
import * as MakeOffer from './modules/make-offer'
import * as UpdateOffer from './modules/update-offer'
import * as CloseOffer from './modules/close-offer'
import * as MakeInvoiceBid from './modules/make_invoice.bid'
import * as ExecuteAutoTrade from './modules/auto_trade_exec'
import * as DeleteAuthUsers from './modules/delete_auth_users'
import * as AddParticipant from './modules/add_participant'
import * as SupplierDashboard from './modules/supplier-dashboard'
import * as InvestorDashboard from './modules/investor-dashboard'
import * as OpenOffersWithPaging from './modules/open-offers-paging'
import * as InvalidSummariesAsCSV from './modules/invalid-summary-csv'
import * as OpenOfferSummary from './modules/open-offers-summary'
import * as InvestorSummary from './modules/investor-summary'
import * as PurchaseOrdersWithPaging from './modules/purchase-orders-paging'
import * as InvoicesWithPaging from './modules/invoices-paging'
import * as CustomerAdded from './modules/customer-added'
import * as SupplierAdded from './modules/supplier-added'
import * as InvestorAdded from './modules/investor-added'
import * as CustomerDashboard from './modules/customer-dashboard'
import * as DeliveryNotesWithPaging from './modules/delivery-notes-paging'
import * as PeachRequestCheckoutId from './modules/request-checkout-id'
import * as PeachReceiveNotification from './modules/peach-notification'
import * as PeachSuccess from './modules/peach-success'
import * as PeachError from './modules/peach-error'
import * as PeachCancel from './modules/peach-cancel'
import * as MakeInvestorInvoiceSettlement from './modules/make_investor_invoice_settlement'
import * as DataExport from './modules/export-trigger'
import * as OffersQuery from './modules/offers-query'

admin.initializeApp();

export const queryOffers = OffersQuery.queryOffers
export const exportData = DataExport.exportData

export const peachCancel = PeachCancel.peachCancel
export const peachError = PeachError.peachError
export const peachSuccess = PeachSuccess.peachSuccess
export const peachNotify = PeachReceiveNotification.peachNotify

export const makeInvestorInvoiceSettlement = MakeInvestorInvoiceSettlement.makeInvestorInvoiceSettlement
export const requestCheckOutId = PeachRequestCheckoutId.requestCheckOutId
export const getDeliveryNotesWithPaging = DeliveryNotesWithPaging.getDeliveryNotesWithPaging
export const customerDashboard = CustomerDashboard.customerDashboard
export const customerAdded = CustomerAdded.customerAdded
export const supplierAdded = SupplierAdded.supplierAdded
export const investorAdded = InvestorAdded.investorAdded

export const getInvoicesWithPaging = InvoicesWithPaging.getInvoicesWithPaging
export const getPurchaseOrdersWithPaging = PurchaseOrdersWithPaging.getPurchaseOrdersWithPaging
export const getInvalidSummariesCSV = InvalidSummariesAsCSV.getInvalidSummariesCSV
export const getOpenOffersSummary = OpenOfferSummary.getOpenOffersSummary

export const userAdded = UserAdded.userCreated
export const getInvestorsSummary = InvestorSummary.getInvestorsSummary
export const userDeleted = UserDeleted.userDeleted
export const decryptor = Decryptor.decrypt
export const encryptor = Encryptor.encrypt
export const directWallet = DirectWallet.directWallet

export const addData = AddData.addData
export const registerPurchaseOrder = RegisterPurchaseOrder.registerPurchaseOrder
export const registerDeliveryNote = RegisterDeliveryNote.registerDeliveryNote
export const registerInvoice = RegisterInvoice.registerInvoice
export const acceptDeliveryNote = AcceptDelivery.acceptDeliveryNote
export const makeOffer = MakeOffer.makeOffer
export const updateOffer = UpdateOffer.updateOffer
export const closeOffer = CloseOffer.closeOffer

export const acceptInvoice = AcceptInvoice.acceptInvoice
export const makeInvoiceBid = MakeInvoiceBid.makeInvoiceBid
export const executeAutoTrade = ExecuteAutoTrade.executeAutoTrades
export const deleteAuthUsers = DeleteAuthUsers.deleteAuthUsers
export const supplierDashboard = SupplierDashboard.supplierDashboard
export const investorDashboard = InvestorDashboard.investorDashboard
export const addParticipant = AddParticipant.addParticipant
export const getOpenOffersWithPaging = OpenOffersWithPaging.getOpenOffersWithPaging

