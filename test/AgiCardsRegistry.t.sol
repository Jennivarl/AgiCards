// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../contracts/AgiCardsRegistry.sol";

contract AgiCardsRegistryTest is Test {
    AgiCardsRegistry registry;

    address alice = makeAddr("alice");
    address bob   = makeAddr("bob");

    bytes32 constant AGENT_ID  = keccak256("agent1");
    bytes32 constant POLICY_ID = keccak256("policy1");
    bytes32 constant REQ_ID    = keccak256("req1");
    bytes32 constant ROOT      = keccak256("root");

    uint256 constant MAX_PER_REQUEST = 1 ether;
    uint256 constant DAILY_LIMIT     = 3 ether;

    function setUp() public {
        registry = new AgiCardsRegistry();
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);

        vm.startPrank(alice);
        registry.registerAgent(AGENT_ID, ROOT);
        registry.createPolicy(POLICY_ID, AGENT_ID, ROOT, MAX_PER_REQUEST, DAILY_LIMIT);
        registry.depositFunds{value: 5 ether}(ROOT);
        vm.stopPrank();
    }

    // ── deposit / withdraw ────────────────────────────────────────────────────

    function test_deposit() public {
        assertEq(registry.depositedBalance(alice), 5 ether);
    }

    function test_withdraw() public {
        vm.prank(alice);
        registry.withdrawFunds(2 ether, ROOT);
        assertEq(registry.depositedBalance(alice), 3 ether);
        assertEq(alice.balance, 7 ether);
    }

    function test_withdraw_insufficient_reverts() public {
        vm.prank(alice);
        vm.expectRevert("insufficient available");
        registry.withdrawFunds(10 ether, ROOT);
    }

    function test_withdraw_zero_reverts() public {
        vm.prank(alice);
        vm.expectRevert("invalid amount");
        registry.withdrawFunds(0, ROOT);
    }

    // ── agent registration ────────────────────────────────────────────────────

    function test_register_agent() public {
        (address owner,,,) = registry.agents(AGENT_ID);
        assertEq(owner, alice);
    }

    function test_register_duplicate_reverts() public {
        vm.prank(bob);
        vm.expectRevert("agent exists");
        registry.registerAgent(AGENT_ID, ROOT);
    }

    function test_register_zero_id_reverts() public {
        vm.prank(alice);
        vm.expectRevert("invalid agent id");
        registry.registerAgent(bytes32(0), ROOT);
    }

    // ── daily limit enforcement ───────────────────────────────────────────────

    function test_daily_limit_enforced() public {
        vm.startPrank(alice);

        // 3 requests of 1 ether = exactly 3 ether (== dailyLimit) — should all pass
        registry.requestCard(keccak256("r1"), AGENT_ID, POLICY_ID, 1 ether, ROOT, false);
        registry.requestCard(keccak256("r2"), AGENT_ID, POLICY_ID, 1 ether, ROOT, false);
        registry.requestCard(keccak256("r3"), AGENT_ID, POLICY_ID, 1 ether, ROOT, false);

        // 4th request would exceed daily limit
        vm.expectRevert("daily limit exceeded");
        registry.requestCard(keccak256("r4"), AGENT_ID, POLICY_ID, 1 ether, ROOT, false);

        vm.stopPrank();
    }

    function test_daily_limit_resets_next_day() public {
        vm.prank(alice);
        registry.requestCard(keccak256("r1"), AGENT_ID, POLICY_ID, 1 ether, ROOT, false);

        // advance 1 day
        vm.warp(block.timestamp + 1 days);

        // should succeed on the new day
        vm.prank(alice);
        registry.requestCard(keccak256("r2"), AGENT_ID, POLICY_ID, 1 ether, ROOT, false);
    }

    // ── request lifecycle ─────────────────────────────────────────────────────

    function _createRequest() internal returns (bytes32 reqId) {
        reqId = REQ_ID;
        vm.prank(alice);
        registry.requestCard(reqId, AGENT_ID, POLICY_ID, 0.5 ether, ROOT, false);
    }

    function test_requestCard_reserves_funds() public {
        _createRequest();
        assertEq(registry.reservedBalance(alice), 0.5 ether);
        assertEq(registry.availableBalance(alice), 4.5 ether);
    }

    function test_approve_then_log_web3_spend() public {
        _createRequest();

        vm.startPrank(alice);
        registry.approveCardRequest(REQ_ID, ROOT);
        registry.logWeb3Spend(REQ_ID, 0.4 ether, ROOT);
        vm.stopPrank();

        assertEq(registry.depositedBalance(alice), 4.6 ether); // 5 - 0.4 spent
        assertEq(registry.reservedBalance(alice), 0);
    }

    function test_reject_releases_funds() public {
        _createRequest();

        vm.prank(alice);
        registry.rejectCardRequest(REQ_ID, ROOT);

        assertEq(registry.reservedBalance(alice), 0);
        assertEq(registry.availableBalance(alice), 5 ether);
    }

    function test_release_reserved_cancels() public {
        _createRequest();

        vm.prank(alice);
        registry.releaseReservedFunds(REQ_ID);

        assertEq(registry.reservedBalance(alice), 0);
        (,,,,,, AgiCardsRegistry.RequestStatus status,,) = registry.requests(REQ_ID);
        assertEq(uint256(status), uint256(AgiCardsRegistry.RequestStatus.Cancelled));
    }

    // ── zero-spend fix ────────────────────────────────────────────────────────

    function test_log_web3_spend_zero_reverts() public {
        _createRequest();

        vm.startPrank(alice);
        registry.approveCardRequest(REQ_ID, ROOT);
        vm.expectRevert("invalid spend amount");
        registry.logWeb3Spend(REQ_ID, 0, ROOT);
        vm.stopPrank();
    }

    function test_log_stripe_auth_zero_reverts() public {
        vm.prank(alice);
        registry.requestCard(REQ_ID, AGENT_ID, POLICY_ID, 0.5 ether, ROOT, true);

        vm.startPrank(alice);
        registry.approveCardRequest(REQ_ID, ROOT);
        vm.expectRevert("invalid spend amount");
        registry.logStripeAuthorization(REQ_ID, 0, ROOT);
        vm.stopPrank();
    }

    // ── mode check fix ────────────────────────────────────────────────────────

    function test_log_web3_spend_on_stripe_request_reverts() public {
        vm.prank(alice);
        registry.requestCard(REQ_ID, AGENT_ID, POLICY_ID, 0.5 ether, ROOT, true); // stripeMode=true

        vm.startPrank(alice);
        registry.approveCardRequest(REQ_ID, ROOT);
        vm.expectRevert("use logStripeAuthorization");
        registry.logWeb3Spend(REQ_ID, 0.5 ether, ROOT);
        vm.stopPrank();
    }

    function test_log_stripe_auth_on_web3_request_reverts() public {
        _createRequest(); // stripeMode=false

        vm.startPrank(alice);
        registry.approveCardRequest(REQ_ID, ROOT);
        vm.expectRevert("not stripe request");
        registry.logStripeAuthorization(REQ_ID, 0.5 ether, ROOT);
        vm.stopPrank();
    }

    // ── agent pause gates in-flight requests ─────────────────────────────────

    function test_pause_blocks_log_web3_spend() public {
        _createRequest();

        vm.startPrank(alice);
        registry.approveCardRequest(REQ_ID, ROOT);
        registry.pauseAgent(AGENT_ID, true);
        vm.expectRevert("agent paused");
        registry.logWeb3Spend(REQ_ID, 0.5 ether, ROOT);
        vm.stopPrank();
    }

    function test_pause_blocks_log_stripe_auth() public {
        vm.prank(alice);
        registry.requestCard(REQ_ID, AGENT_ID, POLICY_ID, 0.5 ether, ROOT, true);

        vm.startPrank(alice);
        registry.approveCardRequest(REQ_ID, ROOT);
        registry.pauseAgent(AGENT_ID, true);
        vm.expectRevert("agent paused");
        registry.logStripeAuthorization(REQ_ID, 0.5 ether, ROOT);
        vm.stopPrank();
    }

    // ── conservation invariant ────────────────────────────────────────────────

    function test_deposited_always_gte_reserved() public {
        vm.startPrank(alice);
        registry.requestCard(REQ_ID, AGENT_ID, POLICY_ID, 0.5 ether, ROOT, false);
        assertGe(registry.depositedBalance(alice), registry.reservedBalance(alice));

        registry.approveCardRequest(REQ_ID, ROOT);
        assertGe(registry.depositedBalance(alice), registry.reservedBalance(alice));

        registry.logWeb3Spend(REQ_ID, 0.5 ether, ROOT);
        assertGe(registry.depositedBalance(alice), registry.reservedBalance(alice));
        vm.stopPrank();
    }

    function test_available_balance_correct_after_spend() public {
        uint256 deposit = 5 ether;
        uint256 spend   = 0.3 ether;
        uint256 reserve = 0.5 ether;

        vm.startPrank(alice);
        registry.requestCard(REQ_ID, AGENT_ID, POLICY_ID, reserve, ROOT, false);
        registry.approveCardRequest(REQ_ID, ROOT);
        registry.logWeb3Spend(REQ_ID, spend, ROOT);
        vm.stopPrank();

        // deposited = 5 - 0.3 = 4.7; reserved = 0; available = 4.7
        assertEq(registry.availableBalance(alice), deposit - spend);
    }

    // ── reentrancy guard ──────────────────────────────────────────────────────

    function test_reentrant_withdraw_blocked() public {
        ReentrantWithdrawer attacker = new ReentrantWithdrawer(registry);
        vm.deal(address(attacker), 2 ether);

        attacker.deposit{value: 2 ether}();
        vm.expectRevert("reentrant");
        attacker.attack();
    }
}

contract ReentrantWithdrawer {
    AgiCardsRegistry registry;
    uint256 attackCount;

    constructor(AgiCardsRegistry _registry) {
        registry = _registry;
    }

    function deposit() external payable {
        registry.depositFunds{value: msg.value}(bytes32(0));
    }

    function attack() external {
        registry.withdrawFunds(1 ether, bytes32(0));
    }

    receive() external payable {
        if (attackCount == 0) {
            attackCount++;
            registry.withdrawFunds(1 ether, bytes32(0));
        }
    }
}
