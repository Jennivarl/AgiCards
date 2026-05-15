// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title AgiCardsRegistry
/// @notice 0G proof registry for agent identities, deposits, policies, approvals, and spend receipts.
contract AgiCardsRegistry {
    enum RequestStatus {
        Pending,
        Approved,
        Rejected,
        Completed,
        Cancelled
    }

    struct Agent {
        address owner;
        bytes32 metadataRoot;
        bool paused;
        uint256 createdAt;
    }

    struct Policy {
        bytes32 agentId;
        bytes32 policyRoot;
        uint256 maxPerRequest;
        uint256 dailyLimit;
        bool active;
        uint256 createdAt;
    }

    struct CardRequest {
        bytes32 agentId;
        bytes32 policyId;
        address owner;
        uint256 amount;
        uint256 reservedAmount;
        bytes32 requestRoot;
        RequestStatus status;
        bool stripeMode;
        uint256 createdAt;
    }

    mapping(bytes32 => Agent) public agents;
    mapping(bytes32 => Policy) public policies;
    mapping(bytes32 => CardRequest) public requests;
    mapping(address => uint256) public depositedBalance;
    mapping(address => uint256) public reservedBalance;

    event AgentRegistered(bytes32 indexed agentId, address indexed owner, bytes32 metadataRoot);
    event AgentPaused(bytes32 indexed agentId, bool paused);
    event WalletFunded(address indexed owner, uint256 amount, bytes32 receiptRoot);
    event WalletWithdrawn(address indexed owner, uint256 amount, bytes32 receiptRoot);
    event FundsReserved(address indexed owner, bytes32 indexed requestId, uint256 amount);
    event FundsReleased(address indexed owner, bytes32 indexed requestId, uint256 amount);
    event PolicyCreated(bytes32 indexed policyId, bytes32 indexed agentId, bytes32 policyRoot);
    event PolicyStatusChanged(bytes32 indexed policyId, bool active);
    event CardRequestCreated(
        bytes32 indexed requestId,
        bytes32 indexed agentId,
        bytes32 indexed policyId,
        uint256 amount,
        bool stripeMode,
        bytes32 requestRoot
    );
    event CardRequestApproved(bytes32 indexed requestId, bytes32 decisionRoot);
    event CardRequestRejected(bytes32 indexed requestId, bytes32 decisionRoot);
    event StripeCardLinked(bytes32 indexed requestId, bytes32 stripeCardHash, bytes32 cardMetadataRoot);
    event Web3CardCreated(bytes32 indexed requestId, bytes32 web3CardId, bytes32 cardMetadataRoot);
    event Web3SpendLogged(bytes32 indexed requestId, bytes32 indexed agentId, uint256 amount, bytes32 receiptRoot);
    event StripeAuthorizationLogged(bytes32 indexed requestId, uint256 amount, bytes32 receiptRoot);
    event ReceiptStored(bytes32 indexed entityId, bytes32 receiptRoot);
    event AgentMemoryUpdated(bytes32 indexed agentId, bytes32 memoryRoot);

    modifier onlyAgentOwner(bytes32 agentId) {
        require(agents[agentId].owner == msg.sender, "not agent owner");
        _;
    }

    modifier requestOwner(bytes32 requestId) {
        require(requests[requestId].owner == msg.sender, "not request owner");
        _;
    }

    function registerAgent(bytes32 agentId, bytes32 metadataRoot) external {
        require(agentId != bytes32(0), "invalid agent id");
        require(agents[agentId].owner == address(0), "agent exists");

        agents[agentId] = Agent({
            owner: msg.sender,
            metadataRoot: metadataRoot,
            paused: false,
            createdAt: block.timestamp
        });

        emit AgentRegistered(agentId, msg.sender, metadataRoot);
    }

    function pauseAgent(bytes32 agentId, bool paused) external onlyAgentOwner(agentId) {
        agents[agentId].paused = paused;
        emit AgentPaused(agentId, paused);
    }

    function depositFunds(bytes32 receiptRoot) external payable {
        require(msg.value > 0, "no value");
        depositedBalance[msg.sender] += msg.value;
        emit WalletFunded(msg.sender, msg.value, receiptRoot);
    }

    function withdrawFunds(uint256 amount, bytes32 receiptRoot) external {
        require(amount > 0, "invalid amount");
        require(availableBalance(msg.sender) >= amount, "insufficient available");

        depositedBalance[msg.sender] -= amount;
        emit WalletWithdrawn(msg.sender, amount, receiptRoot);

        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "withdraw failed");
    }

    function createPolicy(
        bytes32 policyId,
        bytes32 agentId,
        bytes32 policyRoot,
        uint256 maxPerRequest,
        uint256 dailyLimit
    ) external onlyAgentOwner(agentId) {
        require(policyId != bytes32(0), "invalid policy id");
        require(policies[policyId].createdAt == 0, "policy exists");
        require(maxPerRequest > 0, "invalid max");
        require(dailyLimit >= maxPerRequest, "daily below max");

        policies[policyId] = Policy({
            agentId: agentId,
            policyRoot: policyRoot,
            maxPerRequest: maxPerRequest,
            dailyLimit: dailyLimit,
            active: true,
            createdAt: block.timestamp
        });

        emit PolicyCreated(policyId, agentId, policyRoot);
    }

    function setPolicyActive(bytes32 policyId, bool active) external onlyAgentOwner(policies[policyId].agentId) {
        require(policies[policyId].createdAt != 0, "unknown policy");
        policies[policyId].active = active;
        emit PolicyStatusChanged(policyId, active);
    }

    function requestCard(
        bytes32 requestId,
        bytes32 agentId,
        bytes32 policyId,
        uint256 amount,
        bytes32 requestRoot,
        bool stripeMode
    ) external onlyAgentOwner(agentId) {
        Agent memory agent = agents[agentId];
        Policy memory policy = policies[policyId];

        require(!agent.paused, "agent paused");
        require(policy.active, "policy inactive");
        require(policy.agentId == agentId, "policy mismatch");
        require(requests[requestId].createdAt == 0, "request exists");
        require(amount > 0, "invalid amount");
        require(amount <= policy.maxPerRequest, "over max request");
        require(availableBalance(msg.sender) >= amount, "insufficient funds");

        reservedBalance[msg.sender] += amount;
        requests[requestId] = CardRequest({
            agentId: agentId,
            policyId: policyId,
            owner: msg.sender,
            amount: amount,
            reservedAmount: amount,
            requestRoot: requestRoot,
            status: RequestStatus.Pending,
            stripeMode: stripeMode,
            createdAt: block.timestamp
        });

        emit FundsReserved(msg.sender, requestId, amount);
        emit CardRequestCreated(requestId, agentId, policyId, amount, stripeMode, requestRoot);
    }

    function approveCardRequest(bytes32 requestId, bytes32 decisionRoot) external requestOwner(requestId) {
        CardRequest storage cardRequest = requests[requestId];
        require(cardRequest.status == RequestStatus.Pending, "not pending");

        cardRequest.status = RequestStatus.Approved;
        emit CardRequestApproved(requestId, decisionRoot);
    }

    function rejectCardRequest(bytes32 requestId, bytes32 decisionRoot) external requestOwner(requestId) {
        CardRequest storage cardRequest = requests[requestId];
        require(cardRequest.status == RequestStatus.Pending, "not pending");

        _releaseReserved(requestId);
        cardRequest.status = RequestStatus.Rejected;
        emit CardRequestRejected(requestId, decisionRoot);
    }

    function linkStripeCard(
        bytes32 requestId,
        bytes32 stripeCardHash,
        bytes32 cardMetadataRoot
    ) external requestOwner(requestId) {
        CardRequest storage cardRequest = requests[requestId];
        require(cardRequest.status == RequestStatus.Approved, "not approved");
        require(cardRequest.stripeMode, "not stripe request");

        emit StripeCardLinked(requestId, stripeCardHash, cardMetadataRoot);
    }

    function createWeb3Card(
        bytes32 requestId,
        bytes32 web3CardId,
        bytes32 cardMetadataRoot
    ) external requestOwner(requestId) {
        CardRequest storage cardRequest = requests[requestId];
        require(cardRequest.status == RequestStatus.Approved, "not approved");
        require(!cardRequest.stripeMode, "not web3 request");

        emit Web3CardCreated(requestId, web3CardId, cardMetadataRoot);
    }

    function logWeb3Spend(bytes32 requestId, uint256 amount, bytes32 receiptRoot) external requestOwner(requestId) {
        CardRequest storage cardRequest = requests[requestId];
        require(cardRequest.status == RequestStatus.Approved, "not approved");
        require(amount <= cardRequest.reservedAmount, "over reserved");

        cardRequest.status = RequestStatus.Completed;
        _consumeReserved(requestId, amount);

        emit Web3SpendLogged(requestId, cardRequest.agentId, amount, receiptRoot);
        emit ReceiptStored(requestId, receiptRoot);
    }

    function logStripeAuthorization(bytes32 requestId, uint256 amount, bytes32 receiptRoot) external requestOwner(requestId) {
        CardRequest storage cardRequest = requests[requestId];
        require(cardRequest.status == RequestStatus.Approved, "not approved");
        require(cardRequest.stripeMode, "not stripe request");
        require(amount <= cardRequest.reservedAmount, "over reserved");

        cardRequest.status = RequestStatus.Completed;
        _consumeReserved(requestId, amount);

        emit StripeAuthorizationLogged(requestId, amount, receiptRoot);
        emit ReceiptStored(requestId, receiptRoot);
    }

    function releaseReservedFunds(bytes32 requestId) external requestOwner(requestId) {
        CardRequest storage cardRequest = requests[requestId];
        require(
            cardRequest.status == RequestStatus.Pending || cardRequest.status == RequestStatus.Approved,
            "cannot release"
        );

        _releaseReserved(requestId);
        cardRequest.status = RequestStatus.Cancelled;
    }

    function updateAgentMemory(bytes32 agentId, bytes32 memoryRoot) external onlyAgentOwner(agentId) {
        emit AgentMemoryUpdated(agentId, memoryRoot);
    }

    function availableBalance(address owner) public view returns (uint256) {
        return depositedBalance[owner] - reservedBalance[owner];
    }

    function _releaseReserved(bytes32 requestId) internal {
        CardRequest storage cardRequest = requests[requestId];
        uint256 amount = cardRequest.reservedAmount;

        if (amount > 0) {
            cardRequest.reservedAmount = 0;
            reservedBalance[cardRequest.owner] -= amount;
            emit FundsReleased(cardRequest.owner, requestId, amount);
        }
    }

    function _consumeReserved(bytes32 requestId, uint256 spentAmount) internal {
        CardRequest storage cardRequest = requests[requestId];
        uint256 reservedAmount = cardRequest.reservedAmount;
        uint256 unusedAmount = reservedAmount - spentAmount;

        cardRequest.reservedAmount = 0;
        reservedBalance[cardRequest.owner] -= reservedAmount;
        depositedBalance[cardRequest.owner] -= spentAmount;

        if (unusedAmount > 0) {
            emit FundsReleased(cardRequest.owner, requestId, unusedAmount);
        }
    }
}

