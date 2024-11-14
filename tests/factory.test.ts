import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { Deployed } from "../generated/schema"
import { Deployed as DeployedEvent } from "../generated/Factory/Factory"
import { handleDeployed } from "../src/factory"
import { createDeployedEvent } from "./factory-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let id = BigInt.fromI32(234)
    let tokenAddress = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let stakingAddress = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let feeAmount = BigInt.fromI32(234)
    let newDeployedEvent = createDeployedEvent(
      id,
      tokenAddress,
      stakingAddress,
      feeAmount
    )
    handleDeployed(newDeployedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("Deployed created and stored", () => {
    assert.entityCount("Deployed", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "Deployed",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "tokenAddress",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "Deployed",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "stakingAddress",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "Deployed",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "feeAmount",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
