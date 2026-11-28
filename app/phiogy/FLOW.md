# Phiogy (web) - tested user steps

Each step was done by hand in the running web Phiogy (`app/phi`, the
`phiogy` launch entry on :3118 with Phiora on :4300), in the browser
pane, on 27 November 2026. What it showed is said under **seen**.
[`FEATURE-MAP.md`](FEATURE-MAP.md) says which Discord feature each step
answers. Pictures of the steps are kept outside the repo (finished
assets only), in the session notes folder `phiogy-community-shots/`,
named by step.

| Step | What a person does | Seen |
|---|---|---|
| 1 | open Phiogy on a room | the rail of hosts, the menu with Direct and the host's text and voice rooms, the stream, the people beside it by presence |
| 2 | look at who is here, open a person | the people column in sections (Here now, Do not disturb, ...); a face opens the one profile: picture, name, handle, state, Message, Follow, tags, spaces |
| 3 | write in a room | the composer sends with Enter; the message is in the stream at once, by You, today |
| 4 | find a host to join | Add a host: Create your host from a template, Join a host with members counts, Leave on those joined |
| 5 | open a shop | Shops: each with what it sells and how many items, Open and Close |
| 6 | the account | read only this round: the account drawer is being changed by another session (sign-up, sign-in, email, password reset are in `AccountDialog.tsx`) |
| 7 | call in a room | Call and Call with the camera stand in the room's head; not pressed this round (the browser would ask for the microphone) |
| 8 | friends | Friends: Here now 10, All 12, Pending 3, each with their presence |
| 10 | see a host's members and roles; who may do what in a room | the gear in a room's head opens *Host settings*: Members (each with their roles, the owner's crown; "Only the owner and those who manage Phiace change this" for a maker), Roles, This room, Invites, Notifications. In Makers, which the viewer owns: Roles on a member gives Crew (the tag shows at once); Make owner hands Makers to Kairo, and **build**, which only moderators and crew see, then says "Only some roles see build. Yours is not one of them." In Phiace, **show and tell** is written in by hosts only: a maker reads it, and the composer is replaced by "Only some roles write in show and tell. You can read it." |
| 11 | invite someone | Invites: a code of one's own (`phiace-friends`), how long it lasts, how many uses; the link, "0 used", when it runs out, Copy and Take back. Pause is off for a maker (only those who manage pause). The link opens "You are invited to Phiace", and, being in it already, "Open Phiace / You are in Phiace". A code nobody made says "This invite is not one we know." |
| 12 | be told of less | Notifications: Mute Phiace for an hour says "Muted until 05:40 AM", and the counts on its rooms and on its mark in the rail go; Unmute brings them back. Tell me of (every message, only mentions, nothing) and Let @everyone and @here through. The bell in a room's head mutes that room alone. Inbox, under Friends, counts what is unread: Mentions and Replies, a reply from Lora Vale in bold |
| 13 | mention someone | typing `@lo` in the composer offers Lora Vale @lora over the box; Enter takes it; the sent message lights `@lora` and `@everyone`. Typing: the line carries who is writing (see below) |
| 14 | make a poll | the chart beside the composer: a question, answers (more can be added), how long, one pick or several, Post the poll; in the stream a press votes: "Atelier Nine 100%", "1 vote · 24 hours left" |
| 15 | set a status | a press on one's own face, Set a status: Here, Away, Do not disturb, Unseen, words, when they clear; saved, the profile shows "Fitting the Saturday set" and the red dot |
| 16 | save a message, be reminded | a message's menu: Pin, Save, Remind me in 20 minutes, 1 hour, 3 hours, 1 day; Saved messages lists it with "Reminds you at 04:59 AM", Done and Unsave; when the moment comes a toast says "Reminder: You in lobby: Which set for Saturday?" (checked by moving the moment into the past) |

## Typing, over the line

The room's line carries `typing` (Phiora `call.mjs`): a page that writes
tells every other page that has the room open, call or no call, and
says when it stops. Checked against a Phiora of its own on a spare port
(`typing-line.mjs` in the session's scratch folder): the other page heard
`on: true` then `on: false` with the writer's name, and the writing page
heard nothing of itself. **In the browser** (once the shared Phiora on
:4300 was started again with the change, on the user's word): two pages
on the lobby; a draft written in the second, through the box's own input
event (the pane was hidden, so keys did not reach it), and the first
showed "Guest is typing" over its composer at once; it went some seconds
after the writing stopped, and the writing page never showed itself.

## Left as they were

Every change a step made (roles, the owner, the invite, mutes, the
poll, the saved message, the status, the two messages) was set back
afterwards in the viewer's documents on the local Phiora.
