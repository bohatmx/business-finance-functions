"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript
exports.helloWorld = functions.https.onRequest((request, response) => {
    if (request.body) {
        const key = request.body.key;
        console.log('data from browser: ' + request.body.text);
        response.send("Hello from the Finance Business Network! with data: " + request.body.text);
    }
    else {
        console.log('Just saying Hello!!!');
        response.send("Hello from the Finance Business Network! NO DATA!");
    }
});
//# sourceMappingURL=hello.js.map