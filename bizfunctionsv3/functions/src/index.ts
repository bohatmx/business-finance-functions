import * as admin from 'firebase-admin'
import * as UserAdded from './modules/user-added'
import * as UserDeleted from './modules/user-deleted'
import * as Decryptor from './modules/decryptor'
import * as Encryptor from './modules/encryptor'
import * as DirectWallet from './modules/direct-wallet'
import * as AddData from './modules/add-data'

admin.initializeApp();

export const userAdded = UserAdded.userCreated
export const userDeleted = UserDeleted.userDeleted
export const decryptor = Decryptor.decrypt
export const encryptor = Encryptor.encrypt
export const directWallet = DirectWallet.directWallet
export const addData = AddData.addData

