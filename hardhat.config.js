require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    local: {
      url: `HTTP://127.0.0.1:7545`,
      accounts: [process.env.PRIV_KEY],
    },
  },
};
