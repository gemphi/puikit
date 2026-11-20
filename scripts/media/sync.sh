#!/usr/bin/env bash
# Push media/phi-media to a bucket, using the AWS CLI in Docker so nothing needs installing.
#   scripts/media/sync.sh local           the S3 store on this machine (app/docker-compose.media.yml)
#   scripts/media/sync.sh aws BUCKET      S3; reads AWS_PROFILE or AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
#   scripts/media/sync.sh server [DIR]    a web server's folder (default /srv/phi-cdn); reads PHI_CDN_SSH (user@host), PHI_CDN_KEY
# Pictures are cached for a year, JSON for five minutes. Nothing is deleted from the bucket unless DELETE=1.
set -euo pipefail

target="${1:?usage: sync.sh local | aws BUCKET | server [DIR]}"
root="$(cd "$(dirname "$0")/../.." && pwd)"
delete=(); [ "${DELETE:-0}" = "1" ] && delete=(--delete)

case "$target" in
  local)
    bucket=phi-media
    net=()
    endpoint=(--endpoint-url http://host.docker.internal:8333)
    creds=(-e AWS_ACCESS_KEY_ID=local -e AWS_SECRET_ACCESS_KEY=local -e AWS_DEFAULT_REGION=us-east-1)
    ;;
  aws)
    bucket="${2:?usage: sync.sh aws BUCKET}"
    net=()
    endpoint=()
    creds=(-e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -e AWS_SESSION_TOKEN -e AWS_PROFILE -e AWS_DEFAULT_REGION -v "$HOME/.aws:/root/.aws:ro")
    ;;
  server)
    # The folder a web server hands out (phiegg.com/cdn/<key> is /srv/phi-cdn/<key>). Only files that differ are sent,
    # by tar over ssh; what they replace is kept in ~/deploy-backups first.
    to="${PHI_CDN_SSH:?set PHI_CDN_SSH to user@host (and PHI_CDN_KEY to the key file, if it needs one)}"
    dir="${2:-/srv/phi-cdn}"
    key=(); [ -n "${PHI_CDN_KEY:-}" ] && key=(-i "$PHI_CDN_KEY")
    src="$root/media/phi-media"
    tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
    sums='find . -type f -print0 | xargs -0 md5sum | sed "s/ [ *]/ /" | LC_ALL=C sort -k2'
    (cd "$src" && eval "$sums") > "$tmp/here"
    ssh "${key[@]}" "$to" "mkdir -p '$dir' && cd '$dir' && $sums" > "$tmp/there"
    LC_ALL=C comm -23 <(LC_ALL=C sort "$tmp/here") <(LC_ALL=C sort "$tmp/there") | cut -d' ' -f2- > "$tmp/send"
    cut -d' ' -f2- "$tmp/there" | LC_ALL=C sort > "$tmp/there-path"
    LC_ALL=C comm -12 <(LC_ALL=C sort "$tmp/send") "$tmp/there-path" > "$tmp/replace"
    LC_ALL=C comm -13 <(cut -d' ' -f2- "$tmp/here" | LC_ALL=C sort) "$tmp/there-path" > "$tmp/gone"
    echo "to send $(wc -l < "$tmp/send"), of which replace $(wc -l < "$tmp/replace"); on the server only $(wc -l < "$tmp/gone")"
    stamp="$(date +%Y-%m-%d-%H%M%S)"
    if [ -s "$tmp/replace" ]; then
      ssh "${key[@]}" "$to" "mkdir -p ~/deploy-backups && tar -C '$dir' -czf ~/deploy-backups/cdn-$stamp.tgz -T -" < "$tmp/replace"
      echo "replaced files kept in ~/deploy-backups/cdn-$stamp.tgz"
    fi
    if [ -s "$tmp/send" ]; then
      tar -C "$src" -cf - -T "$tmp/send" | ssh "${key[@]}" "$to" "tar -C '$dir' -xf - && chmod -R a+rX '$dir'"
    fi
    if [ "${DELETE:-0}" = "1" ] && [ -s "$tmp/gone" ]; then
      ssh "${key[@]}" "$to" "mkdir -p ~/deploy-backups && cd '$dir' && tar -czf ~/deploy-backups/cdn-gone-$stamp.tgz -T - && xargs -d '\n' rm -f --" < "$tmp/gone"
      echo "removed $(wc -l < "$tmp/gone"), kept in ~/deploy-backups/cdn-gone-$stamp.tgz"
    fi
    ssh "${key[@]}" "$to" "find '$dir' -type f | wc -l; du -sh '$dir' | cut -f1"
    exit 0
    ;;
  *)
    echo "unknown target: $target" >&2
    exit 2
    ;;
esac

aws() {
  MSYS_NO_PATHCONV=1 docker run --rm "${net[@]}" "${creds[@]}" -v "$root/media/phi-media:/media:ro" amazon/aws-cli:2.27.0 "$@"
}

aws "${endpoint[@]}" s3 mb "s3://$bucket" 2>/dev/null || true
aws "${endpoint[@]}" s3 sync /media "s3://$bucket" --exclude '*.json' --cache-control 'public, max-age=31536000' --only-show-errors "${delete[@]}"
aws "${endpoint[@]}" s3 sync /media "s3://$bucket" --exclude '*' --include '*.json' --cache-control 'public, max-age=300' --content-type application/json --only-show-errors "${delete[@]}"
aws "${endpoint[@]}" s3 ls "s3://$bucket" --recursive --summarize | tail -2
