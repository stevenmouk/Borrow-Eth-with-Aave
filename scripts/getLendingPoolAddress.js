const { ethers, getNamedAccounts } = require("hardhat");

const contractAddress = "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5";
async function getLendingPoolAddress() {
  const { deployer } = await getNamedAccounts();
  const LendingPool = await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    contractAddress,
    deployer
  );

  const tx = await LendingPool.getLendingPool();
  return tx;
}

module.exports = { getLendingPoolAddress };
