import { Constants } from "../models/constants";

const formData = require('form-data')
const axios = require('axios');
export class AxiosComms {
    
    static async execute(url, data) {
        const start = new Date().getTime();
        const mresponse = await axios({
            method: 'post',
            url: url,
            data: data
        }).catch((error) => {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(error.response.data);
        
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
            throw new Error(error.response.data)
               
        });
        const end = new Date().getTime();
        const elapsedSeconds = (end - start) / 1000;
        console.log(`## Axios comms status: ${mresponse.status} after: ${url} * elapsed: ${elapsedSeconds} seconds`)  
        return mresponse
    }
    static async get(url) {
        const start = new Date().getTime();
        const mresponse = await axios({
            method: 'get',
            url: url
        }).catch((error) => {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(error.response.data);
        
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
            throw new Error(error.response.data)
               
        });
        const end = new Date().getTime();
        const elapsedSeconds = (end - start) / 1000;
        console.log(`## Axios comms status: ${mresponse.status} after: ${url} * elapsed: ${elapsedSeconds} seconds`)  
        return mresponse
    }

    static async executeTransaction(functionName: string, jsonString: string, chaincode?: string, channel?: string,  userName?: string) {
        const start = new Date().getTime();
        const url = Constants.DEBUG_BFN_URL + "sendTransaction";
        const bodyFormData = new formData();
        if (!chaincode) {
            bodyFormData.append('chaincode', Constants.DEFAULT_CHAINCODE);
        } else {
            bodyFormData.append('chaincode', chaincode);
        }
        if (!channel) {
            bodyFormData.append('channel', Constants.DEFAULT_CHANNEL);
        } else {
            bodyFormData.append('channel', channel);
        }
        if (!userName) {
            bodyFormData.append('userName', Constants.DEFAULT_USERNAME);
        } else {
            bodyFormData.append('userName', userName);
        }
        
        bodyFormData.append('function', functionName);
        bodyFormData.append('jsonString', jsonString);

        const mresponse = await axios({
            method: 'post',
            url: url,
            data: bodyFormData
        }).catch((error) => {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(error.response.data);
        
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
            throw new Error(error.response.data)
               
        });
        const end = new Date().getTime();
        const elapsedSeconds = (end - start) / 1000;
        console.log(`## Axios comms status: ${mresponse.status} after: ${url} * elapsed: ${elapsedSeconds} seconds`)  
        return mresponse
    }
}