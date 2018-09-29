export class Constants {

    static DEBUG_URL = 'https://bfnrestv3.eu-gb.mybluemix.net/api/'; //FIBRE
    static RELEASE_URL = 'https://bfnrestv3.eu-gb.mybluemix.net/api/'; //CLOUD
    static NameSpace = 'resource:com.oneconnect.biz.';

    static getDebugURL() {
        return this.DEBUG_URL;
    }
    static getReleaseURL() {
        return this.RELEASE_URL;
    }
}
