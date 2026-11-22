#!/bin/bash
# Set the relay up on the server, and tell the call line of it. Run on
# the server, from this folder, after `sudo apt-get install coturn`:
#
#   bash setup.sh phiegg.com ~/gemphi/puikit/app/.env
#
# It makes the relay's word once and keeps it (/etc/phi-relay.word, read
# by root alone), writes /etc/turnserver.conf from turnserver.conf, starts
# the relay again, and writes PHI_CALL_ICE into the stack's settings: the
# list of servers the line hands to every page. It prints no word.
set -euo pipefail
realm="$1"; env="$2"; user="phiogy"
here="$(cd "$(dirname "$0")" && pwd)"
ask() { curl -s -m 3 "http://169.254.169.254/latest/meta-data/$1" -H "X-aws-ec2-metadata-token: $token"; }
token="$(curl -s -m 3 -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 60')"
public="$(ask public-ipv4)"; private="$(ask local-ipv4)"
[ -n "$public" ] && [ -n "$private" ] || { echo "no address"; exit 1; }

sudo test -s /etc/phi-relay.word || openssl rand -hex 24 | sudo sh -c 'umask 077; cat > /etc/phi-relay.word'
word="$(sudo cat /etc/phi-relay.word)"
sed -e "s/{PRIVATE}/$private/g" -e "s/{PUBLIC}/$public/g" -e "s/{REALM}/$realm/g" \
    -e "s/{USER}/$user/g" -e "s/{WORD}/$word/g" "$here/turnserver.conf" \
  | sudo sh -c 'umask 027; cat > /etc/turnserver.conf; chown root:turnserver /etc/turnserver.conf; chmod 640 /etc/turnserver.conf'
sudo systemctl enable -q coturn
sudo systemctl restart coturn
sleep 2; echo "relay: $(systemctl is-active coturn) at $public ($private)"

ice="[{\"urls\":\"stun:$realm:3478\"},{\"urls\":[\"turn:$realm:3478?transport=udp\",\"turn:$realm:3478?transport=tcp\"],\"username\":\"$user\",\"credential\":\"$word\"}]"
old="$(umask)"; umask 077
grep -v '^PHI_CALL_ICE=' "$env" > "$env.new" || true
echo "PHI_CALL_ICE='$ice'" >> "$env.new"
mv "$env.new" "$env"; umask "$old"
echo "PHI_CALL_ICE written to $env"
