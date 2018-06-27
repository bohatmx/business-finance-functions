import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
const StellarSdk = require('stellar-sdk');
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

const DEBUG_STARTING_BALANCE = "100", STARTING_BALANCE = "3"

export const onWalletAdded = functions.firestore
    .document('wallets/{docId}')
    .onCreate(async (snap, context) => {
        const wallet = snap.data()
        console.log('Wallet created on Firestore, triggered: ' + JSON.stringify(wallet))
        const keyPair = StellarSdk.Keypair.random()
        const secret = keyPair.secret();
        const accountID = keyPair.publicKey();
        console.log("new public key: " + accountID)
        console.log('new secret: ' + secret)
        try {
            console.log(JSON.stringify(wallet))
            console.log('sourceSeed: ' + wallet.sourceSeed)
            const sourceKeypair = StellarSdk.Keypair.fromSecret(wallet.sourceSeed);
            const sourcePublicKey = sourceKeypair.publicKey();
            console.log('sourcePublicKey: ' + sourcePublicKey)


            if (wallet.debug) {
                StellarSdk.Network.useTestNetwork();
                wallet.lastBalance = DEBUG_STARTING_BALANCE
            } else {
                StellarSdk.Network.usePublicNetwork();
                wallet.lastBalance = STARTING_BALANCE
            }
            wallet.stellarPublicKey = accountID
            wallet.secret = secret; //Encryption to be added



            const account = await server.loadAccount(sourcePublicKey);
            let startingBalance = STARTING_BALANCE
            if (wallet.debug) {
                startingBalance = DEBUG_STARTING_BALANCE
            }
            const transaction = new StellarSdk.TransactionBuilder(account)
                .addOperation(StellarSdk.Operation.createAccount({
                    destination: accountID,
                    startingBalance: startingBalance
                }))
                .build();

            console.log('about to sign and submit stellar transaction ...')
            transaction.sign(sourceKeypair);
            const transactionResult = await server.submitTransaction(transaction)
            console.log(JSON.stringify(transactionResult, null, 2));
            console.log('****** Major SUCCESS!!!! Account created on Stellar Blockchain Network')
            wallet.success = true
            await admin.firestore().collection('wallets').doc(snap.id).update(wallet)
            console.log('wallet updated on Firestore with success = true, sending message to device')
            if (wallet.fcmToken) {
                const payload = {
                    data: {
                        'messageType': 'WALLET',
                        'json': JSON.stringify(wallet)
                    }
                }
                return admin.messaging().sendToDevice([wallet.fcmToken], payload);
            } else {
                return 0;
            }

        } catch (error) {
            //something went boom!
            console.error(error)
            let failed = {
                'date': new Date().getUTCDate(),
                'walletDocumentId': snap.id,
                'publicKey': accountID,
                'secret': secret
            }
            await admin.firestore().collection('walletsFailed').add(failed)

            wallet.success = false
            await admin.firestore().collection('wallets').doc(snap.id).update(wallet)
            console.log('Wallet updated on Firestore with success = false, sending message to device; failed record added')
            const errPayload = {
                data: {
                    'messageType': 'WALLET_ERROR',
                    'json': JSON.stringify(wallet)
                },
            }
            console.log('sending message to failedWallets topic')
            await admin.messaging().sendToTopic('failedWallets', errPayload)
            if (wallet.fcmToken) {
                console.log('sending message to device: failed Wallet')
                return admin.messaging().sendToDevice([wallet.fcmToken], errPayload)
            } else {
                return 0;
            }
        }

    });
