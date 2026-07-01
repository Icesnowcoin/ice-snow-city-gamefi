// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CharacterNFT
 * @dev ERC721 NFT for Ice Snow City player characters
 * 
 * Features:
 * - Each player can mint one unique character NFT
 * - Character metadata stored on-chain
 * - Transferable and burnable
 * - Enumerable for querying all characters
 */
contract CharacterNFT is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    ERC721Burnable,
    Ownable
{
    using Counters for Counters.Counter;

    // Token ID counter
    Counters.Counter private _tokenIdCounter;

    // Character data structure
    struct Character {
        string name;
        uint256 level;
        uint256 experience;
        uint256 createdAt;
        string characterClass; // 'farmer', 'merchant', 'doctor', etc.
        uint256 stats; // Packed stats (encoded as uint256)
    }

    // Mapping from token ID to character data
    mapping(uint256 => Character) public characters;

    // Mapping from address to token ID (one character per player)
    mapping(address => uint256) public playerCharacters;

    // Events
    event CharacterCreated(
        uint256 indexed tokenId,
        address indexed owner,
        string name,
        string characterClass
    );
    event CharacterLeveledUp(uint256 indexed tokenId, uint256 newLevel);
    event CharacterExperienceGained(uint256 indexed tokenId, uint256 experience);

    // Constants
    uint256 public constant MAX_CHARACTERS_PER_PLAYER = 1;
    uint256 public constant INITIAL_LEVEL = 1;
    uint256 public constant INITIAL_EXPERIENCE = 0;

    /**
     * @dev Constructor initializes the NFT collection
     */
    constructor() ERC721("Ice Snow City Character", "ISC-CHAR") {}

    /**
     * @dev Mint a new character NFT for the caller
     * @param name Character name
     * @param characterClass Character class
     * @param uri Token URI for metadata
     * @return tokenId The ID of the minted token
     */
    function mintCharacter(
        string memory name,
        string memory characterClass,
        string memory uri
    ) public returns (uint256) {
        // Check if player already has a character
        require(
            playerCharacters[msg.sender] == 0,
            "Player already has a character"
        );

        // Increment token counter
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        // Create character data
        characters[tokenId] = Character({
            name: name,
            level: INITIAL_LEVEL,
            experience: INITIAL_EXPERIENCE,
            createdAt: block.timestamp,
            characterClass: characterClass,
            stats: 0 // Initialize with zero stats
        });

        // Map player to character
        playerCharacters[msg.sender] = tokenId;

        // Mint NFT
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);

        emit CharacterCreated(tokenId, msg.sender, name, characterClass);

        return tokenId;
    }

    /**
     * @dev Get character data
     * @param tokenId Token ID
     * @return Character data
     */
    function getCharacter(uint256 tokenId)
        public
        view
        returns (Character memory)
    {
        require(_exists(tokenId), "Character does not exist");
        return characters[tokenId];
    }

    /**
     * @dev Get player's character token ID
     * @param player Player address
     * @return Token ID (0 if no character)
     */
    function getPlayerCharacter(address player) public view returns (uint256) {
        return playerCharacters[player];
    }

    /**
     * @dev Add experience to character
     * @param tokenId Token ID
     * @param amount Experience amount
     */
    function addExperience(uint256 tokenId, uint256 amount) public onlyOwner {
        require(_exists(tokenId), "Character does not exist");

        characters[tokenId].experience += amount;

        // Check for level up
        uint256 experiencePerLevel = 1000;
        uint256 newLevel = characters[tokenId].experience / experiencePerLevel + 1;

        if (newLevel > characters[tokenId].level) {
            characters[tokenId].level = newLevel;
            emit CharacterLeveledUp(tokenId, newLevel);
        }

        emit CharacterExperienceGained(tokenId, amount);
    }

    /**
     * @dev Level up character
     * @param tokenId Token ID
     */
    function levelUp(uint256 tokenId) public onlyOwner {
        require(_exists(tokenId), "Character does not exist");

        characters[tokenId].level++;
        emit CharacterLeveledUp(tokenId, characters[tokenId].level);
    }

    /**
     * @dev Update character stats
     * @param tokenId Token ID
     * @param stats Packed stats
     */
    function updateStats(uint256 tokenId, uint256 stats) public onlyOwner {
        require(_exists(tokenId), "Character does not exist");
        characters[tokenId].stats = stats;
    }

    /**
     * @dev Burn character NFT
     * @param tokenId Token ID
     */
    function burn(uint256 tokenId) public override {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");

        // Remove player mapping
        delete playerCharacters[msg.sender];

        // Burn token
        super.burn(tokenId);
    }

    /**
     * @dev Check if token exists
     * @param tokenId Token ID
     * @return True if token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    // Internal functions to handle ERC721 extensions

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
