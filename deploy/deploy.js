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
const AAAAQuery2 = require("../build/AAAAQuery2.json")
const MasterChef = require("../build/MasterChef.json");
const CakeLPStrategy = require("../build/CakeLPStrategy.json");

let AAAA_ADDRESS = ""
let USDT_ADDRESS = ""
let LP_TOKEN_ADDRESS = ""
let REWARD_TOKEN_ADDRESS = ""
let PLATFORM_ADDRESS = ""
let GOVERNANCE_ADDRESS = ""
let CONFIG_ADDRESS = ""
let FACTORY_ADDRESS = ""
let MINT_ADDRESS = ""
let SHARE_ADDRESS = ""
let QUERY_ADDRESS = ""
let QUERY2_ADDRESS = ""

let MASTERCHEF_ADDRESS = ""

const ETHER_SEND_CONFIG = {
  gasPrice: ethers.utils.parseUnits("10", "gwei")
}

let config = {
    "url": "",
    "pk": "",
    "mintInterestRate": "1000000000000000000",
    "mintBorrowPower": "5000",
    "walletDev": "", 
    "walletTeam": "", 
    "walletSpare": "", 
    "walletPrice": "",
    "users":[]
}

if(fs.existsSync(path.join(__dirname, ".config.json"))) {
    let _config = JSON.parse(fs.readFileSync(path.join(__dirname, ".config.json")).toString());
    for(let k in config) {
        config[k] = _config[k];
    }
}

console.log("current endpoint  ", config.url)
let provider = new ethers.providers.JsonRpcProvider(config.url)
let walletWithProvider = new ethers.Wallet(config.pk, provider)

function getWallet(key = config.pk) {
  return new ethers.Wallet(key, provider)
}

const sleep = ms =>
  new Promise(resolve =>
    setTimeout(() => {
      resolve()
    }, ms)
  )

async function waitForMint(tx) {
  console.log('tx:', tx)
  let result = null
  do {
    result = await provider.getTransactionReceipt(tx)
    await sleep(100)
  } while (result === null)
  await sleep(200)
}

async function getBlockNumber() {
  return await provider.getBlockNumber()
}

