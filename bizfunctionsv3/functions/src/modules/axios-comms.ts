const axios = require('axios');
export class AxiosComms {

    static async execute(url, data) {
        console.log(`######### AxiosComms.execute starting; ${url} data: ${JSON.stringify(data)}`)
        const mresponse = await axios({
            method: 'post',
            url: url,
            data: data
        }).catch((error) => {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            } else if (error.request) {
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                // http.ClientRequest in node.js
                console.log(error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log('Something happened in setting up the request that triggered an Error: ', 
                error.message);
            }
            console.log(error);
            throw error
               
        });

        console.log(`## BFN response status: ${mresponse.status} after request: ${url}`)  
        return mresponse
    }
}