#!/usr/bin/env bash
#
# 生成 GitHub Release 的发布说明。
#
# 与 `gh release create --generate-notes` 不同，这里会逐条列出本次 tag 区间内的
# 每个提交（提交信息 + 所在分支 + 作者 + 日期），而不是只给出一条
# “Full Changelog: v1.2.3...v1.2.4” 链接。
#
# 用法（需要完整的提交历史与远端分支，CI 中以 fetch-depth: 0 检出）：
#   GITHUB_REF_NAME=v1.2.3 GITHUB_REPOSITORY=owner/repo \
#     bash .github/scripts/generate-release-notes.sh [输出文件]
#
# 可选环境变量：
#   GITHUB_SERVER_URL  默认 https://github.com
#   GH_TOKEN           存在时通过 GitHub API 补充提交所属的 PR 源分支
#   MAX_COMMITS        找不到上一个版本 tag 时最多列出的提交数，默认 200
#   PR_LOOKUP_LIMIT   提交数不超过该值时才做 PR 查询，默认 50

set -euo pipefail

tag="${GITHUB_REF_NAME:?需要设置 GITHUB_REF_NAME}"
tag="${tag#refs/tags/}"
repo="${GITHUB_REPOSITORY:-}"
server="${GITHUB_SERVER_URL:-https://github.com}"
out="${1:-release-notes.md}"
max_commits="${MAX_COMMITS:-200}"
pr_lookup_limit="${PR_LOOKUP_LIMIT:-50}"

if ! git rev-parse -q --verify "refs/tags/${tag}^{commit}" >/dev/null 2>&1; then
  git fetch --tags --quiet origin >/dev/null 2>&1 || true
fi
if ! git rev-parse -q --verify "refs/tags/${tag}^{commit}" >/dev/null 2>&1; then
  echo "generate-release-notes: 找不到 tag ${tag}" >&2
  exit 1
fi
tag_commit="$(git rev-parse "${tag}^{commit}")"

# 包含指定提交的分支名（去掉 origin/ 前缀并去重）
branches_containing() {
  git for-each-ref --contains "$1" --format='%(refname)' refs/remotes 2>/dev/null |
    sed -e 's#^refs/remotes/[^/]*/##' |
    grep -vx 'HEAD' |
    awk '!seen[$0]++' ||
    true
}

# $1 的版本号是否小于 $2（按 sort -V 的版本顺序比较）
version_lt() {
  [ "$1" != "$2" ] || return 1
  [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | head -n1)" = "$1" ]
}

# 通过 GitHub API 取提交关联 PR 的源分支，形如 "feature/x (#12)"
pr_branch_of() {
  [ -n "${GH_TOKEN:-}" ] || return 0
  [ -n "$repo" ] || return 0
  command -v gh >/dev/null 2>&1 || return 0
  gh api "repos/${repo}/commits/$1/pulls" \
    --jq '.[0] | select(.head.ref != null) | "\(.head.ref) (#\(.number))"' 2>/dev/null || true
}

# 上一个版本 tag：在可达 tag 中取版本号小于当前 tag 的最大者
previous=""
while IFS= read -r candidate; do
  [ -n "$candidate" ] || continue
  [ "$candidate" = "$tag" ] && continue
  if version_lt "$candidate" "$tag"; then
    previous="$candidate"
    break
  fi
done < <(git tag --merged "$tag_commit" --list 'v[0-9]*' --sort=-v:refname)

# 版本号命名的 tag 都没找到时，退化为“历史中最近的一个 tag”
if [ -z "$previous" ]; then
  previous="$(git describe --tags --abbrev=0 --exclude="$tag" "${tag_commit}^" 2>/dev/null || true)"
  [ "$previous" = "$tag" ] && previous=""
fi

commits_file="$(mktemp)"
trap 'rm -f "$commits_file"' EXIT

if [ -n "$previous" ]; then
  log_source=("${previous}..${tag}")
  range_line="- 变更范围：\`${previous}\` → \`${tag}\`"
  compare_url="${server}/${repo}/compare/${previous}...${tag}"
else
  log_source=(--max-count="${max_commits}" "$tag")
  range_line="- 变更范围：未找到上一个版本 tag，列出最近 ${max_commits} 个提交"
  compare_url=""
fi

git log --no-merges --date=short \
  --pretty=tformat:'%H%x1f%h%x1f%s%x1f%an%x1f%ad' \
  "${log_source[@]}" >"$commits_file"

total="$(wc -l <"$commits_file" | tr -d '[:space:]')"

release_branches="$(branches_containing "$tag_commit" | paste -sd, - | sed 's/,/, /g')"
[ -n "$release_branches" ] || release_branches="未知"

{
  echo "## 本次发布 \`${tag}\`"
  echo
  echo "- 提交数量：${total}"
  echo "${range_line}"
  echo "- 发布分支：\`${release_branches}\`"
  if [ -n "$compare_url" ]; then
    echo "- 完整对比：[${previous}...${tag}](${compare_url})"
  fi
  echo
  echo "### 提交列表"
  echo
  if [ "$total" -eq 0 ]; then
    echo "- 与上一个版本相比没有新的提交。"
  fi

  run_pr_lookup=false
  if [ -n "${GH_TOKEN:-}" ] && [ "$total" -le "$pr_lookup_limit" ]; then
    run_pr_lookup=true
  fi

  while IFS=$'\x1f' read -r sha short subject author authored_date; do
    [ -n "${sha:-}" ] || continue

    branch_text=""
    if [ "$run_pr_lookup" = true ]; then
      branch_text="$(pr_branch_of "$sha")"
    fi
    if [ -z "$branch_text" ]; then
      branch_list="$(branches_containing "$sha")"
      branch_count="$(printf '%s' "$branch_list" | grep -c . || true)"
      case "$branch_count" in
        '' | 0) branch_text="未知" ;;
        *) branch_text="$(printf '%s\n' "$branch_list" | paste -sd, - | sed 's/,/, /g')" ;;
      esac
    fi

    echo "- [\`${short}\`](${server}/${repo}/commit/${sha}) ${subject} — 分支：\`${branch_text}\` — ${author}（${authored_date}）"
  done <"$commits_file"

  echo
  echo "---"
  echo "本说明由 \`release.yml\` 自动生成。"
} >"$out"

echo "generate-release-notes: 已生成 ${out}（${total} 个提交）" >&2
