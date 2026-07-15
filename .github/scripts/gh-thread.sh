#!/usr/bin/env bash
# gh-thread — the ONLY GitHub GraphQL surface for the AI-loop Claude sessions
# that ingest untrusted review-thread text (claude-pr-loop.yml fix/verify,
# bestaxbot-reply.yml).
#
# Those sessions deliberately do NOT get `Bash(gh api:*)`: anyone on a public
# repo can reply inside a review thread, and a prompt-injected agent holding
# the bestaxbot PAT plus raw `gh api` could write to anything the token can
# reach (merge/close/label/release) or post secrets publicly. This wrapper
# pins the API surface to exactly the three thread operations the loop needs.
#
# The workflows stage this file onto PATH from origin/main (never from the PR
# branch being worked on), so a checked-out branch can neither miss it nor
# substitute its own copy. Keep it under .github/ — the loop's protected-path
# gate and the agents' Edit/Write deny rules both cover that prefix.
#
# Usage:
#   gh-thread list <pr-number>            # unresolved+resolved threads, JSON
#   gh-thread reply <thread-id> <body>    # reply inside a review thread
#   gh-thread resolve <thread-id>         # resolve a review thread
set -euo pipefail

REPO="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is not set}"

usage() {
  echo "usage: gh-thread list <pr-number> | reply <thread-id> <body> | resolve <thread-id>" >&2
  exit 64
}

[ $# -ge 1 ] || usage
CMD="$1"
shift

case "$CMD" in
  list)
    PR="${1:?usage: gh-thread list <pr-number>}"
    case "$PR" in
      *[!0-9]*) echo "gh-thread: pr-number must be numeric, got: $PR" >&2; exit 64 ;;
    esac
    gh api graphql \
      -f query='query($o:String!,$r:String!,$n:Int!){
        repository(owner:$o,name:$r){pullRequest(number:$n){
          reviewThreads(first:100){nodes{
            id isResolved path line
            comments(first:50){nodes{author{login} body url}}}}}}}' \
      -f o="${REPO%/*}" -f r="${REPO#*/}" -F n="$PR"
    ;;
  reply)
    THREAD="${1:?usage: gh-thread reply <thread-id> <body>}"
    BODY="${2:?usage: gh-thread reply <thread-id> <body>}"
    gh api graphql \
      -f query='mutation($t:ID!,$b:String!){
        addPullRequestReviewThreadReply(
          input:{pullRequestReviewThreadId:$t,body:$b}){comment{id url}}}' \
      -f t="$THREAD" -f b="$BODY"
    ;;
  resolve)
    THREAD="${1:?usage: gh-thread resolve <thread-id>}"
    gh api graphql \
      -f query='mutation($t:ID!){
        resolveReviewThread(input:{threadId:$t}){thread{id isResolved}}}' \
      -f t="$THREAD"
    ;;
  *)
    usage
    ;;
esac