async function deploy() {
  
  // erc 20 Token
  let factory = new ethers.ContractFactory(
    ERC20.abi,
    ERC20.bytecode,
    walletWithProvider
  )
  let ins = await factory.deploy('USDT','USDT','18','100000000000000000000000000',ETHER_SEND_CONFIG)
  await waitForMint(ins.deployTransaction.hash)
  USDT_ADDRESS = ins.address

  ins = await factory.deploy('LP','LP','18','100000000000000000000000000',ETHER_SEND_CONFIG)
  await waitForMint(ins.deployTransaction.hash)
  LP_TOKEN_ADDRESS = ins.address

  ins = await factory.deploy('CAKE','CAKE','18','100000000000000000000000000',ETHER_SEND_CONFIG)
  await waitForMint(ins.deployTransaction.hash)
  REWARD_TOKEN_ADDRESS = ins.address
  
  // PLATFORM
  factory = new ethers.ContractFactory(
    AAAAPlateForm.abi,
    AAAAPlateForm.bytecode,
    walletWithProvider
  )
  ins = await factory.deploy(ETHER_SEND_CONFIG)
  await waitForMint(ins.deployTransaction.hash)
  PLATFORM_ADDRESS = ins.address

  // AAAA
  factory = new ethers.ContractFactory(
    AAAAToken.abi,
    AAAAToken.bytecode,
    walletWithProvider
  )
  ins = await factory.deploy(ETHER_SEND_CONFIG)
  await waitForMint(ins.deployTransaction.hash)
  AAAA_ADDRESS = ins.address

  // GOVERNANCE
  factory = new ethers.ContractFactory(
    AAAAGovernance.abi,
    AAAAGovernance.bytecode,
    walletWithProvider
  )
  ins = await factory.deploy(ETHER_SEND_CONFIG)
  await waitForMint(ins.deployTransaction.hash)
  GOVERNANCE_ADDRESS = ins.address

  // CONFIG
  factory = new ethers.ContractFactory(
    AAAAConfig.abi,
    AAAAConfig.bytecode,
    walletWithProvider
  )
  ins = await factory.deploy(ETHER_SEND_CONFIG)
  await waitForMint(ins.deployTransaction.hash)
  CONFIG_ADDRESS = ins.address

  // FACTORY
  factory = new ethers.ContractFactory(
    AAAAFactory.abi,
    AAAAFactory.bytecode,
    walletWithProvider
  )
  ins = await factory.deploy(ETHER_SEND_CONFIG)
  await waitForMint(ins.deployTransaction.hash)
  FACTORY_ADDRESS = ins.address

  // MINT
  factory = new ethers.ContractFactory(
    AAAAMint.abi,
    AAAAMint.bytecode,
    walletWithProvider
  )
  ins = await factory.deploy(ETHER_SEND_CONFIG)
  await waitForMint(ins.deployTransaction.hash)
  MINT_ADDRESS = ins.address

  // SHARE
  factory = new ethers.ContractFactory(
    AAAAShare.abi,
    AAAAShare.bytecode,
    walletWithProvider
  )
  ins = await factory.deploy(ETHER_SEND_CONFIG)
  await waitForMint(ins.deployTransaction.hash)
  SHARE_ADDRESS = ins.address

  // QUERY
  factory = new ethers.ContractFactory(
    AAAAQuery.abi,
    AAAAQuery.bytecode,
    walletWithProvider
  )
  ins = await factory.deploy(ETHER_SEND_CONFIG)
  await waitForMint(ins.deployTransaction.hash)
  QUERY_ADDRESS = ins.address

  // QUERY2
  factory = new ethers.ContractFactory(
    AAAAQuery2.abi,
    AAAAQuery2.bytecode,
    walletWithProvider
  )
  ins = await factory.deploy(ETHER_SEND_CONFIG)
  await waitForMint(ins.deployTransaction.hash)
  QUERY2_ADDRESS = ins.address

  // MASTERCHEF
  factory = new ethers.ContractFactory(
    MasterChef.abi,
    MasterChef.bytecode,
    walletWithProvider
  )
  ins = await factory.deploy(REWARD_TOKEN_ADDRESS, REWARD_TOKEN_ADDRESS, config.walletDev, 20000000, 0, ETHER_SEND_CONFIG)
  await waitForMint(ins.deployTransaction.hash)
  MASTERCHEF_ADDRESS = ins.address

}

