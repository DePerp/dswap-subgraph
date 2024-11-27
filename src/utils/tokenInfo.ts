import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Factory as FactoryABI } from "../../generated/Factory/Factory";
import { DSwapToken } from "../../generated/schema";
export class TokenInfo {
    name: string;
    symbol: string;
    iconIPFS: string;

    constructor() {
        this.name = "";
        this.symbol = "";
        this.iconIPFS = "";
    }
}

export function getTokenInfo(count: BigInt, factoryAddress: Address): TokenInfo {
    const tokenContract = FactoryABI.bind(factoryAddress);
    
    // Create new TokenInfo instance with default values
    let tokenInfo = new TokenInfo();

    // Use try_getDeploymentInfo instead of direct call
    let deploymentInfoResult = tokenContract.try_getDeploymentInfo(count);
    
    if (!deploymentInfoResult.reverted) {
        const result = deploymentInfoResult.value;
        tokenInfo.name = result.name;
        tokenInfo.symbol = result.symbol;
        tokenInfo.iconIPFS = result.tokenIconIPFS;
    }

    return tokenInfo;
}