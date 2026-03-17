---
name: openspec-verify
description: Verify an implemented change against its spec scenarios and acceptance criteria.
---

Verify that the implementation matches the spec.

## Steps

1. Read `openspec/changes/<slug>/specs/` for all requirements and scenarios
2. Read `openspec/changes/<slug>/tasks.md` — confirm all checkboxes are `[x]`
3. For each scenario in the spec:
   - Find the corresponding source code that implements the scenario
   - Verify the implementation covers the WHEN/THEN conditions
   - Flag any scenario without a matching implementation
4. Run provider compilation: `cd provider-agent && npx tsc --noEmit`
5. Verify consumer imports: `cd consumer-agent && .venv/bin/python -c "from tools import ALL_TOOLS; from agent import invoke_agent; print(f'{len(ALL_TOOLS)} tools OK')"`
6. Verify agent card: `curl -s http://localhost:3000/.well-known/agent-card.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d[\"skills\"])} skills')"` (if provider is running)

## Report Format

```
## Verification: <change-name>

### Spec Coverage
- [x] Scenario: <name> — implemented in <file>
- [ ] Scenario: <name> — MISSING IMPLEMENTATION

### Quality Gates
- TypeScript: PASS/FAIL
- Python imports: PASS/FAIL
- Agent Card: PASS/FAIL (X skills)

### Tasks Completion
- X/Y tasks completed in tasks.md

### Verdict
PASS — ready to archive / FAIL — issues listed above
```
