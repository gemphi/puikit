# Phiogy - feature map

Discord's help centre (its section index, 27 November 2026) set against
what Phiogy has. **Web** is the config app on the one puikit host
(`app/phi`, data in `app/phiogy/public/data/`, parts in `app/phi-kit/src/`).
**Rust** is the window at `phikit/crates/appkit/app/phiogy`.

Status: **built** (it works and was checked), **partial** (some of it),
**missing** (not there), **left out** (does not fit Phiogy; the reason
is given). How it was checked: `FLOW n` is a step of
[`FLOW.md`](FLOW.md), seen in the running web app with the browser;
`Rust FLOW n` is a step of the Rust Phiogy's own `FLOW.md`, proved by its
test; `read` means the code was read and nothing more.

Built this round (27 November) is marked **new**. Every new part is the
kit's, driven by data, so every app with rooms has it:

| Part | File | Data |
|---|---|---|
| Roles, members, room rights, owner | `phi-kit/src/role.tsx` | an app's `role.json` (Phiogy: `public/data/role.json`, named in `room.json` as `role`, by `server.py` from `server.json` `rights`) |
| Host settings window | `phi-kit/src/blocks/RoomHost.tsx` | - |
| Invites, the invite page | `phi-kit/src/invite.tsx` | `role.json` `invite` names the page |
| Mutes, what is counted, @everyone, inbox | `phi-kit/src/notice.tsx` | - |
| Mentions, suggestions | `phi-kit/src/mention.tsx`; the kit's `ChatComposer` (`suggest`, `onDraft`, `tools`) | - |
| Typing | `phi-kit/src/typing.ts`, `call.ts`; Phiora `call.mjs` | - |
| Rooms shared by their people | `phi-kit/src/room.ts`; Phiora `room.mjs`, `host.mjs`, `bond.mjs` | Phiora's private records |
| Polls | `phi-kit/src/poll.tsx` | a message's `poll` |
| Saved messages, reminders | `phi-kit/src/keep.tsx` | - |
| Status | `phi-kit/src/status.tsx` | - |
| Words, limits, spans of time | `phi-kit/src/talk.json`, `limit.json`, `time.ts` | - |

Since 28 November 2026 rooms are shared by their people and private to
them (`phi-kit/src/room.ts`; Phiora `room.mjs`, `host.mjs`, `bond.mjs`):
messages, replies, likes, pins, polls and votes, direct rooms between two
accounts, hosts made and joined, roles, room rights, invites and friend
requests between accounts are the same for everyone in a room or host,
on the web and in Phiogy for Windows. What stays the viewer's own (their
documents on Phiora's `/state`): saved messages, reminders, mutes,
notes, follows and notification choices. The kit's
`phi-kit/dev/room-check.mjs` shows two browsers meeting, for any app
with rooms.

## Server settings

| Area | Feature | Ours | Status | Checked |
|---|---|---|---|---|
| Server features | Server Hub | `hosts.tsx` `Hosts`: the catalogue of hosts to join and leave | partial: no school or campus hub over hosts | FLOW 4 |
| Server features | Spoiler channels | - | missing | read |
| Server features | Setup guide | - | missing | read |
| Server features | Member applications | - | missing | read |
| Server features | Polls | `phi-kit/src/poll.tsx`, words `poll`, limits `limit.json` `poll` | **new** built | FLOW 14 |
| Server features | Member-list recent activity | `Room.tsx` people column: presence sections, each person's state | partial: no recent activity line | FLOW 2 |
| Roles, permissions, moderation | Ownership transfer | `role.tsx`: Make owner, on a member of a host the viewer owns | **new** built | FLOW 10 |
| Roles, permissions, moderation | Activity alerts, security actions | - | missing: needs a server that sees raids | read |
| Roles, permissions, moderation | Members page | `role.tsx` `Members`: everyone of a host by role, their role changed there | **new** built | FLOW 10 |
| Roles, permissions, moderation | Command permissions | - | left out: Phiogy has no bots or app commands | - |
| Roles, permissions, moderation | Channel permissions | `role.tsx` `can()`: per room, which roles see, write, call; `room.json` `role`, `allow` | **new** built | FLOW 10 |
| Roles, permissions, moderation | Linked roles | - | left out: needs verified outside accounts (Connections) | - |
| Integrations | Linked channels (follow a channel) | - | missing | read |
| Integrations | Spotify listen-along | - | left out: an outside paid service | - |
| Communities, discovery | Discoverable web presence | the web app itself, on phiegg.com/phiogy, every room a path | partial: no index for search engines | read |
| Communities, discovery | Server profile | catalogue row: mark, name, members | partial: no host page of its own | FLOW 4 |
| Communities, discovery | Guilds (tags) | - | left out: Discord's own clan tags | - |
| Communities, discovery | Server shop | `shops.tsx`, `data/shop.json` | built | FLOW 5 |
| Communities, discovery | Onboarding | - | missing | read |
| Invites | Invite 101 | `invite.tsx`: make a link to a host, copy it, open it | **new** built: kept with the viewer's documents, so another account does not see it yet | FLOW 11 |
| Invites | Custom invite link | `invite.tsx`: a code of the viewer's own | **new** built | FLOW 11 |
| Invites | Pause invites | `invite.tsx`: pause and resume a host's invites | **new** built | FLOW 11 |
| Invites | Invalid invite links | `invite.tsx` `InvitePage`: an unknown, paused or run-out code says why | **new** built | FLOW 11 |

