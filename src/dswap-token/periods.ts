import {BigDecimal, BigInt, Bytes, log} from "@graphprotocol/graph-ts";
import { CandleStick, HistoricalTokenPrice, TokenData } from "../../generated/schema";
import { TokenPeriodData, TradeLabel, TradeType } from "./stats";

export enum PriceType {
    _MIN = 1,
    _10MIN = 2,
    _HOUR = 3,
    _4HOUR = 4,
    _DAY = 5
}
const PRICES_TYPES_LABEL = new Map<PriceType, string>();
PRICES_TYPES_LABEL.set(PriceType._MIN, "_MIN");
PRICES_TYPES_LABEL.set(PriceType._10MIN, "_10MIN");
PRICES_TYPES_LABEL.set(PriceType._HOUR, "_HOUR");
PRICES_TYPES_LABEL.set(PriceType._4HOUR, "_4HOUR");
PRICES_TYPES_LABEL.set(PriceType._DAY, "_DAY");

const SECONDS_IN_MIN = BigInt.fromI32(60);
const SECONDS_IN_10_MIN = SECONDS_IN_MIN.times(BigInt.fromI32(10));
const SECONDS_IN_HOUR = SECONDS_IN_10_MIN.times(BigInt.fromI32(6));
const SECONDS_IN_4_HOUR = SECONDS_IN_HOUR.times(BigInt.fromI32(4));
const SECONDS_IN_DAY = SECONDS_IN_HOUR.times(BigInt.fromI32(24));

const PERIODS = new Map<PriceType, BigInt>();
PERIODS.set(PriceType._MIN, SECONDS_IN_MIN);
PERIODS.set(PriceType._10MIN, SECONDS_IN_10_MIN);
PERIODS.set(PriceType._HOUR, SECONDS_IN_HOUR);
PERIODS.set(PriceType._4HOUR, SECONDS_IN_4_HOUR);
PERIODS.set(PriceType._DAY, SECONDS_IN_DAY);

export function getLastReachedTimestampByType(timestamp: BigInt, type: PriceType): BigInt {
    let period = PERIODS.get(type);
    if (!period) {
        log.error("Invalid price type: {}", [type.toString()]);
        return timestamp;
    }

    return timestamp.minus(timestamp.mod(period));
}

export function updateOrCreateHistoricalTokenPrice(
    timestamp: BigInt, 
    tokenAddress: Bytes,
    tokenPrice: BigDecimal,
    tokenPeriodData: TokenPeriodData = {
        volume: BigDecimal.fromString("0"),
        type: TradeType.BUY
    },
): void {

    updateOrCreateHistoricalTokenPriceByType(timestamp, PriceType._MIN, tokenAddress, tokenPrice, tokenPeriodData);
    updateOrCreateHistoricalTokenPriceByType(timestamp, PriceType._10MIN, tokenAddress, tokenPrice, tokenPeriodData);
    updateOrCreateHistoricalTokenPriceByType(timestamp, PriceType._HOUR, tokenAddress, tokenPrice, tokenPeriodData);
    updateOrCreateHistoricalTokenPriceByType(timestamp, PriceType._4HOUR, tokenAddress, tokenPrice, tokenPeriodData);
    updateOrCreateHistoricalTokenPriceByType(timestamp, PriceType._DAY, tokenAddress, tokenPrice, tokenPeriodData);
}

