// ######################################################################
// Add Participant (+ user and wallet) to BFN and Firestore
// ######################################################################

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as BFNConstants from "../models/constants";
import * as MyComms from "./axios-comms";
import * as MyCrypto from "./encryptor-util";
import * as requestor from "request";
import * as validator from "validator";
const StellarSdk = require("stellar-sdk");

export const addParticipant = functions
  .runWith({ memory: "256MB", timeoutSeconds: 240 })
  .https.onRequest(async (request, response) => {
    
    try {
      const firestore = admin.firestore();
      const settings = { /* your settings... */ timestampsInSnapshots: true };
      firestore.settings(settings);
      console.log(
        "Firebase settings completed. Should be free of annoying messages from Google"
      );
    } catch (e) {
      console.log(e);
    }

    const errRes = {
      message: null,
      date: new Date().toISOString()
    };
    if (!request.body) {
      console.log("ERROR - request has no body");
      errRes.message = "request has no body";
      return response.status(400).send(errRes);
    }
    if (!request.body.apiSuffix) {
      console.log("ERROR - request needs an apiSuffix");
      errRes.message = "request needs an apiSuffix";
      return response.status(400).send(errRes);
    }
    try {
      if (!validator.isEmail(request.body.user.email)) {
        console.log("ERROR - email badly formatted");
        errRes.message = "email badly formatted";
        return response.status(400).send(errRes);
      }
    } catch (e) {
      console.log("validator gone rogue. bad boy!!");
      console.log(e);
    }
    console.log(`##### Incoming debug: ${request.body.debug}`);
    console.log(
      `##### Incoming collectionName: ${request.body.collectionName}`
    );
    console.log(`##### Incoming apiSuffix: ${request.body.apiSuffix}`);
    console.log(`##### Incoming data: ${JSON.stringify(request.body.data)}`);
    if (request.body.user) {
      console.log(`##### Incoming user: ${JSON.stringify(request.body.user)}`);
    }

    let isError = false;
    const debug = request.body.debug;
    const apiSuffix = request.body.apiSuffix;
    const data = request.body.data;
    const user = request.body.user;
    const sourceSeed = request.body.sourceSeed;
    if (!user || !apiSuffix || !data) {
      console.log("ERROR - user object not found");
      handleError("ERROR - user or data or apiSuffix missing in request data");
    }
    let collectionName;
    if (apiSuffix === "Supplier") {
      collectionName = "suppliers";
    }
    if (apiSuffix === "Investor") {
      collectionName = "investors";
    }
    if (apiSuffix === "GovtEntity") {
      collectionName = "govtEntities";
    }
    const result = {
      participantPath: null,
      userPath: null,
      walletPath: null,
      date: new Date().toISOString(),
      elapsedSeconds: 0
    };
    const start = new Date().getTime();
    await addToBFN();
    if (!isError) {
      await addUser();
    }
    if (!isError) {
      await addWallet();
    }

    return null;

    async function addToBFN() {
      let url;
      // Send a POST request to BFN
      try {
        if (debug) {
          url = BFNConstants.Constants.DEBUG_URL + apiSuffix;
        } else {
          url = BFNConstants.Constants.RELEASE_URL + apiSuffix;
        }
        const mresponse = await MyComms.AxiosComms.execute(url, data);
        if (mresponse.status === 200) {
          return writeToFirestore(mresponse.data);
        } else {
          handleError(mresponse);
        }
      } catch (error) {
        console.log(error);
        handleError(error);
      }
      return null;
    }
    async function writeToFirestore(mdata) {
      try {
        mdata.intDate = new Date().getTime();
        mdata.date = new Date().toISOString()
        await admin
          .firestore()
          .collection(collectionName)
          .add(mdata)
          .then(nRef => {
            console.log(`*** Participant written to Firestore! ${nRef.path}`);
            result.participantPath = nRef.path;
            return nRef.path;
          })
          .catch(function(error) {
            console.log(error);
            handleError(error);
          });
      } catch (e) {
        console.log(e);
        handleError(`Unable to add participant to Firestore: ${e}`);
      }
      return null;
    }
    async function addUser() {
      let url;
      try {
        if (debug) {
          url = BFNConstants.Constants.DEBUG_URL + "User";
        } else {
          url = BFNConstants.Constants.RELEASE_URL + "User";
        }
        user.uid = "n/a";
        console.log("####### --- writing user to BFN: ---> " + url);
        const mresponse = await MyComms.AxiosComms.execute(url, user);
        if (mresponse.status === 200) {
          await admin
            .auth()
            .createUser({
              email: user.email,
              password: user.password,
              emailVerified: false,
              displayName: user.firstName + " " + user.lastName
            })
            .then(fbUser => {
              console.log("### Firebase auth user created. Cool, dude!");
              mresponse.data.uid = fbUser.uid;
              admin
                .firestore()
                .collection("users")
                .add(mresponse.data)
                .then(nRef => {
                  console.log("User written to Firestore: " + nRef.path);
                  result.userPath = nRef.path;
                  return nRef.path;
                })
                .catch(e => {
                  console.log(e);
                  handleError(e);
                });
            })
            .catch(e => {
              console.log(e);
              handleError(e);
            });
        } else {
          console.log("******** BFN ERROR ###########");
          handleError("Failed to add Firebase Auth user");
        }
      } catch (error) {
        console.log(error);
        handleError(error);
      }
      return null;
    }
    async function addWallet() {
      if (!debug) {
        if (!sourceSeed) {
          handleError("sourceSeed not found for wallet creation");
        }
      }
      const dateRegistered = new Date().toISOString();
      const keyPair = StellarSdk.Keypair.random();
      const secret = keyPair.secret();
      const accountID = keyPair.publicKey();
      console.log("new wallet public key: " + accountID);
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
        investor: null,
        name: request.body.data.name
      };
      const id = request.body.data.participantId;
      if (apiSuffix === "GovtEntity") {
        wallet.govtEntity = `resource:com.oneconnect.biz.GovtEntity#${id}`;
      }
      if (apiSuffix === "Supplier") {
        wallet.supplier = `resource:com.oneconnect.biz.Supplier#${id}`;
      }
      if (apiSuffix === "Investor") {
        wallet.investor = `resource:com.oneconnect.biz.Investor#${id}`;
      }

      if (debug) {
        return prepareDebugWallet(accountID, wallet);
      } else {
        if (!sourceSeed) {
          handleError("No stellar source seed found, wallet cannot be created");
        } else {
          await prepareRealWallet(accountID, wallet);
        }
      }
    }
    async function prepareDebugWallet(accountID, wallet) {
      console.log(
        "prepareDebugAccount: creating Stellar DEBUG account and begging for XLM ########"
      );
      try {
        requestor.get(
          {
            url: "https://friendbot.stellar.org",
            qs: { addr: accountID },
            json: true
          },
          async function(error, mResponse, body) {
            if (error) {
              console.log(error);
              handleError("Stellar FriendBot failed to give Lumens");
            }
            if (mResponse.statusCode === 200) {
              console.log(
                "### MAJOR SUCCESS!!! ### FriendBot has given 10,000 XLM to " +
                  accountID +
                  " on Stellar. ####"
              );
              wallet.success = true;
              await writeWalletToBFN(wallet);
            } else {
              console.log(mResponse);
              console.log(
                "wallet failed, response code from Stellar: " +
                  mResponse.statusCode
              );
              handleError(
                "wallet failed, response code from Stellar: " +
                  mResponse.statusCode
              );
              return null;
            }
          }
        );
      } catch (e) {
        console.log(e);
        handleError(e);
      }
      return null;
    }
    async function prepareRealWallet(accountID, wallet) {
      const STARTING_BALANCE = 5;
      try {
        console.log("### sourceSeed: " + sourceSeed);
        const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSeed);
        const sourcePublicKey = sourceKeypair.publicKey();
        console.log("### sourcePublicKey: " + sourcePublicKey);

        const server = new StellarSdk.Server("https://horizon.stellar.org/");
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
          await writeWalletToBFN(wallet);
        } else {
          console.log(
            "wallet failed, response code from Stellar: " +
              transactionResult.statusCode
          );
          handleError("Failed to create Stellar account");
        }
      } catch (error) {
        //something went boom!
        console.error(error);
        handleError(error);
      }
    }
    async function writeWalletToBFN(wallet) {
      let url;
      const bfnWallet = {
        stellarPublicKey: wallet.stellarPublicKey,
        dateRegistered: new Date().toISOString(),
        govtEntity: wallet.govtEntity,
        supplier: wallet.supplier,
        investor: wallet.investor,
        name: wallet.name
      };
      try {
        if (debug) {
          url = BFNConstants.Constants.DEBUG_URL + "Wallet";
        } else {
          url = BFNConstants.Constants.RELEASE_URL + "Wallet";
        }
        const mresponse = await MyComms.AxiosComms.execute(url, bfnWallet);
        if (mresponse.status === 200) {
          console.log("wallet written to BFN. *** We cooking wit Gas!");
          return await writeWalletToFirestore(wallet);
        } else {
          handleError("BFN failed to add wallet, status: " + mresponse.status);
        }
      } catch (error) {
        console.log(error);
        handleError(error);
      }
      return null;
    }
    async function writeWalletToFirestore(wallet) {
      admin
        .firestore()
        .collection("wallets")
        .add(wallet)
        .then(nRef => {
          console.log("Wallet added to Firestore: " + nRef.path);
          result.walletPath = nRef.path;
          const end = new Date().getTime();
          result.elapsedSeconds = (end - start) / 1000;
          console.log(result);
          console.log(
            "########## Everything seems OK, sending result and status 200. Elapsed seconds: " +
              result.elapsedSeconds
          );
          response.status(200).send(result);
          return nRef.path;
        })
        .catch(e => {
          console.log(e);
          handleError(e);
        });
      return null;
    }
    function handleError(message) {
      console.log("--- ERROR !!! --- sending error payload: msg:" + message);
      try {
        isError = true;
        const payload = {
          name: apiSuffix,
          result: result,
          message: message,
          data: request.body.data,
          user: request.body.user,
          apiSuffix: request.body.apiSuffix,
          date: new Date().toISOString()
        };
        console.log(payload);
        response.status(400).send(payload);
      } catch (e) {
        response.status(400).send(message);
      }
    }
  });
