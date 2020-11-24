let fs = require("fs");
let path = require("path");
const ethers = require("ethers")
const ERC20 = require("../build/ERC20TOKEN.json")
const UNIPAIR = require("../build/UniswapPairTest.json")
const AAAABallot = require("../build/AAAABallot.json")
const AAAAConfig = require("../build/AAAAConfig.json")
const AAAAPlateForm = require("../build/AAAAPlatform.json")
const AAAAToken = require("../build/AAAAToken")
const AAAAPool = require("../build/AAAAPool")
const AAAAFactory = require("../build/AAAAFactory.json")
const AAAAGovernance = require("../build/AAAAGovernance.json")
const AAAAMint = require("../build/AAAAMint.json")
const AAAAShare = require("../build/AAAAShare.json")
const AAAAReward = require("../build/AAAAReward.json")
const AAAAQuery = require("../build/AAAAQuery.json")
const AAAAQuery2 = require("../build/AAAAQuery2.json")
const MasterChef = require("../build/SushiMasterChef.json");
const SLPStrategy = require("../build/SLPStrategy.json");
const SLPStrategyFactory = require("../build/SLPStrategyFactory.json");
const AAAADeploy = require("../build/AAAADeploy.json");


let LP1_ADDRESS = ""
let MASTERCHEF_ADDRESS = ""

let tokens = {
  USDT: '',
  USDC: '',
  LPREWARD: '',
  WBTC: '',
  BURGER: '',
}

let Contracts = {
  AAAAToken: AAAAToken,
  AAAAConfig: AAAAConfig,
  AAAAPlateForm: AAAAPlateForm,
  AAAAFactory: AAAAFactory,
  AAAAGovernance: AAAAGovernance,
  AAAAMint: AAAAMint,
  AAAAShare: AAAAShare,
  AAAAReward: AAAAReward,
  AAAAQuery: AAAAQuery,
  AAAAQuery2: AAAAQuery2,
  AAAADeploy: AAAADeploy,
  SLPStrategyFactory: SLPStrategyFactory,
}

let ContractAddress = {}

