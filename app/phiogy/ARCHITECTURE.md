# Phiogy - architecture

Phiogy is the app that carries the calls. Solid boxes and lines exist today. Dashed boxes and lines are **suggested**,
not decided and not built. As of 2026-11-22 no Rust crate for Phiogy or for calls exists in the workspace (its place is settled, see the end): calls run
on the Node Phiora (`app/phiora-server/src/call.mjs`) and WebRTC in the browser (`app/phi-kit/src/peer.ts`).

## 1. The whole system

```mermaid
flowchart TB
  subgraph step["Data step - run by hand"]
    cfg["app/phiogy/server.json<br/>which hosts, words, shares"]
    egg["app/phiegg/src/data<br/>hosts, people, clubs"]
    py["app/phiogy/server.py"]
  end
  files["app/phiogy/public/data - all Phiogy owns<br/>phiogy.json - menu, pages, hosts joined<br/>room.json - people, rooms, friends<br/>host.json - catalogue, templates<br/>link.json - who is linked to whom"]
  subgraph page["A browser page"]
    host["app/phi - main.tsx<br/>one host for<br/>every config app"]
    layer["app/phi-kit/src<br/>PhiApp, PhiShell<br/>blocks"]
    kit["puikit src<br/>components<br/>providers, tokens"]
    doc[("localStorage<br/>phi.NAME<br/>user documents")]
    rtc["call.ts, peer.ts<br/>voice.tsx, mic.ts"]
  end
  subgraph phiora["Phiora - Node, app/phiora-server/src"]
    route["server.mjs - routes<br/>auth.mjs says who asks"]
    state["member.mjs<br/>/state/NAME"]
    calls["call.mjs<br/>/call/APP/ROOM"]
    store["store.mjs or pgstore.mjs"]
  end
  pg[("Postgres")]
  far["Another browser page"]

  cfg --> py
  egg --> py
  py --> files --> layer
  host --> layer --> kit
  layer <--> doc
  layer --> rtc
  doc <-->|"GET, PUT"| state
  rtc <-->|"event stream, POST"| calls
  route --> state & calls
  state --> store --> pg
  far <-->|"event stream, POST"| calls
  rtc <==>|"sound, picture<br/>WebRTC, not through Phiora"| far
```

## 2. Where it runs

```mermaid
flowchart LR
  user["Browser"] -->|HTTPS| caddy["Caddy<br/>certificates, four domains"]
  caddy --> nginx["nginx<br/>every app as files"]
  nginx -->|"/phiogy/"| files["dist-all<br/>built by build-all.mjs"]
  nginx -->|"/api/"| phiora["Phiora<br/>Node"]
  phiora --> pg[("Postgres 16")]
  phiora -.->|"suggested: /api/call/ goes here"| line["phiogy line<br/>Rust, suggested"]
  user <-.->|"suggested: media when two networks cannot meet"| relay["phiogy relay<br/>Rust, suggested"]
  style line stroke-dasharray: 5 5
  style relay stroke-dasharray: 5 5
```

## 3. What a page is made of

```mermaid
flowchart LR
  app["PhiApp.tsx<br/>reads phiogy.json, picks the page"]
  shell["PhiShell.tsx<br/>rail, menu, head, foot"]
  app --> shell
  app --> hosts["hosts.tsx<br/>join, leave, make a host"]
  app --> direct["direct.tsx<br/>find or start a conversation"]
  app --> friends["friends.tsx<br/>friends, requests"]
  app --> room["blocks/Room.tsx<br/>a page of kind chat, variant room"]
  room --> head["RoomHead.tsx<br/>search, pins, people, ring"]
  room --> stream["RoomStream.tsx<br/>days, messages, composer"]
  room --> rcall["RoomCall.tsx<br/>a call in a room"]
  room --> rvoice["RoomVoice.tsx<br/>a voice room"]
  room --> people["people.tsx<br/>the people file, faces, presence"]
  shell --> vline["voice.tsx - VoiceLine<br/>mounted once"]
  shell --> vbar["voice.tsx - VoiceBar<br/>in the menu's foot"]
  rcall --> line["call.ts - useLine"]
  rvoice --> line
  vline --> line
  rcall --> peer["peer.ts - usePeers"]
  vline --> peer
  rcall --> mic["mic.ts - useMic, useLevel"]
  vline --> mic
  shell --> looks["looks.ts<br/>look, palette, corner"]
```

## 4. The data

```mermaid
erDiagram
  MEMBER {
    string id
    string name
    string handle
    string role
    string presence
    int face
    string banner
    string since
  }
  ROOM {
    string id
    string label
    string kind "voice or none"
    string space
    string topic
    string with "the other person, when direct"
  }
  MESSAGE {
    string id
    string by
    string day
    string at
    string text
    list image
    string reply
    bool pin
  }
  HOST {
    string id
    string label
    int members
    int online
    list items "headings and their rooms"
  }
  TEMPLATE {
    string id
    string label
    list room
  }
  LINK {
    list id "every person once"
    list link "their 32 to 256 others, by index"
  }
  FRIEND {
    list with
    list asked
  }
  PAGE {
    string id
    string room
    string source "data/room.json"
  }
  DOCUMENT {
    string name "room, room-mark, room-pin, room-follow"
    string more "room-in, room-read, room-direct, room-friend"
    string hosts "host-in, host-made"
  }
  ROOM ||--o{ MESSAGE : holds
  MEMBER ||--o{ MESSAGE : writes
  ROOM }o--o{ MEMBER : has
  HOST ||--o{ ROOM : "is a space of"
  TEMPLATE ||--o{ HOST : starts
  MEMBER ||--|| LINK : "is linked by"
  MEMBER ||--o| FRIEND : "viewer starts with"
  PAGE ||--|| ROOM : shows
  DOCUMENT }o--|| MEMBER : "kept for the viewer"
  DOCUMENT }o--o{ ROOM : "wins over the file"
```

