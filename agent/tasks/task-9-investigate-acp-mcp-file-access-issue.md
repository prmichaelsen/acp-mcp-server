# Task 9: Investigate acp-mcp File Access Issue

**Milestone**: M2 - Bug Fixes and Improvements
**Estimated Time**: 3-4 hours
**Dependencies**: None
**Status**: Not Started

---

## Objective

Investigate and resolve the file access issue in `@prmichaelsen/acp-mcp` where `acp_remote_read_file` returns "file not found" errors for paths that exist according to `acp_remote_list_files`.

---

## Context

GitHub Issue #1 (https://github.com/prmichaelsen/acp-mcp/issues/1) reports that the `acp_remote_read_file` function fails to read files even when `acp_remote_list_files` confirms they exist. This is a critical bug affecting the core file access capabilities of the acp-mcp server.

**Impact**:
- Cannot reliably read files after listing them
- Breaks agent's ability to inspect source code
- Inconsistent behavior between list and read operations
- Affects all users of the acp-mcp-server project

**Environment**:
- Using ACP MCP via agentbase.me platform
- SSH connection appears to be established (list commands work)
- Read operations fail consistently
- Current dependency: `@prmichaelsen/acp-mcp` v0.4.1

---

## Steps

### 1. Reproduce the Issue Locally

Test the issue in a controlled environment:

```bash
# Use the acp-mcp tools via agentbase.me
# 1. Run acp_remote_list_files on a known directory
# 2. Attempt to read a file from the listed results
# 3. Document the exact error message and behavior
```

**Expected**: File not found error
**Goal**: Confirm the issue exists and understand the exact failure mode

### 2. Review acp-mcp Source Code

Examine the implementation of file access functions:

**Files to Review**:
- `acp_remote_read_file` implementation
- `acp_remote_list_files` implementation
- Path resolution logic
- SSH connection handling
- Working directory context

**Look for**:
- Path resolution differences between list and read
- Working directory assumptions
- Relative vs absolute path handling
- Symbolic link handling
- Permission checks

### 3. Analyze Possible Root Causes

Based on the GitHub issue, investigate these potential causes:

**1. Path Resolution Issue**:
- Does `list_files` return absolute paths but `read_file` expects relative paths?
- Are paths being normalized differently?
- Is there a working directory mismatch?

**2. Permissions Problem**:
- Can the SSH user list but not read files?
- Are there permission checks that differ between operations?

**3. Working Directory Context**:
- Is the working directory set correctly for read operations?
- Does the SSH session maintain state between commands?

**4. Symbolic Link Handling**:
- Are symbolic links being resolved correctly?
- Does `list_files` show symlinks but `read_file` can't follow them?

**5. Race Condition**:
- Is there a timing issue between list and read operations?
- Are files being cached incorrectly?

### 4. Create Test Cases

Develop specific test cases to isolate the issue:

```typescript
// Test Case 1: Absolute path
const path1 = '/home/prmichaelsen/agentbase.me/package.json';

// Test Case 2: Relative path
const path2 = 'package.json';

// Test Case 3: Path from list_files result
const files = await acp_remote_list_files('/home/prmichaelsen/agentbase.me');
const path3 = files[0].path; // Use exact path from list result

// Test Case 4: Different file types
// - Regular file
// - Symbolic link
// - File in subdirectory
```

### 5. Review SSH Connection Implementation

Check how SSH connections are managed:

**Questions to Answer**:
- Is the same SSH session used for list and read?
- Is the working directory preserved between commands?
- Are there any session state issues?
- How are errors from the SSH layer propagated?

### 6. Check for Recent Changes

Review recent commits to `@prmichaelsen/acp-mcp`:

```bash
# Check git history for file access changes
git log --oneline --grep="read\|list\|file" -- src/

# Look for changes between v0.2.0 and v0.4.1
git diff v0.2.0..v0.4.1 -- src/
```

### 7. Implement Fix

Based on findings, implement the appropriate fix:

**Possible Fixes**:
- Normalize paths consistently between list and read
- Set working directory explicitly before read operations
- Add path validation and error messages
- Fix symbolic link resolution
- Add retry logic for transient failures

### 8. Test the Fix

Verify the fix resolves the issue:

```bash
# Test with original failing case
# Test with various path formats
# Test with different file types
# Test with symbolic links
# Test with files in subdirectories
```

### 9. Update Documentation

Document the fix and any path handling requirements:

- Update README if path format matters
- Add comments to code explaining path handling
- Document any breaking changes
- Update CHANGELOG

### 10. Submit Fix to Upstream

If fix is in `@prmichaelsen/acp-mcp`:

```bash
# Create branch
git checkout -b fix/file-access-issue

# Commit changes
git add .
git commit -m "fix: resolve file access issue in acp_remote_read_file

Fixes #1

- Normalize paths consistently between list and read operations
- [Other changes]
"

# Push and create PR
git push origin fix/file-access-issue
```

---

## Verification

- [ ] Issue reproduced locally with clear error messages
- [ ] Root cause identified and documented
- [ ] Test cases created covering various scenarios
- [ ] Fix implemented and tested
- [ ] All test cases pass
- [ ] Original failing case now works
- [ ] No regressions in other file operations
- [ ] Documentation updated
- [ ] Fix submitted to upstream (if applicable)
- [ ] GitHub issue #1 updated with findings

---

## Expected Output

**Investigation Report**:
- Root cause analysis document
- Test cases and results
- Proposed fix with rationale

**Code Changes** (if applicable):
- Fixed file access implementation
- Added tests
- Updated documentation

**GitHub Issue Update**:
- Comment on issue #1 with findings
- Link to PR if fix is submitted
- Close issue when resolved

---

## Common Issues and Solutions

### Issue 1: Cannot reproduce the issue
**Symptom**: File reads work fine in local testing
**Solution**: Ensure testing environment matches production (SSH connection, working directory, permissions)

### Issue 2: Fix works locally but fails in production
**Symptom**: Tests pass but issue persists in agentbase.me
**Solution**: Check for environment-specific differences (SSH configuration, file system layout, permissions)

### Issue 3: Multiple root causes found
**Symptom**: Several issues contributing to the problem
**Solution**: Fix all identified issues, prioritize by impact, test each fix independently

---

## Resources

- [GitHub Issue #1](https://github.com/prmichaelsen/acp-mcp/issues/1): Original bug report
- [acp-mcp Repository](https://github.com/prmichaelsen/acp-mcp): Source code
- [SSH2 Documentation](https://github.com/mscdex/ssh2): SSH library used by acp-mcp
- [Node.js fs Documentation](https://nodejs.org/api/fs.html): File system operations

---

## Notes

- This is a critical bug affecting core functionality
- Issue was reported by the package owner (@prmichaelsen)
- May affect other users of acp-mcp-server
- Fix should be backwards compatible if possible
- Consider adding integration tests to prevent regression
- May need to coordinate with agentbase.me platform team

---

**Next Task**: task-7-fix-package-search-counter-and-metadata.md (pending)
**Related Design Docs**: None
**Related Bug Reports**: 
- agent/reports/acp-mcp-cloud-deployment-blocker.md (related to acp-mcp issues)
**Estimated Completion Date**: TBD
