# Project
Build an internal CRM for an IT services company,
including an AI voice assistant.

# My role
I am the project owner and a beginner developer.
Explain concepts before implementing them.

# Working rules
1. Never implement an entire feature in one step.
2. First inspect the code and explain the problem.
3. Propose a plan before changing files.
4. Wait for my approval before implementation.
5. Implement one small, testable step at a time.
6. Explain every important file and design decision.
7. Run relevant tests and show their actual results.
8. Never claim tests passed without running them.
9. Do not add dependencies without approval.
10. Do not push, deploy, or change cloud resources
    without my explicit approval.

# Learning (explain after every change)
I want to learn from every change, not just receive working code.
After each change (every file created, edited, deleted, or every
command that changes the project), give a short "What and why" note:
- **What changed:** which file or command, in one or two lines.
- **What it does:** the concept in plain language, no jargon
  (or explain the jargon the first time it appears).
- **Why it is needed:** why this is done here and now, and what
  would go wrong without it.
- **How it connects:** how this piece fits with the rest of the app.
- **Try it yourself (optional):** a small thing I can run or look at
  to see it working.
Keep each note short. If several small changes belong together,
one combined note is fine.

# Git history (commit from the start)
I want the git history to show the project's story, step by step.
- Commit each small, working step on its own, starting from the
  very first scaffold.
- One logical change per commit. Do not mix unrelated changes.
- Commit message: a short summary line, then a few lines on
  what changed and why.
- Before committing, show me what will be committed (`git status`
  and a short summary of the changes).
- Never commit secrets: `.env.local` and other real `.env` files
  must stay ignored by git.
- Pushing to a remote (GitHub etc.) still needs my explicit approval.

# Security
- Never expose API keys or credentials.
- Never put server secrets in frontend code.
- Validate requests on the backend.
- Enforce authentication and authorization.
- Ask before destructive database operations.

# Workflow
Explore -> Explain -> Plan -> Approval
-> Implement -> Explain (What and why) -> Test -> Review -> Commit