async function initialize() {
    let ins = new ethers.Contract(
        SHARE_ADDRESS,
        AAAAShare.abi,
        getWallet()
      )
    let tx = await ins.setupConfig(CONFIG_ADDRESS, ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)

    ins = new ethers.Contract(
        FACTORY_ADDRESS,
        AAAAFactory.abi,
        getWallet()
      )
    tx = await ins.setupConfig(CONFIG_ADDRESS, ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)

    let codeHash = ethers.utils.keccak256('0x'+ AAAABallot.bytecode)
    tx = await ins.changeBallotByteHash(codeHash, ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)
    
    ins = new ethers.Contract(
        MINT_ADDRESS,
        AAAAMint.abi,
        getWallet()
      )
    tx = await ins.setupConfig(CONFIG_ADDRESS, ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)

    ins = new ethers.Contract(
        PLATFORM_ADDRESS,
        AAAAPlateForm.abi,
        getWallet()
      )
    tx = await ins.setupConfig(CONFIG_ADDRESS, ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)

    ins = new ethers.Contract(
        GOVERNANCE_ADDRESS,
        AAAAGovernance.abi,
        getWallet()
      )
    tx = await ins.setupConfig(CONFIG_ADDRESS, ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)

    ins = new ethers.Contract(
        AAAA_ADDRESS,
        AAAAToken.abi,
        getWallet()
      )
    tx = await ins.setupConfig(CONFIG_ADDRESS, ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)

    ins = new ethers.Contract(
        QUERY_ADDRESS,
        AAAAQuery.abi,
        getWallet()
      )
    tx = await ins.setupConfig(CONFIG_ADDRESS, ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)

    ins = new ethers.Contract(
        QUERY2_ADDRESS,
        AAAAQuery2.abi,
        getWallet()
      )
    tx = await ins.setupConfig(CONFIG_ADDRESS, ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)

    ins = new ethers.Contract(
        CONFIG_ADDRESS,
        AAAAConfig.abi,
        getWallet()
      )
    tx = await ins.initialize(
        PLATFORM_ADDRESS, 
        FACTORY_ADDRESS,
        MINT_ADDRESS,
        AAAA_ADDRESS,
        USDT_ADDRESS,
        SHARE_ADDRESS,
        GOVERNANCE_ADDRESS,
        ETHER_SEND_CONFIG
    )
    await waitForMint(tx.hash)

    tx = await ins.initParameter(ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)

    tx = await ins.setWallets(
        [
            ethers.utils.formatBytes32String("team"), 
            ethers.utils.formatBytes32String("spare"), 
            ethers.utils.formatBytes32String("price")
        ], 
        [
            config.walletTeam, 
            config.walletSpare, 
            config.walletPrice
        ],
        ETHER_SEND_CONFIG
    )
    await waitForMint(tx.hash)

    ins = new ethers.Contract(
        MINT_ADDRESS,
        AAAAMint.abi,
        getWallet()
      )
    tx = await ins.initialize(ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)

    ins = new ethers.Contract(
        SHARE_ADDRESS,
        AAAAShare.abi,
        getWallet()
      )
    tx = await ins.initialize(ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)

    ins = new ethers.Contract(
        AAAA_ADDRESS,
        AAAAToken.abi,
        getWallet()
      )
    tx = await ins.initialize(ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)

    ins = new ethers.Contract(
        MASTERCHEF_ADDRESS,
        MasterChef.abi,
        getWallet()
      )
    tx = await ins.add(100, LP_TOKEN_ADDRESS, false, ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)

    ins = new ethers.Contract(
        FACTORY_ADDRESS,
        AAAAFactory.abi,
        getWallet()
      )
    tx = await ins.createPool(USDT_ADDRESS, LP_TOKEN_ADDRESS, ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)
    let poolAddr = await ins.getPool(USDT_ADDRESS, LP_TOKEN_ADDRESS)
    console.log('pool address:', poolAddr)

    // CakeLPStrategy
    factory = new ethers.ContractFactory(
        CakeLPStrategy.abi,
        CakeLPStrategy.bytecode,
        walletWithProvider
    )
    ins = await factory.deploy(REWARD_TOKEN_ADDRESS, LP_TOKEN_ADDRESS, poolAddr, MASTERCHEF_ADDRESS, 1, ETHER_SEND_CONFIG)
    await waitForMint(ins.deployTransaction.hash)
    let strategyAddr = ins.address

    ins = new ethers.Contract(
        PLATFORM_ADDRESS,
        AAAAPlateForm.abi,
        getWallet()
      )
    tx = await ins.switchStrategy(USDT_ADDRESS, LP_TOKEN_ADDRESS, strategyAddr, ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)
    
    await transfer()
}

async function transfer() {
    for(let user of config.users) {
        ins = new ethers.Contract(
            USDT_ADDRESS,
            ERC20.abi,
            getWallet()
          )
        tx = await ins.transfer(user, '5000000000000000000000', ETHER_SEND_CONFIG)
        await waitForMint(tx.hash)

        ins = new ethers.Contract(
            LP_TOKEN_ADDRESS,
            ERC20.abi,
            getWallet()
          )
        tx = await ins.transfer(user, '5000000000000000000000', ETHER_SEND_CONFIG)
        await waitForMint(tx.hash)
    }
}

async function run() {
    console.log('deploy...')
    await deploy()
    console.log('initialize...')
    await initialize()
    console.log(`
    AAAA_ADDRESS = ${AAAA_ADDRESS}
    PLATFORM_ADDRESS = ${PLATFORM_ADDRESS}
    GOVERNANCE_ADDRESS = ${GOVERNANCE_ADDRESS}
    CONFIG_ADDRESS = ${CONFIG_ADDRESS}
    FACTORY_ADDRESS = ${FACTORY_ADDRESS}
    MINT_ADDRESS = ${MINT_ADDRESS}
    SHARE_ADDRESS = ${SHARE_ADDRESS}
    QUERY_ADDRESS = ${QUERY_ADDRESS}

    ===============================
    
    USDT_ADDRESS = ${USDT_ADDRESS}
    LP_TOKEN_ADDRESS = ${LP_TOKEN_ADDRESS}
    REWARD_TOKEN_ADDRESS = ${REWARD_TOKEN_ADDRESS}
    `)
}

run()
