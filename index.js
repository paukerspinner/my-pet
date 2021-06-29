const { ChainId, WETH, Fetcher, Token, Route } = require('@pancakeswap-libs/sdk-v2')
const { JsonRpcProvider } = require('@ethersproject/providers')
const Web3 = require('web3')

/// Configurations
const url = 'https://bsc-dataseed.binance.org/'
const provider = new JsonRpcProvider(url)
const web3 = new Web3(url)
const PancakeRouterV2 = '0x10ED43C718714eb63d5aA57B78B54704E256024E'        // Pancake Router V2
///

/// Inputs
    /// Account
    const myAddress = '0x5eeCeF86892DA762119F1F145d624DD45d773969'
    const myPrivateKey = '0x...'
    /// Trading
    const tokenAddress = '0x3c2C8FC79d37C97cF41d0a2E0a4C89953E49cc4e'
    const tokenDecimal = 18
    const acceptableMinPrice = 0.000001         // Belongs to BNB price
    const acceptableMaxPrice = 0.0000025           // Belongs to BNB price

    const amountOut = web3.utils.toWei('100000', 'ether')
    const value = web3.utils.toWei('0.25', 'ether')     // Belongs to BNB price

    const gasPrice = web3.utils.toWei('11', 'gwei')
    const gasLimit = 350000
///

const getPrice = async() => {
    console.log('...')
    const token = new Token(ChainId.MAINNET, tokenAddress, tokenDecimal)
    
    const pair = await Fetcher.fetchPairData(token, WETH[ChainId.MAINNET], provider)
    const route = new Route([pair], WETH[ChainId.MAINNET])
    price = route.midPrice.invert().toSignificant(12)
    return price
}

const isGoodPrice = (price, acceptableMin, acceptableMax) => {
    return price >= acceptableMin && price <= acceptableMax
}

const init = async() => {
    var isSentTx = false
    var proccessing = setInterval(() => {
        getPrice().then((receivedPrice) => {
            console.log('Price:', price)
            if (isGoodPrice(receivedPrice, acceptableMinPrice, acceptableMaxPrice)) {
                if (!isSentTx) {
                    isSentTx = true
                    // Send two transactions
                    // trade()    
                    clearInterval(proccessing)
                }
            }
        })
    }, 500)

    const trade = async() => {
        const abiSwapETHForExactTokens = [{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapETHForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"}]
        const path = [WETH[ChainId.MAINNET].address, tokenAddress]
        const deadline = Math.floor(Date.now() / 1000) + 60 * 2
        const contract = new web3.eth.Contract(abiSwapETHForExactTokens, PancakeRouterV2)

        data = contract.methods.swapETHForExactTokens(
            amountOut,
            path,
            myAddress,
            deadline
        ).encodeABI()

        const tx = {
            from: myAddress,
            to: PancakeRouterV2,
            gasLimit: gasLimit,
            gasPrice: gasPrice,
            value: value,
            data: data
        }

        
        // sign transaction
        const signPromise = web3.eth.accounts.signTransaction(tx, myPrivateKey)
        
        // send signed transaction
        console.log((new Date()).toLocaleTimeString(), 'Sent...')
        signPromise.then(signedTx => {
            const sentTx = web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction, (err, res) => {
                console.log('err: ', err, '\nres: ', res)
            })
        })
    }
}


init()
