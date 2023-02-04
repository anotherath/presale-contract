const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("MewToken Test", function () {
  async function deployTokenFixture() {
    const token = await ethers.getContractFactory("MewToken");
    const [owner, addr1, addr2] = await ethers.getSigners();
    const mewToken = await token.deploy();
    return { token, mewToken, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should total supply is 1000_000_000", async function () {
      const { mewToken } = await loadFixture(deployTokenFixture);
      const totalSupply = await mewToken.totalSupply();
      expect(totalSupply).to.equal("1000000000000000000000000000");
    });

    it("Should name is Mew Token", async function () {
      const { mewToken } = await loadFixture(deployTokenFixture);
      const name = await mewToken.name();
      expect(name).to.equal("Mew Token");
    });

    it("Should symbol is MEW", async function () {
      const { mewToken } = await loadFixture(deployTokenFixture);
      const symbol = await mewToken.symbol();
      expect(symbol).to.equal("MEW");
    });

    it("Should decimals is 18", async function () {
      const { mewToken } = await loadFixture(deployTokenFixture);
      const decimals = await mewToken.decimals();
      expect(decimals).to.equal(18);
    });

    it("Should set the right owner", async function () {
      const { mewToken, owner } = await loadFixture(deployTokenFixture);
      const mewTokenOwner = await mewToken.owner();
      expect(mewTokenOwner).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const { mewToken, owner } = await loadFixture(deployTokenFixture);
      const totalSupply = await mewToken.totalSupply();
      const balanceOfOwner = await mewToken.balanceOf(owner.address);
      expect(totalSupply).to.equal(balanceOfOwner);
    });
  });

  describe("Transfer", function () {
    it("Should transfer tokens between accounts", async function () {
      const { mewToken, owner, addr1 } = await loadFixture(deployTokenFixture);

      await expect(
        mewToken.transfer(addr1.address, 5000)
      ).to.changeTokenBalances(mewToken, [owner, addr1], [-5000, 5000]);
    });

    it("Should emit when transfer tokens between accounts", async function () {
      const { mewToken, addr1 } = await loadFixture(deployTokenFixture);

      await expect(mewToken.transfer(addr1.address, 5000)).to.emit(
        mewToken,
        "Transfer"
      );
    });

    it("Should transfer tokens from addr1 to addr2", async function () {
      const { mewToken, owner, addr1, addr2 } = await loadFixture(
        deployTokenFixture
      );

      await expect(
        mewToken.transfer(addr1.address, 5000)
      ).to.changeTokenBalances(mewToken, [owner, addr1], [-5000, 5000]);

      await expect(
        mewToken.connect(addr1).transfer(addr2.address, 1000)
      ).to.changeTokenBalances(mewToken, [addr1, addr2], [-1000, 1000]);
    });

    it("Should transfer tokens from add1 to add2 fail", async function () {
      const { mewToken, owner, addr1, addr2 } = await loadFixture(
        deployTokenFixture
      );

      await expect(
        mewToken.transfer(addr1.address, 5000)
      ).to.changeTokenBalances(mewToken, [owner, addr1], [-5000, 5000]);

      await expect(
        mewToken.connect(addr1).transfer(addr2.address, 6000)
      ).to.be.revertedWith("MewToken: transfer amount exceeds balance");
    });
  });

  describe("Approval and transferFrom", function () {
    it("Should approval from owner to addr1", async function () {
      const { mewToken, owner, addr1 } = await loadFixture(deployTokenFixture);

      await expect(mewToken.approve(addr1.address, 10000)).to.emit(
        mewToken,
        "Approval"
      );

      const allowance = await mewToken.allowance(owner.address, addr1.address);
      expect(allowance).to.equal(10000);
    });

    it("Should transferFrom addr1 to addr2", async function () {
      const { mewToken, owner, addr1, addr2 } = await loadFixture(
        deployTokenFixture
      );

      await expect(
        mewToken.transfer(addr2.address, 10000)
      ).to.changeTokenBalances(mewToken, [owner, addr2], [-10000, 10000]);

      await expect(
        mewToken.connect(addr2).approve(owner.address, 10000)
      ).to.emit(mewToken, "Approval");

      await expect(
        mewToken.transferFrom(addr2.address, addr1.address, 10000)
      ).to.changeTokenBalances(mewToken, [addr1, addr2], [10000, -10000]);
    });
  });
});
