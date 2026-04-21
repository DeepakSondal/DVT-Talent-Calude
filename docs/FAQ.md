# DVT Talent AI — Frequently Asked Questions

### 1. Where does the data come from?
Our agents perform multi-layer discovery across public specialized networks (GitHub, Dice, StackOverflow) and partner job boards (Monster, ZipRecruiter).

### 2. How is 'Integrity' scored?
The **IntegrityScorerAgent** cross-references candidate claims (resume) against public proof-of-work (code repositories, commit history, peer validations) to generate a high-fidelity authenticity score.

### 3. Is my data secure in a multi-tenant environment?
Yes. We use **PostgreSQL Row-Level Security (RLS)** at the database level. Each tenant's data is isolated; even a compromised query will only surface data belonging to the requester's tenant.

### 4. Can we customize the agent "Thinking"?
Enterprise customers can tune agent personas and outreach styles. Contact our Solutions Engineering team for custom swarm configurations.

### 5. What integrations are supported?
We currently support ZipRecruiter (Job Distribution), Monster (Candidate Intake), and Dice (Sourcing). Custom HRIS integrations (Workday, Greenhouse) are available for Enterprise customers.
