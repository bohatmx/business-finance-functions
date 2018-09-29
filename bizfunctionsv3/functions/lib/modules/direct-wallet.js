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
const requestor = require("request");
const StellarSdk = require('stellar-sdk');
const STARTING_BALANCE = "3";
exports.directWallet = functions.https.onRequest((request, response) => __awaiter(this, void 0, void 0, function* () {
    if (!request.body) {
        return response.sendStatus(500);
    }
    console.log('Triggered by https request, creating wallet on Stellar: ' + JSON.stringify(request.body));
    let sourceSeed = '';
    if (request.body.sourceSeed) {
        sourceSeed = request.body.sourceSeed;
    }
    const debug = request.body.debug;
    const dateRegistered = new Date().toISOString();
    console.log('####### hooking up with Stellar to generate new keys, date: ' + dateRegistered);
    const keyPair = StellarSdk.Keypair.random();
    const secret = keyPair.secret();
    const accountID = keyPair.publicKey();
    console.log("new wallet public key: " + accountID);
    console.log('new wallet secret: ' + secret);
    let server;
    const encrypted = yield MyCrypto.encrypt(accountID, secret);
    const wallet = {
        'stellarPublicKey': accountID,
        'encryptedSecret': encrypted,
        'date': dateRegistered,
        'success': false,
        'dateRegistered': dateRegistered,
        'secret': secret
    };
    if (debug) {
        return prepareDebugWallet();
    }
    else {
        return prepareRealWallet();
    }
    function prepareDebugWallet() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('prepareDebugAccount: - creating DEBUG account and begging for dev XLM ########');
            requestor.get({
                url: 'https://friendbot.stellar.org',
                qs: { addr: accountID },
                json: true
            }, function (error, mResponse, body) {
                return __awaiter(this, void 0, void 0, function* () {
                    console.log('friendbot: response: ' + JSON.stringify(mResponse));
                    if (mResponse.statusCode === 200) {
                        console.log('### MAJOR SUCCESS!!! ### test wallet has 10,000 XLM on Stellar. ####');
                        wallet.success = true;
                        yield sendToTopic('walletsCreated');
                        return response.send(JSON.stringify(wallet));
                    }
                    else {
                        console.log('wallet failed, response code from Stellar: ' + mResponse.statusCode);
                        return handleError();
                    }
                });
            });
        });
    }
    function prepareRealWallet() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('### sourceSeed: ' + sourceSeed);
                const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSeed);
                const sourcePublicKey = sourceKeypair.publicKey();
                console.log('### sourcePublicKey: ' + sourcePublicKey);
                server = new StellarSdk.Server('https://horizon.stellar.org/');
                StellarSdk.Network.usePublicNetwork();
                const account = yield server.loadAccount(sourcePublicKey);
                const transaction = new StellarSdk.TransactionBuilder(account)
                    .addOperation(StellarSdk.Operation.createAccount({
                    destination: accountID,
                    startingBalance: STARTING_BALANCE
                }))
                    .build();
                console.log(')))) about to sign and submit stellar transaction ...');
                transaction.sign(sourceKeypair);
                const transactionResult = yield server.submitTransaction(transaction);
                console.log('transactionResult: ' + JSON.stringify(StellarSdk.xdr.TransactionResult.fromXDR(transactionResult.result_xdr, 'base64')));
                if (transactionResult.statusCode === 200) {
                    console.log('****** Major SUCCESS!!!! Account created on Stellar Blockchain Network. will write wallet to Firestore');
                    wallet.success = true;
                    yield sendToTopic('walletsCreated');
                    return response.send(JSON.stringify(wallet));
                }
                else {
                    console.log('wallet failed, response code from Stellar: ' + transactionResult.statusCode);
                    return handleError();
                }
            }
            catch (error) {
                //something went boom!
                console.error(error);
                return handleError();
            }
        });
    }
    function sendToTopic(topic) {
        return __awaiter(this, void 0, void 0, function* () {
            let msg = 'A BFN Wallet created. Public Key: ' + accountID;
            if (topic === 'walletsFailed') {
                msg = 'Wallet creation failed';
            }
            const payload = {
                data: {
                    'messageType': 'WALLET',
                    'json': JSON.stringify(wallet)
                },
                notification: {
                    title: 'BFN Wallet',
                    body: msg
                }
            };
            console.log('sending wallet message to topic: ' + JSON.stringify(payload));
            return admin.messaging().sendToTopic(topic, payload);
        });
    }
    function handleError() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('handling error ...............');
            wallet.success = false;
            yield sendToTopic('walletsFailed');
            return response.sendStatus(400);
        });
    }
}));
//# sourceMappingURL=direct-wallet.js.map