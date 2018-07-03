import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as MyCrypto from './encryptor-util';
const StellarSdk = require('stellar-sdk');


const STARTING_BALANCE = "3"

export const onWalletAdded = functions.firestore
    .document('wallets/{docId}')
    .onCreate(async (snap, context) => {

        const wallet = snap.data()
        console.log('Triggered by Firestore, creating wallet on Stellar: ' + JSON.stringify(wallet))
        let server;
        console.log('####### hooking up with Stellar to generate new keys');
        const keyPair = StellarSdk.Keypair.random()
        const secret = keyPair.secret();
        const accountID = keyPair.publicKey();
        console.log("new wallet public key: " + accountID)
        console.log('new wallet secret: ' + secret)
        if (wallet.debug) {
            return getTestXLM()
        } else {
            try {
                console.log('### sourceSeed: ' + wallet.sourceSeed)
                const sourceKeypair = StellarSdk.Keypair.fromSecret(wallet.sourceSeed);
                const sourcePublicKey = sourceKeypair.publicKey();
                console.log('### sourcePublicKey: ' + sourcePublicKey)

                server = new StellarSdk.Server('https://horizon.stellar.org/');
                StellarSdk.Network.usePublicNetwork();

                wallet.stellarPublicKey = accountID
                const encryptResult = await MyCrypto.encrypt(accountID, secret);
                if (encryptResult !== 'encryption failed') {
                    wallet.encryptedSecret = encryptResult
                }

                const account = await server.loadAccount(sourcePublicKey);
                const transaction = new StellarSdk.TransactionBuilder(account)
                    .addOperation(StellarSdk.Operation.createAccount({
                        destination: accountID,
                        startingBalance: STARTING_BALANCE
                    }))
                    .build();

                console.log(')))) about to sign and submit stellar transaction ...' + wallet.name)
                transaction.sign(sourceKeypair);
                const transactionResult = await server.submitTransaction(transaction)
                console.log(JSON.stringify(transactionResult, null, 2));
                console.log('****** Major SUCCESS!!!! Account created on Stellar Blockchain Network')
                wallet.success = true
                return sendToDevice()

            } catch (error) {
                //something went boom!
                console.error(error)
                return sendFailed()
            }
        }

        async function sendFailed() {
            const failed = {
                'date': new Date(),
                'walletDocumentId': snap.id,
                'publicKey': accountID,
                'secret': secret,
                'name': wallet.name
            }
            await admin.firestore().collection('walletsFailed').add(failed)
            wallet.success = false
            const errPayload = {
                data: {
                    'messageType': 'WALLET_ERROR',
                    'json': JSON.stringify(wallet)
                },
            }
            console.log('sending message to failedWallets topic')
            await admin.messaging().sendToTopic('failedWallets', errPayload)
            return sendToDevice()
        }
        async function sendToDevice() {
            if (wallet.fcmToken) {
                wallet.documentReference = snap.id
                const payload = {
                    data: {
                        'messageType': 'WALLET',
                        'json': JSON.stringify(wallet)
                    }
                }
                console.log('sending wallet message to device: ' + JSON.stringify(wallet))
                return admin.messaging().sendToDevice([wallet.fcmToken], payload);
            } else {
                console.log('Wallet has no FCM token. No message sent. DEBUGGING')
                return 0;
            }
        }
        async function getTestXLM() {
            console.log('getTestXLM - creating test account and begging for dev XLM ########')
            const request = require('request')
            request.get({
                url: 'https://friendbot.stellar.org',
                qs: { addr: accountID },
                json: true
            }, async function (error, response, body) {
                console.log('friendbot: response: ' + JSON.stringify(response))
                if (response.statusCode === 200) {
                    console.log('### MAJOR SUCCESS!!! ### test wallet has 10,000 XLM on Stellar. ####')
                    wallet.encryptedSecret = await MyCrypto.encrypt(accountID, secret);
                    wallet.stellarPublicKey = accountID
                    wallet.success = true
                    return sendToDevice()

                } else {
                    wallet.success = false
                    return sendFailed()
                }
            });
        }
       
    });


