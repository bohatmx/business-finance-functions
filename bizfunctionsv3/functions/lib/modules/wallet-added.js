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
const StellarSdk = require('stellar-sdk');
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const DEBUG_STARTING_BALANCE = "500", STARTING_BALANCE = "3";
exports.onWalletAdded = functions.firestore
    .document('wallets/{docId}')
    .onCreate((snap, context) => __awaiter(this, void 0, void 0, function* () {
    const wallet = snap.data();
    console.log('Wallet created on Firestore, triggered: ' + JSON.stringify(wallet));
    console.log('Wallet documentId: ' + snap.id);
    try {
        console.log(JSON.stringify(wallet));
        console.log('sourceSeed: ' + wallet.sourceSeed);
        const sourceKeypair = StellarSdk.Keypair.fromSecret(wallet.sourceSeed);
        const sourcePublicKey = sourceKeypair.publicKey();
        console.log('sourcePublicKey: ' + sourcePublicKey);
        const keyPair = StellarSdk.Keypair.random();
        const secret = keyPair.secret();
        const accountID = keyPair.publicKey();
        console.log("new public key: " + accountID);
        console.log('new secret: ' + secret);
        if (wallet.debug) {
            StellarSdk.Network.useTestNetwork();
            wallet.lastBalance = DEBUG_STARTING_BALANCE;
        }
        else {
            StellarSdk.Network.usePublicNetwork();
            wallet.lastBalance = STARTING_BALANCE;
        }
        wallet.stellarPublicKey = accountID;
        wallet.secret = secret; //Encryption to be added
        const payload = {
            data: {
                'messageType': 'WALLET',
                'json': JSON.stringify(wallet)
            },
            token: wallet.fcmToken
        };
        const account = yield server.loadAccount(sourcePublicKey);
        let startingBalance = STARTING_BALANCE;
        if (wallet.debug) {
            startingBalance = DEBUG_STARTING_BALANCE;
        }
        const transaction = new StellarSdk.TransactionBuilder(account)
            .addOperation(StellarSdk.Operation.createAccount({
            destination: accountID,
            startingBalance: startingBalance
        }))
            .build();
        console.log('about to sign and submit stellar transaction ...');
        transaction.sign(sourceKeypair);
        const transactionResult = yield server.submitTransaction(transaction);
        console.log(JSON.stringify(transactionResult, null, 2));
        console.log('****** Major SUCCESS!!!! Account created on Stellar Blockchain Network');
        wallet.success = true;
        yield admin.firestore().collection('wallets').doc(snap.id).update(wallet);
        console.log('wallet updated on Firestore with success = true');
        return admin.messaging().send(payload);
    }
    catch (error) {
        console.error(error);
        console.log('Wallet creation failed: ' + error);
        const errPayload = {
            data: {
                'messageType': 'WALLET_ERROR',
                'json': JSON.stringify(wallet)
            },
            token: wallet.fcmToken
        };
        wallet.success = false;
        yield admin.firestore().collection('wallets').doc(snap.id).update(wallet);
        console.log('Wallet updated on Firestore with success = false');
        return admin.messaging().send(errPayload);
    }
}));
//# sourceMappingURL=wallet-added.js.map