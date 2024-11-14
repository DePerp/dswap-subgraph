import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import { Deployed } from "../generated/Factory/Factory"

export function createDeployedEvent(
  id: BigInt,
  tokenAddress: Address,
  stakingAddress: Address,
  feeAmount: BigInt
): Deployed {
  let deployedEvent = changetype<Deployed>(newMockEvent())

  deployedEvent.parameters = new Array()

  deployedEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )
  deployedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenAddress",
      ethereum.Value.fromAddress(tokenAddress)
    )
  )
  deployedEvent.parameters.push(
    new ethereum.EventParam(
      "stakingAddress",
      ethereum.Value.fromAddress(stakingAddress)
    )
  )
  deployedEvent.parameters.push(
    new ethereum.EventParam(
      "feeAmount",
      ethereum.Value.fromUnsignedBigInt(feeAmount)
    )
  )

  return deployedEvent
}
