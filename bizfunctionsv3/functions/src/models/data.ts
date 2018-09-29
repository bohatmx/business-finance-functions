import {JsonObject, JsonProperty} from "json2typescript";
@JsonObject('Customer')
export class Customer {
    @JsonProperty("participantId", String)
    participantId: string;
    @JsonProperty("name", String)
    name: string;
    @JsonProperty("cellphone", String)
    cellphone: string;
    @JsonProperty("email", String)
    email: string;
    @JsonProperty("debug", String)
    debug: boolean;
    @JsonProperty("allowAutoAccept", String)
    allowAutoAccept: boolean;
    @JsonProperty("country", String)
    country: string;

}
export class PurchaseOrder {
    purchaseOrderId: string;
    date: string;
    
}
