import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Factory as FactoryABI } from "../../generated/Factory/Factory";
import { DSwapToken } from "../../generated/schema";

export class TokenInfo {
   name: string;
    symbol: string;
    iconIPFS: string;
}

export function getTokenInfo(count: BigInt, factoryAddress: Address): TokenInfo {
    const tokenContract = FactoryABI.bind(factoryAddress);
    const tokenInfo = tokenContract.getDeploymentInfo(count);

    return {
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        iconIPFS: tokenInfo.tokenIconIPFS,
    };
}