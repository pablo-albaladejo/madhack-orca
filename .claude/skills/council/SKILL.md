---
name: council
description: Run all advisory subagents in parallel on a decision or proposal, then iterate until opinions converge. Use when you need collective validation before committing to a direction.
---

# Council Review

Run all advisory subagents on a decision and iterate until consensus.

**Input**: The argument after `/council` is the decision, proposal, or question to evaluate.

**Steps**

1. **Frame the question**

   If no input provided, use AskUserQuestion to ask:
   > "What decision or proposal should the council review?"

2. **Round 1 — Parallel consultation**

   Launch ALL five subagents in parallel (in a single message with multiple Agent tool calls), each evaluating the same question from their perspective:

   - `hackathon-judge`: "Evaluate this against judging criteria (Functionality, API Integration, Efficiency). Score each: high/medium/low. Verdict: BUILD or SKIP."
   - `demo-coach`: "Will this be visible and impressive in a 3-5 min demo? Verdict: BUILD or SKIP."
   - `ai-engineer`: "Is this technically feasible in the time budget? What's the simplest implementation? Verdict: BUILD or SKIP."
   - `a2a-researcher`: "Are there A2A protocol considerations? Any gotchas? Verdict: BUILD or SKIP."
   - `finops`: "What's the token/cost impact? Is it efficient? Verdict: BUILD or SKIP."

   Include the full decision context in each prompt.

3. **Synthesize Round 1**

   Present a summary table to the user:

   | Agent | Verdict | Key Concern |
   |-------|---------|-------------|
   | hackathon-judge | BUILD/SKIP | ... |
   | demo-coach | BUILD/SKIP | ... |
   | ai-engineer | BUILD/SKIP | ... |
   | a2a-researcher | BUILD/SKIP | ... |
   | finops | BUILD/SKIP | ... |

   **Consensus**: X/5 BUILD

4. **Check convergence**

   - **5/5 or 4/5 agree** → Consensus reached. Present the final recommendation with the synthesized conditions/caveats from all agents.
   - **3/5 or less** → Disagreement detected. Go to Round 2.

5. **Round 2 — Resolution (only if needed)**

   Share ALL Round 1 opinions with the dissenting agents. Launch only the agents that disagreed, in parallel:

   "The council reviewed [decision]. Here are all opinions: [summary]. You disagreed. Given the other perspectives, do you change your verdict? If not, explain what specific change would flip your vote."

6. **Synthesize Round 2**

   Present updated table. Check convergence (4/5+ = consensus). If still no consensus, go to Round 3.

7. **Round 3 — Final resolution (only if needed)**

   Share ALL previous opinions with the remaining dissenters. Launch only agents still disagreeing, in parallel:

   "After 2 rounds, the council is still split. Here are all opinions from both rounds: [summary]. This is the final round. Give your final verdict and a single concrete compromise that would satisfy all parties."

8. **Synthesize Round 3**

   Present updated table. If still no consensus (3/5 or less):
   - Present both sides clearly to the user
   - Highlight the specific tradeoff causing disagreement
   - Ask the user to make the call

9. **Final output**

   ```
   ## Council Verdict: [BUILD/SKIP/USER DECISION NEEDED]

   **Decision**: [the question]
   **Consensus**: X/5 after N rounds

   ### What to build
   [Synthesized recommendation incorporating all agent feedback]

   ### Conditions
   [Non-negotiable requirements from agents that said BUILD]

   ### Risks
   [Concerns flagged by any agent]

   ### Time estimate
   [From ai-engineer]
   ```

**Guardrails**
- Maximum 3 rounds. If no consensus after Round 3, escalate to user.
- Always launch agents in parallel (single message, multiple Agent tool calls).
- Never skip an agent — all 5 perspectives matter.
- The council advises. The user decides.
