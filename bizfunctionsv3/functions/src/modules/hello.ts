import * as functions from 'firebase-functions';

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = functions.https.onRequest((request, response) => {
    
    if (request.body) {
        const key = request.body.key
        console.log('data from browser: ' + request.body.text)
        response.send("Hello from the Finance Business Network! with data: " + request.body.text);
    } else {
        console.log('Just saying Hello!!!')
        response.send("Hello from the Finance Business Network! NO DATA!");
    }
    
});