// TODO: refactor for different price types
function updateOrCreateHistoricalTokenPriceByType(
    timestamp: BigInt, 
    type: PriceType, 
    tokenAddress: Bytes,
    tokenPrice: BigDecimal,
    tokenPeriodData: TokenPeriodData,
): void {
    const lastReachedTimestamp = getLastReachedTimestampByType(timestamp, type);
    const priceType = PRICES_TYPES_LABEL.get(type);

    const historicalTokenPrice = HistoricalTokenPrice.load(tokenAddress.toHex() + priceType + lastReachedTimestamp.toString());

    if (historicalTokenPrice == null) {
        const newHistoricalTokenPrice = new HistoricalTokenPrice(tokenAddress.toHex() + priceType + lastReachedTimestamp.toString());

        const candleStick = createCandleStick(tokenAddress, type, lastReachedTimestamp, tokenPrice);
        newHistoricalTokenPrice.candleStick = candleStick.id;

        if (tokenPeriodData.volume.gt(BigDecimal.fromString("0"))) {
            const tokenData = createTokenPeriodData(tokenAddress, type, lastReachedTimestamp, tokenPeriodData);
            newHistoricalTokenPrice.stats = tokenData.id;
        }

        newHistoricalTokenPrice.averagePrice = tokenPrice;
        newHistoricalTokenPrice.timestamp = lastReachedTimestamp;
        newHistoricalTokenPrice.token = tokenAddress.toHex();
        newHistoricalTokenPrice.priceType = priceType;

        const tokenPrices = [tokenPrice];

        newHistoricalTokenPrice.prices = tokenPrices;
        newHistoricalTokenPrice.save();
        return;
    }

    const candleStick = CandleStick.load(historicalTokenPrice.candleStick)!;
    candleStick.close = tokenPrice;
    
    if (BigDecimal.compare(tokenPrice, candleStick.high) > 0) {
        candleStick.high = tokenPrice;
    }

    if (BigDecimal.compare(candleStick.low, tokenPrice) > 0) {
        candleStick.low = tokenPrice;
    }
    candleStick.save();

    if (tokenPeriodData.volume.gt(BigDecimal.fromString("0"))) {
        if (historicalTokenPrice.stats !== null) {
            const tokenData = TokenData.load(historicalTokenPrice.stats!)!;
            updateTokenPeriodData(tokenData, tokenPeriodData);
        } else {
            const tokenData = createTokenPeriodData(tokenAddress, type, lastReachedTimestamp, tokenPeriodData);
            historicalTokenPrice.stats = tokenData.id;
        }
    }

    const prices = historicalTokenPrice.prices;
    prices.push(tokenPrice);

    historicalTokenPrice.prices = prices;

    const averageTokenPrice = historicalTokenPrice.prices
        .reduce((a, b) => a.plus(b), BigDecimal.fromString("0"))
        .div(BigDecimal.fromString(historicalTokenPrice.prices.length.toString()));

    historicalTokenPrice.averagePrice = averageTokenPrice;
    historicalTokenPrice.save();
    return;
}

function createCandleStick(
    tokenAddress: Bytes,
    priceType: PriceType,
    timestamp: BigInt,
    tokenPrice: BigDecimal,
): CandleStick {
    const priceTypeLabel = PRICES_TYPES_LABEL.get(priceType);
    const id = tokenAddress.toHex() + priceTypeLabel + "-" + timestamp.toString();
    let candleStick = new CandleStick(id);
    candleStick.open = tokenPrice;
    candleStick.high = tokenPrice;
    candleStick.low = tokenPrice;
    candleStick.close = tokenPrice;
    candleStick.timestamp = timestamp;
    candleStick.save();

    return candleStick;
}

function createTokenPeriodData(
    tokenAddress: Bytes,
    priceType: PriceType,
    timestamp: BigInt,
    tokenData: TokenPeriodData,
): TokenData {
    const priceTypeLabel = PRICES_TYPES_LABEL.get(priceType);
    const id = tokenAddress.toHex() + priceTypeLabel + "-"+ timestamp.toString();
    let tokenPeriodData = new TokenData(id);
    tokenPeriodData.token = tokenAddress.toHex();
    tokenPeriodData.timestamp = timestamp;
    tokenPeriodData.buyVolume = BigDecimal.fromString("0");
    tokenPeriodData.sellVolume = BigDecimal.fromString("0");
    tokenPeriodData.buyAmount = BigInt.fromI32(0);
    tokenPeriodData.sellAmount = BigInt.fromI32(0);

    updateTokenPeriodData(tokenPeriodData, tokenData);
    tokenPeriodData.save();

    return tokenPeriodData;
}

function updateTokenPeriodData(
    tokenData: TokenData,
    tokenPeriodData: TokenPeriodData,
): void {
    if (tokenPeriodData.type == TradeType.BUY) {
        tokenData.buyVolume = tokenData.buyVolume.plus(tokenPeriodData.volume);
        tokenData.buyAmount = tokenData.buyAmount.plus(BigInt.fromI32(1));
    } else {
        tokenData.sellVolume = tokenData.sellVolume.plus(tokenPeriodData.volume);
        tokenData.sellAmount = tokenData.sellAmount.plus(BigInt.fromI32(1));
    }
    tokenData.save();
}