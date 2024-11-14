import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { DSwap as DSwapABI } from "../../generated/Factory/DSwap";
import { log } from "matchstick-as";

export function getPrice(tokenAddress: Address): BigDecimal {
    const tokenContract = DSwapABI.bind(tokenAddress);
    const price = tokenContract.getCurrentPrice();
    log.debug("price: {}", [price.toString()]);

    return price.toBigDecimal();
}

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let resultString = '1'

  for (let i = 0; i < decimals.toI32(); i++) {
    resultString += '0'
  }

  return BigDecimal.fromString(resultString)
}

export function formatPrice(price: BigDecimal, decimals: BigInt): BigDecimal {
    return price.div(exponentToBigDecimal(decimals));
}

