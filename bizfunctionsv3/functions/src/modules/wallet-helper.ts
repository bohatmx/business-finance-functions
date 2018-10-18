import * as admin from "firebase-admin";
import * as MyCrypto from "./encryptor-util";
import * as requestor from "request";
const StellarSdk = require("stellar-sdk");

export async function createWallet(sourceSeed, id, type, debug) {
  console.log("##### creating wallet .........");
  const dateRegistered = new Date().toISOString();
  console.log(
    "####### hooking up with Stellar to generate new account, date: " +
      dateRegistered
  );
  const STARTING_BALANCE = "3";
  const keyPair = StellarSdk.Keypair.random();
  const secret = keyPair.secret();
  const accountID = keyPair.publicKey();
  console.log("new wallet public key: " + accountID);
  console.log("new wallet secret: " + secret);
  let server;
  const encrypted = await MyCrypto.encrypt(accountID, secret);
  console.log("new wallet secret encrypted: " + encrypted);
  const wallet = {
    stellarPublicKey: accountID,
    encryptedSecret: encrypted,
    date: dateRegistered,
    success: false,
    dateRegistered: dateRegistered,
    secret: secret,
    govtEntity: null,
    supplier: null,
    investor: null
  };
  if (type === "GovtEntity") {
    wallet.govtEntity = "resource:com.oneconnect.biz.GovtEntity#" + id;
  }
  if (type === "Supplier") {
    wallet.supplier = "resource:com.oneconnect.biz.Supplier#" + id;
  }
  if (type === "Investor") {
    wallet.investor = "resource:com.oneconnect.biz.Investor#" + id;
  }

  if (debug) {
    return await prepareDebugWallet();
  } else {
    if (!sourceSeed) {
      throw new Error("No stellar source seed found, wallet cannot be created");
    }
    return await prepareRealWallet();
  }
  async function prepareDebugWallet() {
    console.log(
      "prepareDebugAccount: - creating DEBUG account and begging for dev XLM ########"
    );

    try {
      requestor.get(
        {
          url: "https://friendbot.stellar.org",
          qs: { addr: accountID },
          json: true
        },
        async function(error, mResponse, body) {
          console.log("friendbot: response: " + JSON.stringify(mResponse));
          if (error) {
            console.log(error)
            return handleError();
          }
          if (mResponse.statusCode === 200) {
            console.log(
              "### MAJOR SUCCESS!!! ### dev wallet has 10,000 XLM on Stellar. ####"
            );
            wallet.success = true;
            await writeWalletToFirestore()
            await sendToTopic("walletsCreated");
            return 0;
          } else {
            console.log(mResponse);
            console.log(
              "wallet failed, response code from Stellar: " +
                mResponse.statusCode
            );
            return handleError();
          }
        }
      );
    } catch (e) {
      console.log(e);
      throw new Error("Failed to create Stellar account");
    }
    return 0
  }
  async function prepareRealWallet() {
    try {
      console.log("### sourceSeed: " + sourceSeed);
      const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSeed);
      const sourcePublicKey = sourceKeypair.publicKey();
      console.log("### sourcePublicKey: " + sourcePublicKey);

      server = new StellarSdk.Server("https://horizon.stellar.org/");
      StellarSdk.Network.usePublicNetwork();

      const account = await server.loadAccount(sourcePublicKey);
      const transaction = new StellarSdk.TransactionBuilder(account)
        .addOperation(
          StellarSdk.Operation.createAccount({
            destination: accountID,
            startingBalance: STARTING_BALANCE
          })
        )
        .build();

      console.log(")))) about to sign and submit stellar transaction ...");
      transaction.sign(sourceKeypair);
      const transactionResult = await server.submitTransaction(transaction);
      console.log(
        "transactionResult: " +
          JSON.stringify(
            StellarSdk.xdr.TransactionResult.fromXDR(
              transactionResult.result_xdr,
              "base64"
            )
          )
      );

      if (transactionResult.statusCode === 200) {
        console.log(
          "****** Major SUCCESS!!!! Account created on Stellar Blockchain Network. will write wallet to Firestore"
        );
        wallet.success = true;
        await sendToTopic("walletsCreated");
        await await writeWalletToFirestore();
        return 0;
      } else {
        console.log(
          "wallet failed, response code from Stellar: " +
            transactionResult.statusCode
        );
        return handleError();
      }
    } catch (error) {
      //something went boom!
      console.error(error);
      return handleError();
    }
  }
  async function writeWalletToFirestore() {
    console.log("writeWalletToFirestore");
    const ref = await admin
      .firestore()
      .collection("wallets")
      .add(wallet)
      .catch(e => {
        throw new Error(`Failed to add wallet to Firestore ${e}`);
      });
    console.log(ref);
    return 0;
  }
  async function sendToTopic(topic) {
    let msg = "A BFN Wallet created. Public Key: " + accountID;
    if (topic === "walletsFailed") {
      msg = "Wallet creation failed";
    }
    const payload = {
      data: {
        messageType: "WALLET",
        json: JSON.stringify(wallet)
      },
      notification: {
        title: "BFN Wallet",
        body: msg
      }
    };
    console.log("sending wallet message to topic: " + JSON.stringify(payload));
    return admin.messaging().sendToTopic(topic, payload);
  }
  async function handleError() {
    console.log("handling error ...............");
    wallet.success = false;
    await sendToTopic("walletsFailed");
    throw new Error("Wallet creation failed");
  }
}
