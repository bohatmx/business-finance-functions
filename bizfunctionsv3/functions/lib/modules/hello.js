"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript
exports.helloWorld = functions.https.onRequest((request, response) => {
    console.log('Just saying Hello!!!');
    response.send("Hello from the Finance Business Network!");
});
//# sourceMappingURL=hello.js.map