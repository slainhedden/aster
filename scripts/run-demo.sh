#!/bin/bash
# Automated demo script that exercises the full Aster workflow
# Sends commands to the CLI demo via stdin

set -e

cd "$(dirname "$0")/.."

# Clean up any previous demo database
rm -f ./data/demo.db ./data/demo.db-wal ./data/demo.db-shm

echo "=== Starting Aster Demo ==="
echo ""

# Feed commands to the demo
npx tsx src/demo.ts <<'EOF'
help
skill list
skill add
code-review
Code Review Expert
Reviews code for bugs, security issues, and best practices
When reviewing code: 1) Check for security vulnerabilities 2) Look for performance issues 3) Verify error handling 4) Check code style consistency

skill add
onboarding
Onboarding Guide
Guides new employees through company onboarding
First day: Set up laptop, get badge, meet buddy. First week: Complete compliance training, set up dev environment. First month: Shadow team members, complete first PR.
Q: What do I do on day one? A: Welcome! Set up your laptop with IT, get your badge, and meet your onboarding buddy.
skill add
deploy-process
Deployment Process
Step-by-step guide for deploying to production
Deployment steps: 1) Run all tests 2) Create PR 3) Get 2 approvals 4) Merge to main 5) Monitor CI/CD 6) Verify in staging 7) Promote to production

skill list
skill info code-review
skill search deploy
ask Tell me about the code-review process
ask How do I deploy to production using the deploy-process?
ask What should a new employee do on their first day for onboarding?
skill remove onboarding
skill list
ask Hello, what skills do you have?
quit
EOF

echo ""
echo "=== Demo Complete ==="

# Clean up demo database
rm -f ./data/demo.db ./data/demo.db-wal ./data/demo.db-shm
