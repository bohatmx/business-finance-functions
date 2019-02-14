"use strict";
// ###################################################################################
// Register blockchain user, save wallet in Firestore
// ###################################################################################
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fs = require("fs");
const fabric_network_1 = require("fabric-network");
exports.registerUser = functions.https.onRequest(async (request, response) => {
    console.log(`##### Incoming data ${JSON.stringify(request.body)}`);
    const data = request.body;
    const mRole = 'client';
    const mAdmin = 'admin';
    const firestore = admin.firestore();
    try {
        const settings = { /* your settings... */ timestampsInSnapshots: true };
        firestore.settings(settings);
    }
    catch (e) { }
    // make the following into data structure to be input to this class
    let userName;
    let mAffiliation;
    let organization;
    let connectionProfile;
    // end of data structure
    let adminExists = false;
    let adminWalletDir;
    let userWalletDir;
    let cert, privateKey, publicKey;
    try {
        const settings = { /* your settings... */ timestampsInSnapshots: true };
        firestore.settings(settings);
    }
    catch (e) { }
    setUp();
    await getAdminWallet();
    await connect();
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
        if (data.affiliation) {
            mAffiliation = data.affiliation;
        }
        else {
            mAffiliation = organization;
        }
        if (data.connectionProfile) {
            connectionProfile = data.connectionProfile;
        }
        else {
            return response.status(400).json({
                message: '⚠️  data object: missing connectionProfile json'
            });
        }
        if (data.userName) {
            userName = data.userName;
        }
        else {
            return response.status(400).json({
                message: '⚠️  data object: missing userName'
            });
        }
        return null;
    }
    async function getAdminWallet() {
        console.log('🔵 Get blockchain admin identity from Firestore ...');
        try {
            await firestore.collection('organizations')
                .doc(organization).collection('adminFiles').get()
                .then((qs) => {
                if (qs.docs.length > 0) {
                    console.log('Found admin files in firestore: ' + qs.docs.length);
                    adminExists = true;
                }
                else {
                    const msg = '⚠️  ⚠️  ⚠️ blockchain admin user does not exist. Run registerAdmin first';
                    console.log(msg);
                    return response.status(400).json({
                        message: msg
                    });
                }
                qs.docs.forEach((doc) => {
                    const mdata = doc.data();
                    if (mdata.contents.search('PRIVATE') > -1) {
                        privateKey = mdata.contents;
                        console.log('🔵 admin private key: ' + privateKey);
                    }
                    if (mdata.contents.search('admin') > -1) {
                        const x = JSON.parse(mdata.contents);
                        console.log(x);
                        cert = x.enrollment.identity.certificate;
                        console.log('🔵 admin cert: ' + cert);
                    }
                    if (mdata.contents.search('PUBLIC') > -1) {
                        publicKey = mdata.contents;
                        console.log('🔵 admin public key: ' + publicKey);
                    }
                });
                return null;
            });
        }
        catch (e) {
            console.log(e);
            return response.status(400).json({
                message: '⚠️ ⚠️  Unable to get admin files from Firestore',
                error: e
            });
        }
        return null;
    }
    // async function getUserWalletDirectory() {
    //   console.log(`🔵  creating user wallet directory ....`);
    //   try {
    //     userWalletDir = fs.mkdtempSync(path.join(os.tmpdir(), 'userWallet'));
    //     fs.chmod(userWalletDir, '755', function (err) {
    //       if (err) {
    //         return response.status(400).json({
    //           message: '⚠️  Unable to set temporary directory permissions'
    //         });
    //       } else {
    //         console.log(`🔵  user wallet directory ready to rumble: ${userWalletDir}`);
    //         return null;
    //       }
    //     });
    //   } catch (e) {
    //     return response.status(400).json({
    //       message: '⚠️  Unable to create temporary user wallet directory',
    //       error: e
    //     });
    //   }
    //   return null;
    // }
    async function connect() {
        console.log(`📍📍  📍📍  connect to Gateway .......`);
        if (!adminExists) {
            const msg = '⚠️  ⚠️  ⚠️  Blockchain admin does not exist. Run registerAdmin first';
            console.log(msg);
            return response.status(400).json({
                message: msg
            });
        }
        // Create a new gateway for connecting to our peer node.
        // await getUserWalletDirectory();
        // console.log(`📍📍  ... creating wallet paths ... userWalletDir: ${userWalletDir} adminWalletDir: ${adminWalletDir}`);
        // const userWalletPath = path.join(process.cwd(), userWalletDir);
        // const adminWalletPath = path.join(process.cwd(), adminWalletDir);
        const mix = fabric_network_1.X509WalletMixin.createIdentity('admin', cert, privateKey);
        const xWallet = new fabric_network_1.InMemoryWallet(mix);
        // const wallet = new FileSystemWallet(userWalletDir);
        // const adminWallet = new FileSystemWallet(adminWalletDir);
        // const adminx = await adminWallet.list();
        // console.log(`list of identities from admin wallet: ${adminx}`);
        console.log(`📍📍 ... connecting to Fabric Gateway ....`);
        const adminWalletExists = await xWallet.exists('admin');
        console.log(`⚠️ ⚠️ ⚠️ adminWalletExists: ${adminWalletExists} : if false, quit.`);
        // if (!adminWalletExists) {
        //   return response.status(400).json({
        //     message: '⚠️ ⚠️ ⚠️  Admin wallet does not exist in re-created directory'
        //   });
        // }
        const gateway = new fabric_network_1.Gateway();
        try {
            const xconn = JSON.parse(connectionProfile);
            await gateway.connect(xconn, {
                wallet: xWallet,
                identity: mAdmin,
                discovery: { enabled: true }
            });
            console.log('🔵  🔵  🔵  🔵 Fabric Gateway connected. Good. Extra Sweet!');
        }
        catch (e) {
            console.log(`⚠️  ⚠️  ⚠️ Unable to connect to Fabric Gateway: ${e}`);
            console.log(e);
            return response.status(400).json({
                message: 'Unable to connect to Fabric Gateway ⚠️  ⚠️  ⚠️',
                error: e
            });
        }
        console.log('📍📍  Get the CA client object from the gateway for interacting with the CA.');
        const ca = gateway.getClient().getCertificateAuthority();
        const adminIdentity = gateway.getCurrentIdentity();
        console.log('🔵  🔵  🔵  🔵 Obtained CA client and admin identity');
        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await register(ca, adminIdentity);
        const enrollment = await enroll(ca, secret);
        // await createIdentity(wallet, enrollment);
        return null;
    }
    async function register(ca, adminIdentity) {
        console.log('🔵 🔵 registering on CA and obtaining secret ...');
        let secret;
        try {
            secret = await ca.register({
                affiliation: mAffiliation,
                enrollmentID: userName,
                role: mRole,
            }, adminIdentity);
            console.log(`🔵 🔵  ✅  user registered with the CA`);
        }
        catch (e) {
            console.log('⚠️  ⚠️  ⚠️  - ERROR - ca.register call. Registration MAY have failed. See if timeout');
            console.log('🔵 🔵  - IMPORTANT: check out TIMEOUT error, ' +
                ' even when user is registered anyway ⚠️  ⚠️ ' +
                '⚠️  ⚠️  Enrolment does not happen! - works sporadically, times out 90+ % of the time' +
                'So 📍 📍 📍 📍 📍  - WTF? why is the Certificate Authority timing out ???? ⚠️  ⚠️ ');
            console.log(e);
            response.status(400).json({
                message: '⚠️  ⚠️  ⚠️ Failed to register user',
                error: e
            });
        }
        return secret;
    }
    async function enroll(ca, secret) {
        let enrollment;
        try {
            console.log('📍📍  enrolling on CA with secret ... 🔵  : ' + secret);
            enrollment = await ca.enroll({
                enrollmentID: userName,
                enrollmentSecret: secret,
            });
            console.log(`✅  ca.enroll call: enrolment worked! Yebo Gogo !!!!  ✅  `);
        }
        catch (e) {
            console.log('⚠️  ⚠️  ⚠️ - ERROR ca.enroll call');
            console.log(e);
            process.exit(1);
        }
        return enrollment;
    }
    async function createIdentity(wallet, enrollment) {
        console.log('📍📍  creating identity wallet ...');
        try {
            const userIdentity = fabric_network_1.X509WalletMixin.createIdentity(organization, enrollment.certificate, enrollment.key.toBytes());
            console.log('📍📍  importing identity into wallet directory ...');
            await wallet.import(userName, userIdentity);
            console.log(`✅  ✅  ✅   Successfully registered and enrolled user: ${userName}.`);
            await uploadWallet();
        }
        catch (e) {
        }
    }
    async function uploadWallet() {
        console.log(`🔵  🔵 uploading ${userWalletDir} wallet directory files to Firesreto ...`);
        fs.readdir(userWalletDir, async function (err, files) {
            if (err) {
                console.error("⚠️  ⚠️  Could not list the directory.", err);
                return response.status(400).json({
                    message: '⚠️  ⚠️  Failed to list temporary directory files containg identity',
                    error: err
                });
            }
            else {
                const directoryFromCA = userWalletDir + '/' + files[0];
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
        console.log('🔵 🔵 Certificate Authority has produced a directory with 3 files; hopefully :) : ' + directoryFromCA);
        let cnt = 0;
        fs.readdir(directoryFromCA, async function (error, fileList) {
            console.log('🔵 🔵 CA directory has: ' + fileList.length + ' files. Should be 3 of them!');
            if (!error) {
                for (const file of fileList) {
                    const mpath = directoryFromCA + "/" + file;
                    console.log(`🔵 📍 - uploading ${mpath} to Firestore : reading contents ... `);
                    const buffer = fs.readFileSync(mpath);
                    const fileContents = buffer.toString('utf8');
                    await writeToFirestore(fileContents);
                    cnt++;
                }
                console.log(`🔵 🔵 🔵 🔵  wallet identity files uploaded: ${cnt} 🔵 🔵 🔵 🔵 `);
                console.log(`✅  ✅  ✅  ✅  Blockchain User enrolled OK. Done. Finito!`);
                return response.status(200).json({
                    message: ' ✅  ✅  ✅  ✅  Blockchain User enrolled OK.  Done. Finito!'
                });
            }
            return null;
        });
    }
    async function writeToFirestore(fileContents) {
        console.log('🔵 🔵  write fileContents to Firestore ...');
        let name = null;
        const mprivateKey = fileContents.search('PRIVATE');
        const mpublicKey = fileContents.search('PUBLIC');
        const user = fileContents.search(userName);
        if (mprivateKey > -1) {
            name = 'privateKey';
        }
        if (mpublicKey > -1) {
            name = 'publicKey';
        }
        if (user > -1) {
            name = userName;
        }
        let ref;
        try {
            ref = await firestore.collection('organizations')
                .doc(organization).collection('userFiles')
                .doc(userName)
                .collection('files')
                .add({
                contents: fileContents,
                name: name,
            });
            console.log(`✅  ✅  fileContents written to Firestore path: ${ref.path}`);
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
//# sourceMappingURL=register-user.js.map