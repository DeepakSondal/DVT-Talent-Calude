# DVT Talent AI — Onboarding Guide

Welcome to the future of autonomous recruiting. This guide will take you from initial login to running your first high-precision discovery swarm.

## 🚀 1. The Onboarding Protocol

### Step 1: Nexus Invitation
Log in via the portal at `http://localhost:3000/auth/login`. If your organization has SSO enabled, use the 'Enterprise Identity' button.

### Step 2: Secret Ingestion (Admins Only)
Navigate to `/dashboard/settings`. To empower your agents, ensure the following integration keys are configured in your `.env` or Vault:
- **Serper API**: Powers real-time market signal discovery.
- **ElevenLabs**: Powers high-fidelity synthetic voice outreach.
- **Twilio**: Enables the voice-outreach bridge.

### Step 3: Define Your Target Node
Go to the **Sourcing Hub** (`/dashboard/sourcing`). Here you define the sector and location for the discovery swarm.
- **Sectors**: e.g., "Generative AI", "Fintech Infrastructure".
- **Location**: e.g., "London", "Remote (US Timezones)".

## 🛰️ 2. Running Your First Swarm

1. **Ignition**: Click the 'Initiate Swarm Discovery' button.
2. **Monitoring**: Transition to **The Nexus** (`/dashboard/monitoring`). You will see live signals:
   - `MarketIntelligenceAgent`: Validating industry signals.
   - `LeadDiscoveryAgent`: Extracting key decision-makers.
   - `ConflictResolutionAgent`: Deduplicating nodes in real-time.
3. **The Results**: Within minutes, your **Leads** and **Candidates** grids will hydrate with new intelligence.

## ⚖️ 3. Interpreting Intelligence

### The Heat Score
Each candidate and company is assigned a **Heat Score (0-100)**. 
- **90+**: Exceptional alignment. Immediate outreach recommended.
- **70-85**: Strong node. Requires agent-led screening.
- **<60**: Signal noise. Agent will continue to monitor for better alignment.

### Integrity Verification
Click any candidate to view their **Integrity Scorecard**. This surfaces the AI's reasoning for their ranking and validates their background against external nodes (GitHub, Dice, LinkedIn).

## 🛡️ 4. Governance & Safety
As an enterprise recruiter, all your actions are logged for compliance.
- View the **Audit Log** (`/dashboard/audit`) to track system mutations.
- Use the **Bias Guardrail** in the outreach composer to ensure inclusive communication.

---
**Need Support?** Contact the DVT Intelligence Desk: `support@dvttalent.ai`
