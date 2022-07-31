const { getNamedAccounts, ethers } = require("hardhat");
const { getWeth, AMOUNT } = require("../scripts/getWeth");
const { getLendingPoolAddress } = require("./getLendingPoolAddress");

async function main() {
  await getWeth();
  const { deployer } = await getNamedAccounts();
  const lendingPool = await getLendingPool(deployer);

  const wethTokenAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

  await approveERC20(wethTokenAddress, lendingPool.address, AMOUNT, deployer);

  await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0);
  console.log("deposited " + AMOUNT);

  //Borrow
  const { availableBorrowsETH, totalDebtETH } = await BorrowData(lendingPool, deployer);

  const number = ethers.utils.formatEther(availableBorrowsETH);
  console.log(number);
  const price = await getDaiPrice();
  const amountDaiToBorrow = (availableBorrowsETH.toString() * 0.95 * 1) / price.toNumber();
  const DaiInWai = ethers.utils.parseEther(amountDaiToBorrow.toString());

  const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  await borrowDai(daiTokenAddress, lendingPool, DaiInWai, deployer);

  await BorrowData(lendingPool, deployer);
  console.log("repaying...");
  await repay(DaiInWai, daiTokenAddress, lendingPool, deployer);

  await BorrowData(lendingPool, deployer);
}

async function BorrowData(lendingPool, deployer) {
  const data = await lendingPool.getUserAccountData(deployer);
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } = data;
  console.log("total collateral: " + ethers.utils.formatEther(totalCollateralETH));
  console.log("total Debt: " + ethers.utils.formatEther(totalDebtETH));
  console.log("AvailableBorrow: " + ethers.utils.formatEther(availableBorrowsETH));
  return { availableBorrowsETH, totalDebtETH };
}

//Lending Pool Address Provider: 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
//Lending Pool ABI

async function getLendingPool(deployer) {
  const LendingPoolAddress = await getLendingPoolAddress();

  const lendingPool = await ethers.getContractAt("ILendingPool", LendingPoolAddress, deployer);
  return lendingPool;
}

async function approveERC20(erc20Address, spenderAddress, amountToSpend, account) {
  const erc20Token = await ethers.getContractAt("IERC20", erc20Address, account);
  const tx = await erc20Token.approve(spenderAddress, amountToSpend);
  await tx.wait(1);
  console.log("approved");
}

async function getDaiPrice() {
  const contractAddress = "0x773616E4d11A78F511299002da57A0a94577F1f4";
  const priceFeed = await ethers.getContractAt("AggregatorV3Interface", contractAddress);
  const answer = (await priceFeed.latestRoundData())[1];
  return answer;
}
async function borrowDai(daiAddress, lendingPool, amountDaiToBorrowWei, account) {
  const borrowTx = await lendingPool.borrow(daiAddress, amountDaiToBorrowWei, 1, 0, account);
  await borrowTx.wait(1);
  console.log("you borrowed");
}

async function repay(amount, daiAddress, lendingPool, account) {
  await approveERC20(daiAddress, lendingPool.address, amount, account);
  const repayTx = await lendingPool.repay(daiAddress, amount, 1, account);
  await repayTx.wait(1);
  console.log("repayed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
