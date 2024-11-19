import { BigDecimal } from "@graphprotocol/graph-ts";

export enum TradeType {
    BUY,
    SELL
}

export const TradeLabel = new Map<TradeType, string>();
TradeLabel.set(TradeType.BUY, 'BUY');
TradeLabel.set(TradeType.SELL, 'SELL');

export class TokenPeriodData {
    volume: BigDecimal;
    type: TradeType;
}

export class TokenPeriodDataWithUSD {
    volumeUSD: BigDecimal;
    volume: BigDecimal;
    type: TradeType;
}