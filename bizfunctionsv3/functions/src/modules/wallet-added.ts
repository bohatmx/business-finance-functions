import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as CryptoJS from 'crypto-js';
const StellarSdk = require('stellar-sdk');


const DEBUG_STARTING_BALANCE = "100", STARTING_BALANCE = "3"

export const onWalletAdded = functions.firestore
    .document('wallets/{docId}')
    .onCreate(async (snap, context) => {
        
        const wallet = snap.data()
        
        console.log('Wallet created on Firestore, triggered: ' + JSON.stringify(wallet))
        let server;
        const keyPair = StellarSdk.Keypair.random()
        const secret = keyPair.secret();
        const accountID = keyPair.publicKey();
        console.log("new public key: " + accountID)
        console.log('new secret: ' + secret)
        
        try {
            console.log('sourceSeed: ' + wallet.sourceSeed)
            const sourceKeypair = StellarSdk.Keypair.fromSecret(wallet.sourceSeed);
            const sourcePublicKey = sourceKeypair.publicKey();
            console.log('sourcePublicKey: ' + sourcePublicKey)


            if (wallet.debug) {
                server = new StellarSdk.Server('https://horizon-testnet.stellar.org/');
                StellarSdk.Network.useTestNetwork();

            } else {
                server = new StellarSdk.Server('https://horizon.stellar.org/');
                StellarSdk.Network.usePublicNetwork();
            }
            wallet.stellarPublicKey = accountID
            wallet.secret = secret; //Encryption to be added
            wallet.encryptedSecret = encrypt()

            const account = await server.loadAccount(sourcePublicKey);
            let startingBalance = STARTING_BALANCE
            if (wallet.debug) {
                startingBalance = DEBUG_STARTING_BALANCE
                if (wallet.oneConnect) {
                    startingBalance = '1000'
                }
            }
            const transaction = new StellarSdk.TransactionBuilder(account)
                .addOperation(StellarSdk.Operation.createAccount({
                    destination: accountID,
                    startingBalance: startingBalance
                }))
                .build();

            console.log('about to sign and submit stellar transaction ...' + wallet.name)
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
                'date': new Date(),
                'walletDocumentId': snap.id,
                'publicKey': accountID,
                'secret': secret,
                'name': wallet.name
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

        function encrypt() {
            console.log('################### encrypt function: ' + wallet.name)
            try {
                const key = CryptoJS.enc.Utf8.parse(accountID);
                const iv = CryptoJS.enc.Utf8.parse('7061737323313233');
                const encrypted = CryptoJS.AES.encrypt(
                    CryptoJS.enc.Utf8.parse(secret), key,
                    {
                        keySize: 128 / 8,
                        iv: iv,
                        mode: CryptoJS.mode.CBC,
                        padding: CryptoJS.pad.Pkcs7
                    });
    
                const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
                    keySize: 128 / 8,
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                });
    
                console.log('ENCRYPTED SECRET : ' + encrypted);
                console.log('DECRYPTED SECRET : ' + decrypted.toString(CryptoJS.enc.Utf8));
                return '' + encrypted
            } catch (e) {
                console.error(e)
                return 'encryption failed';
            }
        }
    });

    
