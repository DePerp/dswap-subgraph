import { Address, BigDecimal, Bytes, BigInt } from "@graphprotocol/graph-ts";
import { Bundle, DSwapToken, HistoricalTokenPrice, TokenData } from "../../generated/schema";
import { TokensPurchased as TokensPurchasedEvent, TokensSold as TokensSoldEvent } from "../../generated/templates/DSwapToken/DSwap";
import { formatPrice, getPrice } from "../utils/price";
import { getLastReachedTimestampByType, updateOrCreateHistoricalTokenPrice, PriceType } from "./periods";
import { TokenPeriodData, TradeLabel, TradeType } from "./stats";

export function handleTokensPurchased(event: TokensPurchasedEvent): void {
    helperTokensChanged(event.address, event.block.timestamp, {
        volume: event.params.tokenAmount.toBigDecimal(),
        type: TradeType.BUY
    });
    helperTokensData(event.address, event.transaction.hash, event.params.tokenAmount.toBigDecimal(), false);
}

export function handleTokensSold(event: TokensSoldEvent): void {
    helperTokensChanged(event.address, event.block.timestamp, {
        volume: event.params.tokenAmount.toBigDecimal(),
        type: TradeType.SELL
    });
    helperTokensData(event.address, event.transaction.hash, event.params.tokenAmount.toBigDecimal(), true);
}

function helperTokensData(address: Bytes, transactionHash: Bytes, tokenAmount: BigDecimal, isSell: boolean): void {
    // let dswapToken = DSwapToken.load(address.toHex())!;

    // let tokenData = new TokenData(transactionHash.toHex());
    // tokenData.volume = tokenAmount;
    // tokenData.token = dswapToken.id;

    // tokenData.type = isSell ? TradeLabel.get(TradeType.SELL) : TradeLabel.get(TradeType.BUY);
    // tokenData.save();
}

function helperTokensChanged(address: Bytes, timestamp: BigInt, tokenData: TokenPeriodData): void {
    let dswapToken = DSwapToken.load(address.toHex())!;
    let ethPrice = Bundle.load("ETH");

    if (ethPrice == null) {
        return;
    }

    const sqrtTokenPrice = getPrice(Address.fromBytes(address));
    const formattedTokenPrice = formatPrice(sqrtTokenPrice, BigInt.fromI32(18));
    const tokenPrice = ethPrice.price.times(formattedTokenPrice);
    
    dswapToken.price = tokenPrice;
    dswapToken.initialPrice = sqrtTokenPrice;
    dswapToken.save();

    updateOrCreateHistoricalTokenPrice(
        timestamp, 
        address, 
        tokenPrice,
        tokenData
    );
}