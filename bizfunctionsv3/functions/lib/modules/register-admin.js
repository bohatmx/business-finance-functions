"use strict";
// ###################################################################################
// Request Certificates from CA and Register admin user, save wallet in cloud storage
// ###################################################################################
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fs = require("fs");
const os = require("os");
const FabricCAServices = require("fabric-ca-client");
const fabric_network_1 = require("fabric-network");
const path = require("path");
//
const adminUser = 'admin';
// expected parameters received in json data structure
let organization = null; //from blockchain connection profile json file
let caURL = null; //certificate authority url - from blockchain connection profile json file
let enrollSecret = null; //from blockchain connection profile json file
let projectId = null; //this is the Firebase Id or name, same as on console landing page
let temporaryWalletDirectory = null;
/*
Navigate and enable the API's and add Roles for Storage creds etc. - see Evernote
https://console.cloud.google.com/storage/browser/aftarobot2019-dev3.appspot.com?project=aftarobot2019-dev3&organizationId=871195427789
https://console.developers.google.com/apis/api/iam.googleapis.com/overview?project=business-finance-dev
*/
exports.registerAdmin = functions.https.onRequest(async (request, response) => {
    console.log(`##### Incoming data ${JSON.stringify(request.body)}`);
    const data = request.body;
    const firestore = admin.firestore();
    try {
        const settings = { /* your settings... */ timestampsInSnapshots: true };
        firestore.settings(settings);
    }
    catch (e) { }
    setUp();
    await enrollAdmin();
    return null;
    //
    function setUp() {
        if (data.organization) {
            organization = data.organization;
        }
        else {
            return response.status(400).json({
                message: '⚠️  data object: missing organization'
            });
        }
        if (data.caURL) {
            caURL = data.caURL;
        }
        else {
            return response.status(400).json({
                message: '⚠️  data object: missing caURL'
            });
        }
        if (data.enrollSecret) {
            enrollSecret = data.enrollSecret;
        }
        else {
            return response.status(400).json({
                message: '⚠️  data object: missing enrollSecret'
            });
        }
        if (data.projectId) {
            projectId = data.projectId;
        }
        else {
            const id1 = process.env.GCLOUD_PROJECT;
            const id2 = admin.instanceId().app.options.projectId;
            console.log(`⚠️ compare projectIds:  ⚠️ id1: ${id1} id2: ${id2}`);
            projectId = id2;
            // return response.status(400).json({
            //   message: '⚠️  data object: missing projectId'
            // });
        }
        return null;
    }
    async function enrollAdmin() {
        console.log('🔵  🔵 🔵 🔵  REGISTER BFN ADMIN USER starting ....');
        try {
            temporaryWalletDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'wallet'));
            fs.chmod(temporaryWalletDirectory, '755', function (err) {
                if (err) {
                    return response.status(400).json({
                        message: '⚠️  Unable to set temporary directory permissions'
                    });
                }
                else {
                    console.log(`🔵  wallet directory ready to rumble: ${temporaryWalletDirectory}`);
                    return null;
                }
            });
            console.log('🔵  certificateAuthority url: ' + caURL);
            const ca = new FabricCAServices(caURL);
            const wallet = new fabric_network_1.FileSystemWallet(temporaryWalletDirectory);
            console.log(`🔵  identity wallet path : ${temporaryWalletDirectory}`);
            // Check to see if we've already enrolled the admin user.
            const adminExists = await wallet.exists('admin');
            if (adminExists) {
                console.log('⚠️  ⚠️   An identity for the admin user "admin" already exists in the wallet');
                response.status(201).json({
                    message: '⚠️  ⚠️  BFN Admin user already exists'
                });
            }
            else {
                // Enroll the admin user, and import the new identity into the wallet.
                console.log('🔵  🔵  enrolling ...................');
                const enrollment = await ca.enroll({
                    enrollmentID: adminUser,
                    enrollmentSecret: enrollSecret
                });
                console.log(`📍 📍 📍  admin user enrolled on certificate authority - saving creds ...`);
                const identity = fabric_network_1.X509WalletMixin.createIdentity(organization, enrollment.certificate, enrollment.key.toBytes());
                console.log('🔵  🔵   write identity to directory; identity: ' + identity.type);
                await wallet.import(adminUser, identity);
                console.log(` ✅  Successfully enrolled admin user: ${adminUser}. imported certs into wallet`);
                await uploadWallet();
                return null;
            }
        }
        catch (error) {
            console.error(`⚠️  ⚠️   Failed to enroll admin user "admin": ${error}`);
            response.status(400).json({
                message: '⚠️  ⚠️  ⚠️  BFN admin user enrolment failed',
                error: error
            });
        }
    }
    async function uploadWallet() {
        console.log(`🔵  🔵 uploading ${temporaryWalletDirectory} wallet directory files to Firesreto ...`);
        fs.readdir(temporaryWalletDirectory, async function (err, files) {
            if (err) {
                console.error("⚠️  ⚠️  Could not list the directory.", err);
                return response.status(400).json({
                    message: '⚠️  ⚠️  Failed to list temporary directory files containg identity',
                    error: err
                });
            }
            else {
                const directoryFromCA = temporaryWalletDirectory + '/' + files[0];
                console.log(`..... path of directory from the CA: ${directoryFromCA}`);
                let isDirectory = false;
                try {
                    isDirectory = fs.lstatSync(directoryFromCA).isDirectory();
                }
                catch (e) {
                    return response.status(400).json({
                        message: '⚠️  ⚠️  Failed to check temporary directory files containg identity',
                        error: err
                    });
                }
                if (isDirectory) {
                    await uploadFiles(directoryFromCA);
                    return null;
                }
                else {
                    console.log('⚠️  WTF, only one file created by CA, expected 3 inside directory');
                    return response.status(400).json({
                        message: '⚠️  WTF, only one file created by CA, expected 3',
                    });
                }
            }
        });
    }
    async function uploadFiles(directoryFromCA) {
        console.log('🔵  🔵 Certificate Authority has produced a directory with 3 files; hopefully :) : ' + directoryFromCA);
        let cnt = 0;
        fs.readdir(directoryFromCA, async function (error, fileList) {
            console.log('🔵  🔵 CA directory has: ' + fileList.length + ' files. Should be 3 of them!');
            if (!error) {
                for (const file of fileList) {
                    const mpath = directoryFromCA + "/" + file;
                    console.log(`🔵 📍 - uploading ${mpath} to Firestore : reading contents ... `);
                    const buffer = fs.readFileSync(mpath);
                    const fileContents = buffer.toString('utf8');
                    await writeToFirestore(file, fileContents);
                    cnt++;
                }
                console.log(`🔵 🔵 🔵 🔵  wallet identity files uploaded: ${cnt} 🔵 🔵 🔵 🔵 `);
                console.log(`✅  ✅  ✅  ✅  Blockchain Admin User enrolled OK. Done. Finito!`);
                return response.status(200).json({
                    message: ' ✅  ✅  ✅  ✅  Blockchain Admin User enrolled OK.  Done. Finito!'
                });
            }
            return null;
        });
    }
    // async function uploadOneFile(mpath:string, file:string, fileContents:string) {
    //   await myStorageBucket.upload(mpath).then(async ([mFile, mRequestResponse]) => {
    //     console.log(`⚠️ then mFile.name uploaded :: ${mFile.name} to ${myStorageBucket.name}`);
    //     //
    //     //write this to Firestore ------
    //     await mFile.getSignedUrl({
    //       action: 'read',
    //       expires: '03-07-2528'
    //     }).then( async function (url)  {
    //       console.log(`file url: ${url[0]}`);
    //       await writeToFirestore(url[0], file, fileContents);
    //     });
    //   }).catch((e) => {
    //     console.log(e);
    //     console.log('⚠️ ⚠️ ⚠️ ⚠️ ⚠️  on catch: Wallet upload to storage failed');
    //     return response.status(400).json({
    //       message: '⚠️ ⚠️ ⚠️ ⚠️   Wallet upload to storage failed',
    //       error: e
    //     });
    //   });
    // }
    async function writeToFirestore(fileName, fileContents) {
        console.log('🔵 🔵  write fileContents to Firestore ...');
        let name = null;
        const privateKey = fileContents.search('PRIVATE');
        const publicKey = fileContents.search('PUBLIC');
        const administrator = fileContents.search('admin');
        if (privateKey > -1) {
            name = 'privateKey';
        }
        if (publicKey > -1) {
            name = 'publicKey';
        }
        if (administrator > -1) {
            name = 'admin';
        }
        let ref;
        try {
            ref = await firestore.collection('organizations')
                .doc(organization).collection('adminFiles')
                .doc(name)
                .set({
                contents: fileContents,
                name: fileName,
            });
            console.log(`✅  ✅  fileContents written to Firestore :: ${ref.path}`);
        }
        catch (e) {
            console.log(e);
            return response.status(400).json({
                message: '⚠️ ⚠️ ⚠️ ⚠️  Problem writing to Firestore',
                error: e
            });
        }
        return ref;
    }
});
//# sourceMappingURL=register-admin.js.map