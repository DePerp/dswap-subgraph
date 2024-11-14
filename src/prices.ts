import { log } from "matchstick-as";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  AccessControlledAggregator,
  AnswerUpdated,
  NewRound
} from "../generated/AccessControlledAggregator/AccessControlledAggregator"
import { Bundle, DSwapToken } from "../generated/schema"
import { formatPrice } from "./utils/price";
import { getLastReachedTimestampByType, updateOrCreateHistoricalTokenPrice, PriceType } from "./dswap-token/periods";

export function handleAnswerUpdated(event: AnswerUpdated): void {
log.debug("handleAnswerUpdated", [event.address.toHexString()]);

  // get description for pair
  let contract = AccessControlledAggregator.bind(event.address);
  let descriptionResult = contract.try_description();
  if (descriptionResult.reverted) {
    return;
  }
  // Remove spaces
  log.info("descriptionResult.value", [descriptionResult.value]);
  const description = descriptionResult.value.split(" ").join("");
  log.info("description", [description]);

    // Add assetPair (just overwrites if it already exists)
  let tokenName = descriptionResult.value.split(" ")[0];
  log.info("tokenName", [tokenName]);

  const ethFormattedPrice = formatPrice(event.params.current.toBigDecimal(), BigInt.fromI32(8));

  let bundle = Bundle.load(tokenName);
  if (bundle == null) {
    bundle = new Bundle(tokenName);
    bundle.token = description;
    bundle.price = ethFormattedPrice;
    bundle.timestamp = event.params.updatedAt;
    bundle.save();
    return;
  }

  bundle.price = ethFormattedPrice;
  bundle.timestamp = event.params.updatedAt;
  bundle.save();

  const dswapTokensId = bundle.dswapTokens.load();

  for (let i = 0; i < dswapTokensId.length; i++) {
    const currentToken = dswapTokensId[i];
    currentToken.price = ethFormattedPrice.times(formatPrice(currentToken.initialPrice, BigInt.fromI32(18)));
    currentToken.save();

    updateOrCreateHistoricalTokenPrice(
        event.params.updatedAt, 
        Address.fromString(currentToken.id), 
        currentToken.price
    );
  }
}

export function handleNewRound(event: NewRound): void {
  log.debug("handleNewRound", [event.address.toHexString()]);
}