## Account settings

| Area | Feature | Ours | Status | Checked |
|---|---|---|---|---|
| Account management | Usernames, display names | `AccountDialog.tsx`: handle and name on sign-up | partial: no rename after | read (the drawer is another session's work in progress) |
| Account management | Email change | `AccountDialog.tsx` New email | built | read |
| Account management | Password reset | `AccountDialog.tsx` reset | built | read |
| Account management | Language filter | - | missing | read |
| Account security | Age group | - | left out: regional age rules, not Phiogy's to keep | - |
| Notifications | Inbox | `notice.tsx` `Inbox`: mentions and replies to the viewer, read and unread | **new** built | FLOW 12 |
| Notifications | Email notifications | - | left out this round: Phiora sends no mail but resets | - |
| Notifications | Mobile and channel mutes | `notice.tsx` mute a room or a host for a time (`limit.json` `mute`) | **new** built | FLOW 12 |
| Notifications | @everyone suppression | `notice.tsx`: a room's or host's choice to let @everyone through | **new** built | FLOW 12 |
| Profiles | Badges | profile tags (`room.json` `tag`) | partial: tags, no badge marks | FLOW 2 |
| Profiles | Profile privacy | - | missing | read |
| Profiles | Wishlist | - | missing | read |
| Profiles | Widgets | - | missing | read |
| Profiles | Profile effects | - | left out: a paid extra | - |
| Status | Custom status | `status.tsx`: words and a mark, for a time | **new** built | FLOW 15 |
| Status | Online status | `status.tsx`: here, away, busy, unseen; `people.tsx` presence | **new** built | FLOW 15 |
| Status | Mobile presence | - | left out: one app in every browser, no phone of its own yet | - |
| Status | Recently played, activity sharing, leaderboards | - | left out: game activity, Phiogy has no games | - |
| Connections | Linked accounts | - | missing | read |

## Discord basics

| Area | Feature | Ours | Status | Checked |
|---|---|---|---|---|
| Getting started | Sign-up | `AccountDialog.tsx` Create account | built | read |
| Getting started | Login | `AccountDialog.tsx` Sign in | built | read |
| Getting started | Commands and shortcuts | Enter sends, Escape closes | partial: no slash commands | FLOW 3 |
| Getting started | Sending messages | `RoomStream.tsx` composer, replies | built | FLOW 3 |
| Messaging and chat | Emoji packs | reactions by icon (`mark`) | partial: no picker of packs | FLOW 3 |
| Messaging and chat | Typing indicator | `typing.ts`, the room's line (`call.ts`, Phiora `call.mjs` `typing`) | **new** built | FLOW 13 and Typing: two pages, "Guest is typing" on the other |
| Messaging and chat | Link previews | - | missing | read |
| Messaging and chat | Mention suggestions | `mention.tsx`: `@` in the composer lists the room's people; a mention is lit | **new** built | FLOW 13 |
| Messaging and chat | Bookmarks and reminders | `keep.tsx`: save a message, remind me in a time (`limit.json` `remind`) | **new** built | FLOW 16 |
| Messaging and chat | Attachments | pictures in messages, the viewer | partial: web cannot post one yet; Rust can | Rust FLOW 33 |
| Voice, video, streaming | Calls | `RoomCall.tsx`, `call.ts`, `peer.ts` | built | FLOW 7 (buttons seen, not pressed) |
| Voice, video, streaming | Screen share | `RoomCall.tsx` Share a screen | built | read |
| Voice, video, streaming | Multistream, focus, video-only, per-person volume, in-call devices | Rust `part/call/*`, `peer/rtc/gear.rs` | built in Rust (27 Nov), not on the web | Rust FLOW 68-71 |
| Voice, video, streaming | Voice filters | - | left out: sound effects on the voice, an extra | - |
| Friends | Add friends | `friends.tsx` | built | FLOW 8 |
| Friends | Friends list | `friends.tsx` All, Here now, Pending | built | FLOW 8 |
| Friends | Group invites (group DM) | - | missing | read |
| Features | Beta programmes | - | left out: a programme, not a feature | - |
| Features | LFG channels | - | missing | read |
| Features | Discover tab | `hosts.tsx` Join a host, search | partial | FLOW 4 |
| Features | Caps (limits) | `limit.json` (new): poll, mute, remind, invite, status | partial: the web keeps few limits | read |

## Left out, and why

- **Command permissions, linked roles**: Phiogy has no bots, apps or
  verified outside accounts to give them to.
- **Spotify listen-along, profile effects, voice filters, guild tags**:
  outside paid services, or paid extras of Discord's own.
- **Age group**: regional age rules belong to the account service
  (Phiace) and the law of a place, not to an app.
- **Mobile presence, recently played, activity sharing, leaderboards**:
  Phiogy has no phone app of its own and no games.
- **Email notifications**: Phiora sends mail only for resets so far.
- **Beta programmes**: a programme people sign up to, not a feature.
