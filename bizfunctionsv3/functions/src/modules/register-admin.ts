// ######################################################################
// Register BFN admin user
// ######################################################################

import * as functions from "firebase-functions";
import * as storage from "@firebase/storage";
import * as admin from "firebase-admin";
import * as BFNConstants from "../models/constants";
import * as AxiosComms from "./axios-comms";
import * as fs from 'fs';
import * as os from 'os';
import * as FabricCAServices from 'fabric-ca-client';
import { FileSystemWallet, X509WalletMixin } from 'fabric-network';
import * as path from 'path';

const credsPath = path.resolve(__dirname, '..', '..', 'creds002.json');
const ccpJSON = fs.readFileSync(credsPath, 'utf8');
const credsJSON = JSON.parse(ccpJSON);

// make the following into data structure to be input to this class
let caOrganization = 'org1-ca';
let keyStoreDir = null;
const adminUser = 'admin';
let organization = 'org1';
//

export const registerAdmin = functions.https.onRequest(
  async (request, response) => {
    if (!request.body) {
      console.log("ERROR - request has no body");
      return response.sendStatus(400);
    }

    console.log(`##### Incoming data ${JSON.stringify(request.body.data)}`);

    const data = request.body.data;
    keyStoreDir = os.tmpdir();
    organization = data.organization;
    caOrganization = data.caOrganization;

    if (validate() === true) {
      await enrollAdmin();
    }

    return null;

    function validate() {
      if (!request.body) {
        console.log("ERROR - request has no body");
        return response.status(400).send("request has no body");
      }
      if (!request.body.data) {
        console.log("ERROR - request has no data");
        return response.status(400).send(" request has no data");
      }
      return true;
    }

    async function enrollAdmin() {
      console.log(`registering BFN admin user`)
      console.log('\n\n\n🔵  🔵  REGISTER ADMIN USER starting ....');
      console.log(`\n🔵  🔵  #######  credsPath :: ${credsPath}\n\n`);
      console.log(credsJSON);
  
      try {
          // Create a new CA client for interacting with the CA.
          const caURL = credsJSON.certificateAuthorities[caOrganization].url;
          console.log('\n\n🔵  🔵   ######## caURL: ' + caURL);
          const ca = new FabricCAServices(caURL);
          // Create a new file system based wallet for managing identities.
          const walletPath = path.join(process.cwd(), keyStoreDir);
          const wallet = new FileSystemWallet(walletPath);
  
          console.log(`\n\n🔵  🔵  &&&&&&&& Wallet path: ${walletPath}`);
  
          // Check to see if we've already enrolled the admin user.
          const adminExists = await wallet.exists('admin');
          if (adminExists) {
              console.log('\n\n⚠️  ⚠️   An identity for the admin user "admin" already exists in the wallet');
              return;
          }
  
          // Enroll the admin user, and import the new identity into the wallet.
          console.log('\n\n🔵  🔵  enrolling ...................');
          const secret = credsJSON.certificateAuthorities[caOrganization].registrar[0].enrollSecret;
          console.log(`\n\n📍 📍 📍  secret from creds: ${secret}`);
          const enrollment = await ca.enroll({
              enrollmentID: admin,
              enrollmentSecret: secret });
  
          const identity = X509WalletMixin.createIdentity(
              organization, enrollment.certificate,
              enrollment.key.toBytes());
          console.log('\n\n🔵  🔵   write identity to directory');
          wallet.import(adminUser, identity);
          console.log(`\n\n\n\n ✅  ✅  ✅  Successfully enrolled admin user: ${admin}. imported it into the wallet`);
  
      } catch (error) {
          console.error(`⚠️  ⚠️   Failed to enroll admin user "admin": ${error}`);
          process.exit(1);
      }
    }

  }
);
