# Submission Checklist

## Required

- [ ] Project name: AgiCards
- [ ] One-sentence description under 30 words
- [ ] Public GitHub repository
- [ ] 0G Chain contract address
- [ ] 0G Explorer link with visible activity
- [ ] 0G Storage proof roots for policy, memory, and receipts
- [ ] Demo video under 3 minutes
- [ ] README with architecture and local setup
- [ ] Public X post with required tags and hashtags

## Before Submission

- [ ] Run `npm run verify`
- [ ] Run `npm run build`
- [ ] Update README deployment proof table
- [ ] Confirm demo video is under 3 minutes

## 0G Proof Targets

Add final proof links to the README `Deployment Proof` table before submission.

Minimum proof:

- `AgentRegistered`
- `WalletFunded`
- `PolicyCreated`
- `CardRequestCreated`
- `CardRequestApproved`
- `Web3SpendLogged` or `StripeAuthorizationLogged`
- `ReceiptStored`

Storage proof:

- agent profile root
- policy root
- compute decision root
- spend receipt root
- memory update root

Compute proof:

- request risk decision
- risk score
- policy checks
- reason for approval, rejection, or human review

## Demo Script

Use [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for the complete 3-minute flow.

## X Post Template

AgiCards lets AI agents request controlled virtual cards, with spending policies, approvals, memory, and audit trails powered by 0G.

Built for #0GHackathon #BuildOn0G

@0G_labs @0g_CN @0g_Eco @HackQuest_
