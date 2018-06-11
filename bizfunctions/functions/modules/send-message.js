//receive data from https call and do something
const functions = require('firebase-functions');
exports.sendMessage = functions.https.onRequest((req, res) => {
    // Grab the text parameter.
    const text = req.query.text;
    console.log('send message function ...' + text)
    
    //do something .....
    res.status(200).end();
  });