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

admin.initializeApp();

export const userAdded = UserAdded.userCreated
export const userDeleted = UserDeleted.userDeleted
export const decryptor = Decryptor.decrypt
export const encryptor = Encryptor.encrypt
export const directWallet = DirectWallet.directWallet
export const addData = AddData.addData
export const registerPurchaseOrder = RegisterPurchaseOrder.registerPurchaseOrder
export const registerDeliveryNote = RegisterDeliveryNote.registerDeliveryNote
export const registerInvoice = RegisterInvoice.registerInvoice