let config = {
    "url": "",
    "pk": "",
    "gasPrice": "10",
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

let ETHER_SEND_CONFIG = {
    gasPrice: ethers.utils.parseUnits(config.gasPrice, "gwei")
}
  

console.log("current endpoint ", config.url)
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

async function deployTokens() {
  let factory = new ethers.ContractFactory(
    ERC20.abi,
    ERC20.bytecode,
    walletWithProvider
  )
  for (let k in tokens) {
    let decimals = '18'
    if(k=='USDT') decimals = '6'
    let ins = await factory.deploy(k,k,decimals,'100000000000000000000000000',ETHER_SEND_CONFIG)
    await waitForMint(ins.deployTransaction.hash)
    tokens[k] = ins.address
  }
}

async function deployContracts() {
  for (let k in Contracts) {
    let factory = new ethers.ContractFactory(
      Contracts[k].abi,
      Contracts[k].bytecode,
      walletWithProvider
    )
    ins = await factory.deploy(ETHER_SEND_CONFIG)
    await waitForMint(ins.deployTransaction.hash)
    ContractAddress[k] = ins.address
  }
}

async function deploy() {
  
  // erc 20 Token
  console.log('deloy tokens...')
  await deployTokens()

  // business contract
  console.log('deloy contract...')
  await deployContracts()
  
  // LP
  console.log('deloy lp...')
  factory = new ethers.ContractFactory(
    UNIPAIR.abi,
    UNIPAIR.bytecode,
    walletWithProvider
  )
  ins = await factory.deploy(ETHER_SEND_CONFIG)
  await waitForMint(ins.deployTransaction.hash)
  LP1_ADDRESS = ins.address
  tokens['LP1'] = LP1_ADDRESS
  
  // MASTERCHEF
  console.log('deloy MASTERCHEF...')
  factory = new ethers.ContractFactory(
    MasterChef.abi,
    MasterChef.bytecode,
    walletWithProvider
  )
  ins = await factory.deploy(tokens['LPREWARD'], tokens['LPREWARD'], config.walletDev, 20000000, 0, ETHER_SEND_CONFIG)
  await waitForMint(ins.deployTransaction.hash)
  MASTERCHEF_ADDRESS = ins.address
}

async function fakeMasterChef() {
  console.log('fakeMasterChef...')
  let ins = new ethers.Contract(
    LP1_ADDRESS,
    UNIPAIR.abi,
    getWallet()
  )
  tx = await ins.initialize(tokens['WBTC'], tokens['USDT'], ETHER_SEND_CONFIG)
  console.log('UNIPAIR initialize')
  await waitForMint(tx.hash)
  tx = await ins.mint(config.walletDev, '100000000000000000000000000', ETHER_SEND_CONFIG)
  console.log('UNIPAIR mint')
  await waitForMint(tx.hash)

  ins = new ethers.Contract(
    MASTERCHEF_ADDRESS,
      MasterChef.abi,
      getWallet()
    )
  tx = await ins.add(100, LP1_ADDRESS, false, ETHER_SEND_CONFIG)
  console.log('MasterChef add')
  await waitForMint(tx.hash)

  ins = new ethers.Contract(
    ContractAddress['SLPStrategyFactory'],
    SLPStrategyFactory.abi,
    getWallet()
  )
  tx = await ins.initialize(MASTERCHEF_ADDRESS, ETHER_SEND_CONFIG)
  console.log('SLPStrategyFactory initialize')
  await waitForMint(tx.hash)
}

async function setupConfig() {
  let skips = ['AAAAReward', 'AAAAConfig']
  for(let k in ContractAddress) {
    if(skips.indexOf(k) >= 0) continue
    let ins = new ethers.Contract(
      ContractAddress[k],
      Contracts[k].abi,
      getWallet()
    )
    tx = await ins.setupConfig(ContractAddress['AAAAConfig'], ETHER_SEND_CONFIG)
    console.log('AAAAConfig setupConfig:', k)
    await waitForMint(tx.hash)
  }
}

async function initialize() {
  await setupConfig()

    let ins = new ethers.Contract(
        ContractAddress['AAAAConfig'],
        AAAAConfig.abi,
        getWallet()
      )

    console.log('AAAAConfig initialize')
    let tx = await ins.initialize(
      ContractAddress['AAAAPlateForm'],
      ContractAddress['AAAAFactory'],
      ContractAddress['AAAAMint'],
      ContractAddress['AAAAToken'],
      ContractAddress['AAAAShare'],
      ContractAddress['AAAAGovernance'],
      tokens['USDT'],
      ETHER_SEND_CONFIG
    )
    await waitForMint(tx.hash)

    tx = await ins.initParameter(ETHER_SEND_CONFIG)
    console.log('AAAAConfig initParameter')
    await waitForMint(tx.hash)

    tx = await ins.setWallets(
      [
          ethers.utils.formatBytes32String("team"), 
          ethers.utils.formatBytes32String("spare"), 
          ethers.utils.formatBytes32String("reward"), 
          ethers.utils.formatBytes32String("price")
      ], 
      [
          config.walletTeam, 
          config.walletSpare, 
          ContractAddress['AAAAReward'],
          config.walletPrice
      ],
      ETHER_SEND_CONFIG
    )
    console.log('AAAAConfig setWallets')
    await waitForMint(tx.hash)

    tx = await ins.changeDeveloper(
      ContractAddress['AAAADeploy'],
      ETHER_SEND_CONFIG
    )
    console.log('AAAAConfig changeDeveloper')
    await waitForMint(tx.hash)

    // run AAAADeploy
    ins = new ethers.Contract(
      ContractAddress['AAAADeploy'],
      AAAADeploy.abi,
      getWallet()
    )

    console.log('AAAADeploy setMasterchef')
    tx = await ins.setMasterchef(ContractAddress['SLPStrategyFactory'], true, ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)

    console.log('AAAADeploy changeBallotByteHash')
    let codeHash = ethers.utils.keccak256('0x'+ AAAABallot.bytecode)
    tx = await ins.changeBallotByteHash(codeHash, ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)

    console.log('AAAADeploy addMintToken')
    tx = await ins.addMintToken(tokens['USDT'], ETHER_SEND_CONFIG)
    console.log('AAAAConfig addMintToken')
    await waitForMint(tx.hash)
    console.log('AAAAConfig addMintToken')
    tx = await ins.addMintToken(tokens['USDC'], ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)

    await fakeMasterChef()

    // for pool
    console.log('AAAADeploy createPool')
    tx = await ins.createPool(tokens['USDT'], LP1_ADDRESS, 0, ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)
    tx = await ins.createPool(tokens['USDC'], LP1_ADDRESS, 0, ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)
     
    console.log('transfer...')
    await transfer()
}

async function transfer() {
    ins = new ethers.Contract(
        tokens['LPREWARD'],
        ERC20.abi,
        getWallet()
      )
    tx = await ins.transfer(MASTERCHEF_ADDRESS, '5000000000000000000000', ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)

    for(let user of config.users) {
        ins = new ethers.Contract(
            tokens['USDT'],
            ERC20.abi,
            getWallet()
          )
        tx = await ins.transfer(user, '50000000000', ETHER_SEND_CONFIG)
        await waitForMint(tx.hash)

        ins = new ethers.Contract(
          tokens['USDC'],
          ERC20.abi,
          getWallet()
        )
        tx = await ins.transfer(user, '5000000000000000000000', ETHER_SEND_CONFIG)
        await waitForMint(tx.hash)

        ins = new ethers.Contract(
          tokens['BURGER'],
            ERC20.abi,
            getWallet()
          )
        tx = await ins.transfer(user, '5000000000000000000000', ETHER_SEND_CONFIG)
        await waitForMint(tx.hash)

        ins = new ethers.Contract(
          tokens['LP1'],
            UNIPAIR.abi,
            getWallet()
          )
        tx = await ins.mint(user, '5000000000000000000000', ETHER_SEND_CONFIG)
        await waitForMint(tx.hash)
    }
}

async function run() {
    console.log('deploy...')
    await deploy()
    console.log('initialize...')
    await initialize()

    console.log('=====TOKENS=====')
    for(let k in tokens) {
      console.log(k, tokens[k])
    }

    console.log('=====Contracts=====')
    for(let k in ContractAddress) {
      console.log(k, ContractAddress[k])
    }

}

run()
