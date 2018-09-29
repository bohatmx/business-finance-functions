"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const json2typescript_1 = require("json2typescript");
let Customer = class Customer {
};
__decorate([
    json2typescript_1.JsonProperty("participantId", String),
    __metadata("design:type", String)
], Customer.prototype, "participantId", void 0);
__decorate([
    json2typescript_1.JsonProperty("name", String),
    __metadata("design:type", String)
], Customer.prototype, "name", void 0);
__decorate([
    json2typescript_1.JsonProperty("cellphone", String),
    __metadata("design:type", String)
], Customer.prototype, "cellphone", void 0);
__decorate([
    json2typescript_1.JsonProperty("email", String),
    __metadata("design:type", String)
], Customer.prototype, "email", void 0);
__decorate([
    json2typescript_1.JsonProperty("debug", String),
    __metadata("design:type", Boolean)
], Customer.prototype, "debug", void 0);
__decorate([
    json2typescript_1.JsonProperty("allowAutoAccept", String),
    __metadata("design:type", Boolean)
], Customer.prototype, "allowAutoAccept", void 0);
__decorate([
    json2typescript_1.JsonProperty("country", String),
    __metadata("design:type", String)
], Customer.prototype, "country", void 0);
Customer = __decorate([
    json2typescript_1.JsonObject('Customer')
], Customer);
exports.Customer = Customer;
class PurchaseOrder {
}
exports.PurchaseOrder = PurchaseOrder;
//# sourceMappingURL=data.js.map