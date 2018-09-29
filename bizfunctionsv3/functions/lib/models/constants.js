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
exports.Constants = Constants;
//# sourceMappingURL=constants.js.map