"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const MyCrypto = require("./encryptor-util");
const StellarSdk = require('stellar-sdk');
const STARTING_BALANCE = "3";
exports.onWalletAdded = functions.firestore
    .document('wallets/{docId}')
    .onCreate((snap, context) => __awaiter(this, void 0, void 0, function* () {
    const wallet = snap.data();
    console.log('Triggered by Firestore, creating wallet on Stellar: ' + JSON.stringify(wallet));
    let server;
    console.log('####### hooking up with Stellar to generate new keys');
    const keyPair = StellarSdk.Keypair.random();
    const secret = keyPair.secret();
    const accountID = keyPair.publicKey();
    console.log("new wallet public key: " + accountID);
    console.log('new wallet secret: ' + secret);
    if (wallet.debug) {
        return getTestXLM();
    }
    else {
        try {
            console.log('### sourceSeed: ' + wallet.sourceSeed);
            const sourceKeypair = StellarSdk.Keypair.fromSecret(wallet.sourceSeed);
            const sourcePublicKey = sourceKeypair.publicKey();
            console.log('### sourcePublicKey: ' + sourcePublicKey);
            server = new StellarSdk.Server('https://horizon.stellar.org/');
            StellarSdk.Network.usePublicNetwork();
            wallet.stellarPublicKey = accountID;
            const encryptResult = yield MyCrypto.encrypt(accountID, secret);
            if (encryptResult !== 'encryption failed') {
                wallet.encryptedSecret = encryptResult;
            }
            const account = yield server.loadAccount(sourcePublicKey);
            const transaction = new StellarSdk.TransactionBuilder(account)
                .addOperation(StellarSdk.Operation.createAccount({
                destination: accountID,
                startingBalance: STARTING_BALANCE
            }))
                .build();
            console.log(')))) about to sign and submit stellar transaction ...' + wallet.name);
            transaction.sign(sourceKeypair);
            const transactionResult = yield server.submitTransaction(transaction);
            console.log(JSON.stringify(transactionResult, null, 2));
            console.log('****** Major SUCCESS!!!! Account created on Stellar Blockchain Network');
            wallet.success = true;
            return sendToDevice();
        }
        catch (error) {
            //something went boom!
            console.error(error);
            return sendFailed();
        }
    }
    function sendFailed() {
        return __awaiter(this, void 0, void 0, function* () {
            const failed = {
                'date': new Date(),
                'walletDocumentId': snap.id,
                'publicKey': accountID,
                'secret': secret,
                'name': wallet.name
            };
            yield admin.firestore().collection('walletsFailed').add(failed);
            wallet.success = false;
            const errPayload = {
                data: {
                    'messageType': 'WALLET_ERROR',
                    'json': JSON.stringify(wallet)
                },
            };
            console.log('sending message to failedWallets topic');
            yield admin.messaging().sendToTopic('failedWallets', errPayload);
            return sendToDevice();
        });
    }
    function sendToDevice() {
        return __awaiter(this, void 0, void 0, function* () {
            if (wallet.fcmToken) {
                wallet.documentReference = snap.id;
                const payload = {
                    data: {
                        'messageType': 'WALLET',
                        'json': JSON.stringify(wallet)
                    }
                };
                console.log('sending wallet message to device: ' + JSON.stringify(wallet));
                return admin.messaging().sendToDevice([wallet.fcmToken], payload);
            }
            else {
                console.log('Wallet has no FCM token. No message sent. DEBUGGING');
                return 0;
            }
        });
    }
    function getTestXLM() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('getTestXLM - creating test account and begging for dev XLM ########');
            const request = require('request');
            request.get({
                url: 'https://friendbot.stellar.org',
                qs: { addr: accountID },
                json: true
            }, function (error, response, body) {
                return __awaiter(this, void 0, void 0, function* () {
                    console.log('friendbot: response: ' + JSON.stringify(response));
                    if (response.statusCode === 200) {
                        console.log('### MAJOR SUCCESS!!! ### test wallet has 10,000 XLM on Stellar. ####');
                        wallet.encryptedSecret = yield MyCrypto.encrypt(accountID, secret);
                        wallet.stellarPublicKey = accountID;
                        wallet.success = true;
                        return sendToDevice();
                    }
                    else {
                        wallet.success = false;
                        return sendFailed();
                    }
                });
            });
        });
    }
}));
//# sourceMappingURL=wallet-added.js.map