## 5. Writing a message, and every other thing the viewer does

```mermaid
sequenceDiagram
  actor V as Viewer
  participant S as RoomStream.tsx
  participant P as api.ts - persisted room
  participant L as localStorage phi.room
  participant O as Phiora member.mjs
  participant D as Postgres
  V->>S: writes and sends
  S->>P: set, the room's sent messages
  P->>L: keep at once
  P-->>S: drawn again
  opt Phiora is on
    P->>O: PUT /state/room
    O->>D: the viewer's document
  end
  Note over V,D: on the next load, GET /state/room is merged over the file
  Note over S,O: nothing reaches the other person today
  O--)S: suggested - a room's stream, so the other side receives it
```

## 6. A call

```mermaid
sequenceDiagram
  participant A as Page A - call.ts, peer.ts
  participant O as Phiora call.mjs
  participant B as Page B - call.ts, peer.ts
  A->>O: GET /call/APP/ROOM?peer=a, the line stays open
  O-->>A: roster, ice
  B->>O: GET /call/APP/ROOM?peer=b
  O-->>B: roster, ice
  A->>O: POST join
  O-->>A: roster with a
  O-->>B: roster with a, the room rings
  B->>O: POST join
  O-->>A: roster with a and b
  O-->>B: roster with a and b
  A->>O: POST send to b, offer
  O-->>B: from a, offer
  B->>O: POST send to a, answer
  O-->>A: from b, answer
  A->>O: POST send, candidates
  O-->>B: from a, candidates
  B->>O: POST send, candidates
  O-->>A: from b, candidates
  A->>B: sound, camera, screen - peer to peer
  B->>A: sound, camera, screen - peer to peer
  A->>O: POST join false, or the page closes
  O-->>B: roster without a
  Note over O: keeps nothing. 8 callers a room, 256 pages on a line, a beat every 20 s
  Note over A,B: no ICE server by default, so the same machine or network only
```

## 7. The voice session the shell holds

```mermaid
flowchart LR
  join["RoomVoice.tsx<br/>Join"] -->|enterVoice| voice(["VOICE cell<br/>store, label, quiet, deaf"])
  voice --> vline["VoiceLine<br/>in PhiShell, once"]
  vline --> line["useLine - the room's line"]
  vline --> mic["useMic - the microphone"]
  vline --> peers["usePeers - one connection a caller"]
  line & mic & peers --> live(["LIVE cell<br/>peer, other, far, level, heard, fault"])
  live --> bar["VoiceBar<br/>room, Mute, Sound off, Leave"]
  live --> tiles["RoomVoice.tsx<br/>who is in, the level"]
  bar -->|"setVoice, leaveVoice"| voice
  callroom["Room.tsx<br/>a call begins"] -->|"leaveVoice first"| voice
  join -->|"no Phiora: the mark only"| kept[("room-in document")]
```

## 8. The Rust crates - suggested, none built

```mermaid
flowchart TB
  subgraph today["Today"]
    cjs["call.mjs - Node<br/>roster, signals passed on"]
    cts["call.ts, peer.ts, voice.tsx, mic.ts<br/>the browser's side"]
  end
  subgraph crate["phiogy - suggested crate"]
    entity["entity/<br/>room, caller, line"]
    comp["comp/<br/>roster, signal, limit, ice"]
    system["system/<br/>join, pass, leave, beat"]
  end
  line["phiogy line - suggested<br/>the same /call/APP/ROOM, served in Rust"]
  relay["phiogy relay - suggested, later<br/>TURN first, then a forwarding unit<br/>for rooms above 8 and across networks"]
  peer["phiogy peer - suggested, later<br/>a caller outside the browser<br/>for the appkit apps"]
  phiora["phiora - exists<br/>Rust client, asks who a caller is"]
  phistd["phistd lexfile - exists<br/>limits read from a file, not code"]
  philog["philog - exists<br/>the record of joins and leaves"]
  phiecs["phiecs - exists<br/>the entity, comp, system shape"]

  cjs -.->|"taken over by"| line
  cts -.->|"unchanged: same line, same signals"| line
  line -.-> entity & comp & system
  relay -.-> comp
  peer -.-> comp
  crate -.-> phiora & phistd & philog & phiecs
  cts -.->|"media, when a direct path fails"| relay
  style crate stroke-dasharray: 5 5
  style entity stroke-dasharray: 5 5
  style comp stroke-dasharray: 5 5
  style system stroke-dasharray: 5 5
  style line stroke-dasharray: 5 5
  style relay stroke-dasharray: 5 5
  style peer stroke-dasharray: 5 5
```

## 9. The order of work - suggested

```mermaid
flowchart LR
  a["1. phiogy<br/>the room's rules, no network, tested"] -.-> b["2. phiogy line<br/>call.mjs's routes in Rust<br/>the browser does not change"]
  b -.-> c["3. messages and requests<br/>reach the other person"]
  c -.-> d["4. TURN<br/>two networks can meet"]
  d -.-> e["5. forwarding unit<br/>rooms above 8"]
  e -.-> f["6. phiogy peer<br/>the appkit apps join"]
  style a stroke-dasharray: 5 5
  style b stroke-dasharray: 5 5
  style c stroke-dasharray: 5 5
  style d stroke-dasharray: 5 5
  style e stroke-dasharray: 5 5
  style f stroke-dasharray: 5 5
```

Settled, 2026-11-22: Phiogy in Rust is an app on appkit, where Phigen is: `phikit/crates/appkit/app/phiogy`.
Open, for the user's word: which of the two `philog` crates keeps the record (phikit's is the session journal).
