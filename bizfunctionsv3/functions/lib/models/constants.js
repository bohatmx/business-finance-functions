"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Constants {
    static getDebugURL() {
        return this.DEBUG_URL;
    }
    static getReleaseURL() {
        return this.RELEASE_URL;
    }
}
Constants.DEBUG_URL = 'https://bfnrestv3.eu-gb.mybluemix.net/api/'; //FIBRE
Constants.RELEASE_URL = 'https://bfnrestv3.eu-gb.mybluemix.net/api/'; //CLOUD
Constants.NameSpace = 'resource:com.oneconnect.biz.';
Constants.DEBUG_FUNCTIONS_URL = 'https://us-central1-business-finance-dev.cloudfunctions.net/'; //FIBRE
Constants.RELEASE_FUNCTIONS_URL = 'https://us-central1-business-finance-prod.cloudfunctions.net/'; //CLOUD
exports.Constants = Constants;
//# sourceMappingURL=constants.js.map