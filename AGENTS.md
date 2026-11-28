# Development workflow

Deliver one feature slice at a time. Update PROJECT_STATUS.md in the same change as any implementation. Record what works, the entry point, what was verified and what remains. Distinguish design, local prototype, authenticated feature and hosted integration when reporting completion.

Commit and push each completed development step, feature and milestone to the configured GitHub upstream. Include the corresponding status update in the same commit. Review the staged files for secrets and local artifacts, run the relevant checks, and verify that the remote branch points to the pushed commit. Mention the commit in the handoff. If a push is blocked, tell the user what remains local and remind them before moving on.

Use dev for ongoing development and push each completed step to origin/dev. When the user approves a finalized release, merge dev into main through a pull request.
