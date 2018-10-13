import * as functions from 'firebase-functions';
import * as Helper from './wallet-helper'

export const directWallet = functions.https.onRequest(async (request, response) => {

    if (!request.body) {
        return response.sendStatus(500)
    }
    const sourceSeed = request.body.sourceSeed
    const debug = request.body.debug
    const id = request.body.participantId
    const type = request.body.type
    console.log('Triggered by https request, calling wallet Helper ...: ' + JSON.stringify(request.body))
    const result = await Helper.createWallet(sourceSeed, id, type, debug)
    if (result === 0) {
        response.status(200).send('Wallet created')
    } else {
        response.status(400).send('Wallet creation failed')
    }
    return result
});
