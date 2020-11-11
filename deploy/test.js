let fs = require("fs");
let path = require("path");
const ethers = require("ethers")
const ERC20 = require("../build/ERC20TOKEN.json")
const AAAABallot = require("../build/AAAABallot.json")
const AAAAConfig = require("../build/AAAAConfig.json")
const AAAAPlateForm = require("../build/AAAAPlatform.json")
const AAAAToken = require("../build/AAAAToken")
const AAAAPool = require("../build/AAAAPool")
const AAAAFactory = require("../build/AAAAFactory.json")
const AAAAGovernance = require("../build/AAAAGovernance.json")
const AAAAMint = require("../build/AAAAMint.json")
const AAAAShare = require("../build/AAAAShare.json")
const AAAAQuery = require("../build/AAAAQuery.json")
const MasterChef = require("../build/MasterChef.json");
const CakeLPStrategy = require("../build/CakeLPStrategy.json");

async function run() {
  let res = ethers.utils.keccak256('0x'+ AAAABallot.bytecode)
  console.log(res)
}
run()
