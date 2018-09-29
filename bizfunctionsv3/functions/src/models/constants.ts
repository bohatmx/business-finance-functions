export class Constants {

    static DEBUG_URL = 'https://bfnrestv3.eu-gb.mybluemix.net/api/'; //FIBRE
    static RELEASE_URL = 'https://bfnrestv3.eu-gb.mybluemix.net/api/'; //CLOUD
    static NameSpace = 'resource:com.oneconnect.biz.';

    static DEBUG_FUNCTIONS_URL = 'https://us-central1-business-finance-dev.cloudfunctions.net/'; //FIBRE
    static RELEASE_FUNCTIONS_URL= 'https://us-central1-business-finance-prod.cloudfunctions.net/'; //CLOUD

    static getDebugURL() {
        return this.DEBUG_URL;
    }
    static getReleaseURL() {
        return this.RELEASE_URL;
    }
}
