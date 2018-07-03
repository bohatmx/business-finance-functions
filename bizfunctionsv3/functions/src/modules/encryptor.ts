import * as functions from 'firebase-functions';
import * as MyCrypto from './encryptor-util';

export const encrypt =  functions.https.onRequest(async (request, response) => {

    if (!request.body) {
        response.sendStatus(500)
        return
    }
    const accountID = request.body.accountId
    const secret = request.body.secret
    
    
    console.log('################### encrypt account secret for: ' + accountID)
    try {
        const encrypted = await MyCrypto.encrypt(accountID,secret);
        response.send('' + encrypted)

    } catch (e) {
        console.error(e)
        response.sendStatus(500)        
    }
});
