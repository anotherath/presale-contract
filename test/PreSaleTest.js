const { expect } = require("chai");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

const _01Mar2023_8pm = 1677675600; // mar/1/2023, 8:00:00 PM
const _02Mar2023_8pm = 1677762000; // mar/2/2023, 8:00:00 PM
const _02Apr2023_8pm = 1680440400; // apr/2/2023, 8:00:00 PM
const _02May2023_8pm = 1683032400; // may/2/2023, 8:00:00 PM
const _02Jun2023_8pm = 1685710800; // jun/2/2023, 8:00:00 PM
const _02Jul2023_8pm = 1688302800; // jul/2/2023, 8:00:00 PM

const _totalTokenPreSale = ethers.utils.parseEther("1000000000");
const _maxAmountTokenCanBuy = ethers.utils.parseEther("100000000");
const _minAmountTokenCanBuy = ethers.utils.parseEther("1000000");
const _pricePerToken = ethers.utils.parseEther("0.0000001");

describe("PreSale Test", function () {
  async function deployContract() {
    const tokenContract = await ethers.getContractFactory("MewToken");
    const preSaleContract = await ethers.getContractFactory("PreSale");
    const accounts = await ethers.getSigners();

    const token = await tokenContract.deploy();
    const tokenAddress = token.address;

    const preSale = await preSaleContract.deploy(
      tokenAddress,
      _pricePerToken,
      _maxAmountTokenCanBuy,
      _minAmountTokenCanBuy,
      _01Mar2023_8pm,
      _02Mar2023_8pm
    );

    const preSaleAddress = preSale.address;
    await token.approve(preSaleAddress, _totalTokenPreSale);

    return { token, preSale, accounts };
  }
  async function addTokenToContract() {
    const { token, preSale, accounts } = await loadFixture(deployContract);
    await preSale.updateTotalTokenPreSale(_totalTokenPreSale);

    return { token, preSale, accounts };
  }
  describe("Deploy Test", function () {
    it("Should tokenPreSale is true", async function () {
      const { preSale, token } = await loadFixture(deployContract);
      const tokenPreSale = await preSale.tokenPreSale();

      expect(tokenPreSale).to.equal(token.address);
    });

    it("Should maxAmountTokenCanBuy is 100000000", async function () {
      const { preSale } = await loadFixture(deployContract);
      const maxAmountTokenCanBuy = await preSale.maxAmountTokenCanBuy();

      expect(maxAmountTokenCanBuy).to.equal(_maxAmountTokenCanBuy);
    });

    it("Should minAmountTokenCanBuy is 1000000", async function () {
      const { preSale } = await loadFixture(deployContract);
      const minAmountTokenCanBuy = await preSale.minAmountTokenCanBuy();

      expect(minAmountTokenCanBuy).to.equal(_minAmountTokenCanBuy);
    });

    it("Should openSaleTime is _01Mar2023_8pm", async function () {
      const { preSale } = await loadFixture(deployContract);
      const openSaleTime = await preSale.openSaleTime();

      expect(openSaleTime).to.equal(_01Mar2023_8pm);
    });

    it("Should endSaleTime is _02Mar2023_8pm", async function () {
      const { preSale } = await loadFixture(deployContract);
      const endSaleTime = await preSale.endSaleTime();

      expect(endSaleTime).to.equal(_02Mar2023_8pm);
    });
    it("Should pricePerToken is 0.0000001", async function () {
      const { preSale } = await loadFixture(deployContract);
      const pricePerToken = await preSale.pricePerToken();

      expect(pricePerToken).to.equal(_pricePerToken);
    });
  });

  describe("Owner Test", function () {
    it("Should successful when updateTotalTokenPreSale before openSaleTime", async function () {
      const { preSale, token } = await loadFixture(deployContract);
      await time.increaseTo(1677675500);
      await preSale.updateTotalTokenPreSale(_totalTokenPreSale);

      const totalTokenPreSale = await preSale.totalTokenPreSale();

      expect(totalTokenPreSale).to.equal(_totalTokenPreSale);
    });

    it("Should successful when updateTotalTokenPreSale 2 times, half each time", async function () {
      const { preSale, token } = await loadFixture(deployContract);
      await time.increaseTo(1677675500);
      const amount = ethers.utils.parseEther("500000000");
      await preSale.updateTotalTokenPreSale(amount);
      await preSale.updateTotalTokenPreSale(amount);

      const totalTokenPreSale = await preSale.totalTokenPreSale();

      expect(totalTokenPreSale).to.equal(_totalTokenPreSale);
    });

    it("Should fail when set updateTotalTokenPreSale == 0", async function () {
      const { preSale, token } = await loadFixture(deployContract);
      await time.increaseTo(1677675500);
      await expect(preSale.updateTotalTokenPreSale("0")).to.be.revertedWith(
        "PreSale: _totalTokenPreSale is zero"
      );
    });
    it("Should fail when set updateTotalTokenPreSale after openSaleTime", async function () {
      const { preSale, token } = await loadFixture(deployContract);
      await time.increaseTo(1677675601);
      await expect(
        preSale.updateTotalTokenPreSale(_totalTokenPreSale)
      ).to.be.revertedWith("PreSale: update after openSaleTime");
    });

    it("Should fail when withDraw before endSaleTime", async function () {
      const { preSale, token } = await loadFixture(addTokenToContract);

      await time.increaseTo(1677761000);
      await expect(preSale.withDraw()).to.be.revertedWith(
        "PreSale: withDraw before endSaleTime"
      );
    });

    it("Should emit withDraw successful when no one buy", async function () {
      const { preSale, accounts } = await loadFixture(addTokenToContract);
      await time.increaseTo(1677762001);
      expect(await preSale.withDraw())
        .to.emit(preSale, "Withdraw")
        .withArgs(accounts[0].address, "0");
    });

    it("Should withDraw successful when some one transfer eth to contract", async function () {
      const { preSale, accounts } = await loadFixture(addTokenToContract);
      await accounts[1].sendTransaction({
        to: preSale.address,
        value: ethers.utils.parseEther("1.0"),
      });

      await time.increaseTo(1677762001);
      expect(await preSale.withDraw())
        .to.emit(preSale, "Withdraw")
        .withArgs(accounts[0].address, ethers.utils.parseEther("1.0"));
    });
  });
  describe("User Test", function () {
    it("Should fail when buy before openSaleTime", async function () {
      const { preSale, accounts } = await loadFixture(addTokenToContract);
      await time.increaseTo(1677675500);

      await expect(
        preSale
          .connect(accounts[1])
          .buy({ value: ethers.utils.parseEther("0.1") })
      ).to.be.revertedWith("PreSale: buy before openSaleTime");
    });

    it("Should fail when buy after endSaleTime", async function () {
      const { preSale, accounts } = await loadFixture(addTokenToContract);
      await time.increaseTo(1677762001);

      await expect(
        preSale
          .connect(accounts[1])
          .buy({ value: ethers.utils.parseEther("0.1") })
      ).to.be.revertedWith("PreSale: buy after endSaleTime");
    });

    it("Should successful when buy max volume", async function () {
      const { preSale, accounts, token } = await loadFixture(
        addTokenToContract
      );
      await time.increaseTo(1677675601);

      await preSale
        .connect(accounts[1])
        .buy({ value: ethers.utils.parseEther("10") });
      const balanceOfAddress1 = await preSale
        .connect(accounts[1])
        .amountTokenBoughtOf(accounts[1].address);
      expect(balanceOfAddress1).to.equal(_maxAmountTokenCanBuy);
    });

    it("Should fail when buy volume = 0", async function () {
      const { preSale, accounts, token } = await loadFixture(
        addTokenToContract
      );
      await time.increaseTo(1677675601);

      await expect(
        preSale
          .connect(accounts[1])
          .buy({ value: ethers.utils.parseEther("0") })
      ).to.be.revertedWith("PreSale: msg.sender is zero");
    });

    it("Should fail when buy < min and > max", async function () {
      const { preSale, accounts } = await loadFixture(addTokenToContract);
      await time.increaseTo(1677675601);

      await expect(
        preSale
          .connect(accounts[1])
          .buy({ value: ethers.utils.parseEther("0.01") })
      ).to.be.revertedWith(
        "PreSale: amountTokenWillBuy < minAmountTokenCanBuy"
      );
      await expect(
        preSale
          .connect(accounts[1])
          .buy({ value: ethers.utils.parseEther("11") })
      ).to.be.revertedWith("PreSale: amountTokenBuy > maxAmountTokenCanBuy");
    });

    it("Should successful when buy 2 times, half each time", async function () {
      const { preSale, accounts } = await loadFixture(addTokenToContract);
      await time.increaseTo(1677675601);

      await preSale
        .connect(accounts[1])
        .buy({ value: ethers.utils.parseEther("5") });

      await preSale
        .connect(accounts[1])
        .buy({ value: ethers.utils.parseEther("5") });

      expect(
        await preSale
          .connect(accounts[1])
          .amountTokenBoughtOf(accounts[1].address)
      ).to.equal(_maxAmountTokenCanBuy);
    });

    it("Should fail when claim before unlock time", async function () {
      const { preSale, accounts } = await loadFixture(addTokenToContract);
      await time.increaseTo(1677675601);

      await preSale
        .connect(accounts[1])
        .buy({ value: ethers.utils.parseEther("5") });

      await preSale
        .connect(accounts[1])
        .buy({ value: ethers.utils.parseEther("5") });

      await time.increaseTo(1677761000);

      await expect(preSale.connect(accounts[1]).claim()).to.be.revertedWith(
        "PreSale: claim before endSaleTime"
      );
    });

    it("Should successful when claim after unlock time 1", async function () {
      const { preSale, accounts, token } = await loadFixture(
        addTokenToContract
      );
      await time.increaseTo(1677675601);

      await preSale
        .connect(accounts[1])
        .buy({ value: ethers.utils.parseEther("5") });

      await preSale
        .connect(accounts[1])
        .buy({ value: ethers.utils.parseEther("5") });

      await time.increaseTo(1677762001);
      await preSale.connect(accounts[1]).claim();
      await time.increaseTo(1680440401);
      await preSale.connect(accounts[1]).claim();
      await time.increaseTo(1683032401);
      await preSale.connect(accounts[1]).claim();
      await time.increaseTo(1685710801);
      await preSale.connect(accounts[1]).claim();
      await time.increaseTo(1688302801);
      await preSale.connect(accounts[1]).claim();
      await time.increaseTo(1690894801);
      await preSale.connect(accounts[1]).claim();

      const balance = await token.balanceOf(accounts[1].address);

      expect(balance).to.equal(_maxAmountTokenCanBuy);
    });

    it("Should successful when claim after unlock time 2", async function () {
      const { preSale, accounts, token } = await loadFixture(
        addTokenToContract
      );
      await time.increaseTo(1677675601);

      await preSale
        .connect(accounts[1])
        .buy({ value: ethers.utils.parseEther("5") });

      await preSale
        .connect(accounts[1])
        .buy({ value: ethers.utils.parseEther("5") });

      await time.increaseTo(1677762001);
      await preSale.connect(accounts[1]).claim();
      await time.increaseTo(1680440401);
      await preSale.connect(accounts[1]).claim();

      await time.increaseTo(1690894801);
      await preSale.connect(accounts[1]).claim();

      const balance = await token.balanceOf(accounts[1].address);

      expect(balance).to.equal(_maxAmountTokenCanBuy);
    });

    it("Should successful when claim after unlock time 2", async function () {
      const { preSale, accounts, token } = await loadFixture(
        addTokenToContract
      );
      await time.increaseTo(1677675601);

      await preSale
        .connect(accounts[1])
        .buy({ value: ethers.utils.parseEther("5") });

      await preSale
        .connect(accounts[1])
        .buy({ value: ethers.utils.parseEther("5") });

      await time.increaseTo(1690894801);
      await preSale.connect(accounts[1]).claim();

      const balance = await token.balanceOf(accounts[1].address);

      expect(balance).to.equal(_maxAmountTokenCanBuy);
    });
  });
  describe("Mix Test", function () {
    it("Mix 1", async function () {
      const { preSale, token, accounts } = await loadFixture(
        addTokenToContract
      );

      await time.increaseTo(1677675601);

      for (let i = 1; i < 11; i++) {
        await preSale
          .connect(accounts[i])
          .buy({ value: ethers.utils.parseEther("10") });
      }

      await time.increaseTo(1690894801);
      for (let i = 1; i < 11; i++) {
        await preSale.connect(accounts[i]).claim();
      }

      await expect(preSale.withDraw()).to.changeEtherBalances(
        [accounts[0].address, preSale],
        ["100000000000000000000", "-100000000000000000000"]
      );
    });

    it("Mix 2", async function () {
      const { preSale, token, accounts } = await loadFixture(
        addTokenToContract
      );

      await time.increaseTo(1677675601);

      for (let i = 1; i < 11; i++) {
        await preSale
          .connect(accounts[i])
          .buy({ value: ethers.utils.parseEther("10") });
      }
      await expect(
        preSale
          .connect(accounts[11])
          .buy({ value: ethers.utils.parseEther("10") })
      ).to.be.revertedWith("PreSale: totalTokenPreSale is zero");

      await time.increaseTo(1690894801);
      for (let i = 1; i < 11; i++) {
        await preSale.connect(accounts[i]).claim();
      }

      await expect(preSale.withDraw()).to.changeEtherBalances(
        [accounts[0].address, preSale],
        ["100000000000000000000", "-100000000000000000000"]
      );
    });

    it("Mix 3", async function () {
      const { preSale, token, accounts } = await loadFixture(
        addTokenToContract
      );

      await time.increaseTo(1677675601);

      for (let i = 1; i < 10; i++) {
        await preSale
          .connect(accounts[i])
          .buy({ value: ethers.utils.parseEther("10") });
      }

      await time.increaseTo(1690894801);
      for (let i = 1; i < 10; i++) {
        await preSale.connect(accounts[i]).claim();
      }

      await expect(preSale.withDraw()).to.changeEtherBalances(
        [accounts[0].address, preSale],
        ["90000000000000000000", "-90000000000000000000"]
      );
    });

    it("Mix 4", async function () {
      const { preSale, accounts } = await loadFixture(addTokenToContract);

      await time.increaseTo(1677675601);

      for (let i = 1; i < 12; i++) {
        await preSale
          .connect(accounts[i])
          .buy({ value: ethers.utils.parseEther("9") });
      }

      await expect(
        preSale
          .connect(accounts[12])
          .buy({ value: ethers.utils.parseEther("10") })
      ).to.be.revertedWith("PreSale: amountTokenWillBuy > totalTokenPreSale");

      await time.increaseTo(1690894801);
      for (let i = 1; i < 12; i++) {
        await preSale.connect(accounts[i]).claim();
      }
      await expect(preSale.connect(accounts[1]).claim()).to.be.revertedWith(
        "PreSale: claimAmountPercent is zero"
      );

      await expect(preSale.withDraw()).to.changeEtherBalances(
        [accounts[0].address, preSale],
        ["99000000000000000000", "-99000000000000000000"]
      );
    });
  });
});
