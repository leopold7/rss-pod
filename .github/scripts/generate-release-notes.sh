#!/usr/bin/env bash
#
# 生成 GitHub Release 的发布说明。
#
# 逐条列出本次 tag 区间内的每个提交（列表项，短 hash 为指向该提交的链接），
# 末尾附一行 Full Changelog 对比链接。渲染后形如：
#
#   ## 提交列表
#
#   - e66646a docs(readme): 移除多余分隔线
#   - ab06054 fix(轮询): 重复抓取不再用频道时间重定日期
#
#   Full Changelog: v0.30.0...v0.31.0
#
# 用法（需要完整的提交历史与远端 tag，CI 中以 fetch-depth: 0 检出）：
#   GITHUB_REF_NAME=v1.2.3 GITHUB_REPOSITORY=owner/repo \
#     bash .github/scripts/generate-release-notes.sh [输出文件]
#
# 可选环境变量：
#   RELEASE_TAG        要生成说明的 tag；优先于 GITHUB_REF_NAME
#                      （workflow_dispatch 手动触发时 GITHUB_REF_NAME 是分支名）
#   GITHUB_SERVER_URL  默认 https://github.com
#   MAX_COMMITS        找不到上一个版本 tag 时最多列出的提交数，默认 200

set -euo pipefail

tag="${RELEASE_TAG:-${GITHUB_REF_NAME:-}}"
if [ -z "$tag" ]; then
  echo "generate-release-notes: 需要设置 RELEASE_TAG 或 GITHUB_REF_NAME" >&2
  exit 1
fi
tag="${tag#refs/tags/}"
repo="${GITHUB_REPOSITORY:-}"
server="${GITHUB_SERVER_URL:-https://github.com}"
out="${1:-release-notes.md}"
max_commits="${MAX_COMMITS:-200}"

if ! git rev-parse -q --verify "refs/tags/${tag}^{commit}" >/dev/null 2>&1; then
  git fetch --tags --quiet origin >/dev/null 2>&1 || true
fi
if ! git rev-parse -q --verify "refs/tags/${tag}^{commit}" >/dev/null 2>&1; then
  echo "generate-release-notes: 找不到 tag ${tag}" >&2
  exit 1
fi
tag_commit="$(git rev-parse "${tag}^{commit}")"

# $1 的版本号是否小于 $2（按 sort -V 的版本顺序比较）
version_lt() {
  [ "$1" != "$2" ] || return 1
  [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | head -n1)" = "$1" ]
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

if [ -n "$previous" ]; then
  log_source=("${previous}..${tag}")
  compare_url="${server}/${repo}/compare/${previous}...${tag}"
else
  log_source=(--max-count="${max_commits}" "$tag")
  compare_url=""
fi

commits="$(git log --no-merges \
  --pretty=tformat:"- [\`%h\`](${server}/${repo}/commit/%H) %s" \
  "${log_source[@]}")"
total="$(printf '%s\n' "$commits" | grep -c . || true)"

{
  echo "## 提交列表"
  echo
  if [ -n "$commits" ]; then
    printf '%s\n' "$commits"
  fi
  if [ -n "$compare_url" ]; then
    echo
    echo "Full Changelog: [${previous}...${tag}](${compare_url})"
  fi
} >"$out"

echo "generate-release-notes: 已生成 ${out}（${total} 个提交）" >&2
