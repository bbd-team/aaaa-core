let fs = require("fs");
let path = require("path");
const ethers = require("ethers")
const ERC20 = require("../build/ERC20TOKEN.json")
const WETH9 = require("../build/WETH9.json")
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
const SushiToken = require("../build/SushiToken.json");
const SLPStrategy = require("../build/SLPStrategy.json");
const SLPStrategyFactory = require("../build/SLPStrategyFactory.json");
const AAAADeploy = require("../build/AAAADeploy.json");


let MASTERCHEF_ADDRESS = ""

let tokens = {
  USDT: '',
  USDC: '',
  BURGER: '',
}

let pairs = []
pairs.push(['USDT','WETH'])
pairs.push(['USDC','WETH'])
// pairs.push(['WBTC','WETH'])

let pairAddresses = []

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

  factory = new ethers.ContractFactory(
    WETH9.abi,
    WETH9.bytecode,
    walletWithProvider
  )
  let ins = await factory.deploy(ETHER_SEND_CONFIG)
  await waitForMint(ins.deployTransaction.hash)
  tokens['WETH'] = ins.address

  factory = new ethers.ContractFactory(
    SushiToken.abi,
    SushiToken.bytecode,
    walletWithProvider
  )
  ins = await factory.deploy(ETHER_SEND_CONFIG)
  await waitForMint(ins.deployTransaction.hash)
  tokens['LPREWARD'] = ins.address

}

async function deployLPs() {
  let factory = new ethers.ContractFactory(
    UNIPAIR.abi,
    UNIPAIR.bytecode,
    walletWithProvider
  )

  for(let pair of pairs) {
    ins = await factory.deploy(ETHER_SEND_CONFIG)
    await waitForMint(ins.deployTransaction.hash)
    tokens['LP'+pair[0]+pair[1]] = ins.address
    pairAddresses.push(ins.address)

    tx = await ins.initialize(tokens[pair[0]], tokens[pair[1]], ETHER_SEND_CONFIG)
    console.log('UNIPAIR initialize')
    await waitForMint(tx.hash)
    tx = await ins.mint(config.walletDev, '100000000000000000000000000', ETHER_SEND_CONFIG)
    console.log('UNIPAIR mint')
    await waitForMint(tx.hash)
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

  console.log('deployLPs...')
  await deployLPs()
  
  // business contract
  console.log('deloy contract...')
  await deployContracts()
  
  // MASTERCHEF
  console.log('deloy MASTERCHEF...')
  factory = new ethers.ContractFactory(
    MasterChef.abi,
    MasterChef.bytecode,
    walletWithProvider
  )
  ins = await factory.deploy(tokens['LPREWARD'], config.walletDev, '100000000000000000000', '3077800', '20000000000', ETHER_SEND_CONFIG)
  await waitForMint(ins.deployTransaction.hash)
  MASTERCHEF_ADDRESS = ins.address


}

async function fakeMasterChef() {
  console.log('fakeMasterChef...')
  let ins = new ethers.Contract(
    tokens['LPREWARD'],
    SushiToken.abi,
    getWallet()
  )

  let tx = await ins.transferOwnership(MASTERCHEF_ADDRESS, ETHER_SEND_CONFIG)
  console.log('LPREWARD transferOwnership initialize')
  await waitForMint(tx.hash)

  ins = new ethers.Contract(
    ContractAddress['SLPStrategyFactory'],
    SLPStrategyFactory.abi,
    getWallet()
  )
  tx = await ins.initialize(MASTERCHEF_ADDRESS, ETHER_SEND_CONFIG)
  console.log('SLPStrategyFactory initialize')
  await waitForMint(tx.hash)

  ins = new ethers.Contract(
    MASTERCHEF_ADDRESS,
      MasterChef.abi,
      getWallet()
    )
  
  for(let i=0; i< pairAddresses.length; i++) {
    tx = await ins.add(100, pairAddresses[i], false, ETHER_SEND_CONFIG)
    console.log('MasterChef add pair:', i, pairAddresses[i])
    await waitForMint(tx.hash)
  }
}

async function deployConfig() {
  ins = new ethers.Contract(
    ContractAddress['AAAADeploy'],
    AAAADeploy.abi,
    getWallet()
  )

  console.log('AAAADeploy setMasterchef')
  tx = await ins.setMasterchef(ContractAddress['SLPStrategyFactory'], ETHER_SEND_CONFIG)
  await waitForMint(tx.hash)

  console.log('AAAADeploy changeBallotByteHash')
  let codeHash = ethers.utils.keccak256('0x'+ AAAABallot.bytecode)
  tx = await ins.changeBallotByteHash(codeHash, ETHER_SEND_CONFIG)
  await waitForMint(tx.hash)

  console.log('AAAADeploy setShareToken')
  tx = await ins.setShareToken(tokens['USDT'], ETHER_SEND_CONFIG)
  await waitForMint(tx.hash)

  for(let i=0; i<pairAddresses.length; i++) {
    tx = await ins.createPool(tokens['USDT'], pairAddresses[i], i, ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)
    tx = await ins.createPool(tokens['USDC'], pairAddresses[i], i, ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)
    tx = await ins.createPool(tokens['WETH'], pairAddresses[i], i, ETHER_SEND_CONFIG)
    await waitForMint(tx.hash)
  }
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
  await fakeMasterChef()

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
      tokens['WETH'],
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

    let _tokens=[tokens['USDT'],tokens['USDC'],tokens['WETH']]
    let _values=['1000000000000000000','990000000000000000','50000000000000000000']
    for(let pair of pairAddresses) {
      _tokens.push(pair)
      _values.push('100000000000000000000')
    }
    tx = await ins.setTokenPrice(_tokens, _values, ETHER_SEND_CONFIG)
    console.log('AAAAConfig setTokenPrice')
    await waitForMint(tx.hash)

    tx = await ins.changeDeveloper(ContractAddress['AAAADeploy'], ETHER_SEND_CONFIG)
    console.log('AAAAConfig changeDeveloper')
    await waitForMint(tx.hash)

    // run AAAADeploy
    await deployConfig()

}

async function transfer() {
    // ins = new ethers.Contract(
    //     tokens['LPREWARD'],
    //     ERC20.abi,
    //     getWallet()
    //   )
    // tx = await ins.transfer(MASTERCHEF_ADDRESS, '5000000000000000000000', ETHER_SEND_CONFIG)
    // await waitForMint(tx.hash)

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
        // ins = new ethers.Contract(
        //   tokens['BURGER'],
        //     ERC20.abi,
        //     getWallet()
        //   )
        // tx = await ins.transfer(user, '5000000000000000000000', ETHER_SEND_CONFIG)
        // await waitForMint(tx.hash)

        for(let pair of pairAddresses) {
          ins = new ethers.Contract(
              pair,
              UNIPAIR.abi,
              getWallet()
            )
          tx = await ins.mint(user, '5000000000000000000000', ETHER_SEND_CONFIG)
          await waitForMint(tx.hash)
        }
        
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

    console.log('==========')
    console.log('transfer...')
    await transfer()
}

run()
