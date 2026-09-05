// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockLand is ERC721 {
    uint256 public nextTokenId;

    constructor() ERC721("Mock Ice Snow Land", "mLAND") {}

    function mint(address recipient) external returns (uint256 tokenId) {
        tokenId = nextTokenId++;
        _safeMint(recipient, tokenId);
    }
}
