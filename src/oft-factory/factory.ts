import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import { Deployed as DeployedEvent } from "../../generated/Factory/Factory"
import { Bundle, Deployed, DSwapToken } from "../../generated/schema"
import { DSwapToken as DSwapTokenTemplate } from "../../generated/templates"
import { getTokenInfo } from "../utils/tokenInfo"
import { getPrice } from "../utils/price"

const factoryAddress = Address.fromString("0x510f33fDAfB957a7698aeb1bfFf02773ce94b38b");

export function handleDeployed(event: DeployedEvent): void {
  let entity = new Deployed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.Factory_id = event.params.id
  entity.tokenAddress = event.params.tokenAddress
  entity.stakingAddress = event.params.stakingAddress
  entity.feeAmount = event.params.feeAmount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  let dswapToken = new DSwapToken(event.params.tokenAddress.toHex());
  dswapToken.price = BigDecimal.fromString("0");
  dswapToken.token = event.params.tokenAddress.toHex();

  const initialPrice = getPrice(Address.fromBytes(event.params.tokenAddress));
  dswapToken.initialPrice = initialPrice;
  dswapToken.count = event.params.id;
  dswapToken.bundle = "ETH";

  const tokenInfo = getTokenInfo(event.params.id, factoryAddress);
  dswapToken.name = tokenInfo.name;
  dswapToken.symbol = tokenInfo.symbol;
  dswapToken.iconIPFS = tokenInfo.iconIPFS;
  dswapToken.createdAt = event.block.timestamp;

  // let bundle = Bundle.load("ETH");
  // if (bundle) {
  //   // const dswapTokens = bundle.dswapTokens;
  //   // dswapTokensId.push(event.params.tokenAddress.toHex());
  //   // bundle.dswapTokensId = dswapTokensId;
  //   bundle.save();
  // } 


  dswapToken.save();

  DSwapTokenTemplate.create(event.params.tokenAddress);
}
