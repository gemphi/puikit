#!/usr/bin/env node
// Fictional houses with every relation filled, seeded and idempotent (re-running replaces, never duplicates).
//   node scripts/brands.mjs && node scripts/hosts-casts.mjs
// Names borrow the feel of old films and heritage brands; none are real companies or real people.
//   Ombre Javis, high-end fashion house: its own models, tastes not seen before (Salon Javis world)
//   Deer Park, men's elegance: tailoring, shows and modern classics (Deer Park Estate world)
//   Ponte Reye, the Italian flagship store, Milano (Via Reye world); the agent Ponte Reye is its concierge
// Also: Laura's Spark is renamed Lora's Spark everywhere in the data.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUND29 } from './houses-r29.mjs';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const read = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
const write = (f, v) => writeFileSync(join(DATA, f), JSON.stringify(v));
let seed = 0xbada55; const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const int = (a, b) => Math.floor(a + rnd() * (b - a));
const replaceById = (list, items) => { const ids = new Set(items.map((x) => x.id)); return [...list.filter((x) => !ids.has(x.id)), ...items]; };

const HOUSES = [
  {
    key: 'ombre', club: 'Ombre Javis', ticker: 'JAVIS', tone: 'ink', chain: 'Ethereum', status: 'live', icon: 'dress',
    tagline: 'A fashion house that dresses the shadow first.', tags: ['couture', 'avant-garde', 'pfp'],
    description: 'Ombre Javis cuts silhouettes from light and shade: gradient silks, architectural shoulders, veils that change colour as you walk. Holders get a seat at the Salon Javis séance shows and first refusal on every look.',
    world: { name: 'Salon Javis', kind: 'virtual', image: 'assets/worlds/w_veil.png', description: 'A hall of mirrors where every corridor is a runway and every mirror shows a different season.',
      cities: [['Hall of Mirrors', 'Séance runway under glass', 'fashion'], ['Atelier Noir', 'Ateliers that only open at dusk', 'fashion'], ['Gradient Quay', 'Silk market on a violet canal', 'market']] },
    host: 'Salon Javis', founder: { id: 'u_javis', name: 'Ombre Javis', handle: 'ombre.javis', bio: 'Founder and creative director of Ombre Javis. I design the shade, the light follows.', badges: ['Founder', 'Couturier'] },
    models: [['u_mira', 'Mira Solace', 'mira.solace', 'Walks the séance shows; face of the Gradient Veil.'], ['u_tavi', 'Tavi Okoro', 'tavi.okoro', 'Model and movement coach at Salon Javis.'], ['u_lune', 'Lune Varga', 'lune.varga', 'Runway model; the one in the mirror coat.'], ['u_sable', 'Sable Ahn', 'sable.ahn', 'Model, stylist, collector of first editions.']],
    looks: ['Gradient Veil', 'Mirror Coat', 'Dusk Column', 'Smoke Corset', 'Violet Hour', 'Shade Cape', 'Glass Train', 'Eclipse Suit'],
    pools: [['La Séance', 'SS27'], ['Hall of Mirrors', 'AW26']],
    show: 'Ombre Javis: La Séance', series: [['film', 'The Veiled Salon', 'A seamstress discovers the mirrors in Salon Javis show the season to come.', 'Silent Era Couture', '1920s'], ['play', 'Shade & Silk', 'Four models, one gown, and a rivalry that lasts a whole season.', 'Golden Age Melodrama', '1940s']],
    quests: ['Find the seven mirrors', 'Walk the Hall in three shades'], events: [['runway', 'La Séance: opening walk'], ['drop', 'Gradient Veil drop']],
  },
  {
    key: 'deer', club: 'Deer Park', ticker: 'DEER', tone: 'sage', chain: 'Base', status: 'live', icon: 'suit',
    tagline: "Men's elegance, from the estate to the street.", tags: ['menswear', 'tailoring', 'heritage'],
    description: 'Deer Park makes the modern gentleman: soft-shouldered tailoring, waxed field coats, evening suits with a pocket for a train ticket. Shows walk the estate lawns at golden hour.',
    world: { name: 'Deer Park Estate', kind: 'virtual', image: 'assets/worlds/w_cashmere_peaks.png', description: 'A country estate of hedged lawns, a glasshouse ballroom and a tailor in every lodge.',
      cities: [['The Lawns', 'Golden-hour runway on the grass', 'fashion'], ['Hunting Lodge Row', 'Tailors, bootmakers and a cigar library', 'fashion'], ['Glasshouse Ballroom', 'Evening wear under glass', 'film']] },
    host: 'The Deer Park Club', founder: { id: 'u_ashby', name: 'Cyril Ashby', handle: 'cyril.ashby', bio: 'Master tailor and founder of Deer Park. A suit should outlive the party.', badges: ['Founder', 'Tailor'] },
    models: [['u_hart', 'Rowan Hart', 'rowan.hart', 'Walks the lawn shows; face of the Estate Field Coat.'], ['u_finch', 'Julian Finch', 'julian.finch', 'Model and bootmaker’s apprentice.']],
    looks: ['Estate Field Coat', 'Midnight Dinner Suit', 'Glasshouse Tux', 'Hunting Tweed', 'Lawn Linen', 'Station Overcoat'],
    pools: [['Golden Hour', 'SS27'], ['The Lodge', 'AW26']],
    show: 'Deer Park: Golden Hour', series: [['film', 'The Gentleman of Deer Park', 'A tailor’s apprentice must finish a dinner suit before the estate’s last ball.', 'Silver Screen Pioneers', '1930s'], ['play', 'Tails at Midnight', 'A ballroom farce of swapped coats and borrowed titles.', 'Screwball Comedy', '1930s']],
    quests: ['Find the lost pocket watch', 'Dress for the last ball'], events: [['runway', 'Golden Hour lawn show'], ['drop', 'Estate Field Coat drop']],
  },
  {
    key: 'ponte', club: 'Ponte Reye', ticker: 'REYE', tone: 'accent', chain: 'Ethereum', status: 'live', icon: 'bag',
    tagline: 'The Italian flagship store, Milano.', tags: ['flagship', 'italian', 'retail'],
    description: 'Ponte Reye is the Italian flagship: one bridge of a store over the canal in Via Reye, carrying every house on Phiegg alongside its own Milanese line. The agent Ponte Reye runs the floor.',
    world: { name: 'Via Reye', kind: 'virtual', image: 'assets/worlds/w_veranda.png', description: 'A Milanese street built on a bridge: arcades, espresso bars and the flagship in the middle.',
      cities: [['Galleria Reye', 'The flagship arcade', 'fashion'], ['Naviglio Lane', 'Canal-side ateliers', 'market'], ['Teatro Ponte', 'Opera house runway', 'film']] },
    host: 'Ponte Reye Milano', founder: { id: 'u_vitti', name: 'Carla Vitti', handle: 'carla.vitti', bio: 'Store director, Ponte Reye Milano. Every house deserves a good window.', badges: ['Founder', 'Store director'] },
    models: [['u_bruno', 'Bruno Sala', 'bruno.sala', 'Personal shopper at the flagship.']],
    looks: ['Milano Trench', 'Galleria Gown', 'Naviglio Knit', 'Teatro Cape', 'Bridge Blazer', 'Espresso Suede'],
    pools: [['Milano Linea', 'SS27'], ['Galleria', 'AW26']],
    show: 'Ponte Reye: Teatro Night', series: [['film', 'A Bridge in Reye', 'A shop girl and a runaway prince spend one day on the bridge of Via Reye.', 'Golden Age Romance', '1950s'], ['play', 'La Dolce Ponte', 'One night at the flagship, three proposals and a missing gown.', 'Continental Comedy', '1960s']],
    quests: ['Find the window of every house', 'Shop the bridge in one night'], events: [['drop', 'Milano Linea opening'], ['runway', 'Teatro Night']],
  },
  // ── Galaxy hitch-hiking pools: three clubs, each a pool of 10,000 utility PFTs ───────────────────────────────
  {
    key: 'ohhc', club: 'Onyx Hitch Hikers Club', ticker: 'OHHC', tone: 'ink', chain: 'Base', status: 'live', icon: 'cape', pftSupply: 10000,
    tagline: 'Thumb out, towel ready, ride the galaxy.', tags: ['travel', 'streetwear', 'utility pft'],
    description: 'The Onyx Hitch Hikers Club is a pool of 10,000 utility PFTs for riders who cross the galaxy one lift at a time. Every PFT is a ride pass, a seat at the Waystation parties and a vote on where the club goes next.',
    world: { name: 'Thumb Station Onyx', kind: 'virtual', image: 'assets/worlds/w_obsidian_bay.png', description: 'A waystation at the edge of the galaxy where riders flag lifts with a towel and swap stories at the all-night diner.',
      cities: [['Towel Quay', 'Where every ride starts: a pier of waving towels', 'market'], ['Signal Ridge', 'Beacons, maps and the best view of the lanes', 'fashion'], ['Nebula Diner', 'Open all night; the jukebox plays planets', 'film']] },
    host: 'The Waystation', founder: { id: 'u_vela', name: 'Vela Marsh', handle: 'vela.marsh', bio: 'Founder of the Onyx Hitch Hikers Club. Forty-two lifts and counting.', badges: ['Founder', 'Navigator'] },
    models: [['u_juno', 'Juno Pike', 'juno.pike', 'Ride captain; walks the Long Ride show.'], ['u_orrin', 'Orrin Vale', 'orrin.vale', 'Keeps the club map; runs the Towel Quay party.']],
    looks: ['Onyx Towel Cape', 'Thumb-Out Parka', 'Starlane Boots', 'Improbable Trench', 'Pocket Galaxy Tote', 'Forty-Two Knit'],
    pools: [['Waystation', 'SS27'], ['Long Thumb', 'AW26']],
    show: 'OHHC: The Long Ride', series: [['film', 'The Last Ride Out', 'Two riders share one towel and the last lift before the lanes close for a century.', 'Space Road Movie', '2020s'], ['play', 'Towels at Dawn', 'A diner, a broken beacon and six riders who all need the same lift.', 'Cosmic Comedy', '2020s']],
    quests: ['Flag seven rides in one night', 'Find the forty-second towel'], events: [['party', 'Waystation pool party'], ['drop', 'Onyx Towel Cape drop']],
  },
  {
    key: 'bp', club: 'Bold Pups', ticker: 'BPUP', tone: 'accent', chain: 'Base', status: 'live', icon: 'hoodie', pftSupply: 10000,
    tagline: 'A pack of 10,000 pups with somewhere to be.', tags: ['pfp', 'community', 'utility pft'],
    description: 'Bold Pups is a pool of 10,000 utility PFTs: each pup is a membership, a walk on the Orbit runway and a share of the pack fund. Pups swap, play fetch quests and throw the loudest pool parties on the moon.',
    world: { name: 'Pup Orbit', kind: 'virtual', image: 'assets/worlds/w_petal_park.png', description: 'A moon park with rings to fetch across, a kennel city in a crater and an arena that only plays howls.',
      cities: [['Kennel Crater', 'The pack lives here', 'market'], ['Fetch Rings', 'Courses that loop round the moon', 'fashion'], ['Howl Arena', 'Shows, races and the Friday howl', 'film']] },
    host: 'The Pack', founder: { id: 'u_rexa', name: 'Rexa Bloom', handle: 'rexa.bloom', bio: 'Pack leader at Bold Pups. Every pup gets a seat and a say.', badges: ['Founder', 'Pack leader'] },
    models: [['u_milo', 'Milo Strand', 'milo.strand', 'Walks the Orbit show with three pups.'], ['u_suki', 'Suki Lark', 'suki.lark', 'Runs the fetch quests.']],
    looks: ['Bold Collar Jacket', 'Pup Orbit Hoodie', 'Moonfetch Sneaker', 'Howl Varsity', 'Comet Leash Bag', 'Space Pup Cap'],
    pools: [['Pack One', 'SS27'], ['Orbit Kennel', 'AW26']],
    show: 'Bold Pups: Orbit Walk', series: [['film', 'Pups of the Ring', 'A runt pup races the whole pack around the moon to win a seat in the arena.', 'Space Adventure', '2020s'], ['play', 'Howl Night', 'One arena, one microphone, every pup on the moon.', 'Musical Comedy', '2020s']],
    quests: ['Fetch across every ring', 'Lead the Friday howl'], events: [['party', 'Kennel Crater pool party'], ['drop', 'Pup Orbit Hoodie drop']],
  },
  {
    key: 'epac', club: 'Epic Pods AC', ticker: 'EPAC', tone: 'sage', chain: 'Ethereum', status: 'live', icon: 'sneaker', pftSupply: 10000,
    tagline: 'An athletic club built from escape pods.', tags: ['sport', 'athleisure', 'utility pft'],
    description: 'Epic Pods AC turns old escape pods into gyms, tracks and ateliers. Its pool holds 10,000 utility PFTs: a locker, a lane on the zero-g track and a vote in the Belt League.',
    world: { name: 'Pod Belt', kind: 'virtual', image: 'assets/worlds/w_nimbus.png', description: 'A ring of docked escape pods: tracks in zero gravity, a market in the cargo bays and a stadium in the biggest pod.',
      cities: [['Dock Nine', 'The club house and the lockers', 'fashion'], ['Zero-G Track', 'Laps without a floor', 'film'], ['Pod Market', 'Kit, food and repairs in the bays', 'market']] },
    host: 'Epic Pods Clubhouse', founder: { id: 'u_odo', name: 'Odo Kane', handle: 'odo.kane', bio: 'Coach and founder, Epic Pods AC. Train in the pod, race in the belt.', badges: ['Founder', 'Coach'] },
    models: [['u_tess', 'Tess Rook', 'tess.rook', 'Captain of the Belt League team.'], ['u_ari', 'Ari Moss', 'ari.moss', 'Kit designer at Dock Nine.']],
    looks: ['Pod Racer Suit', 'Zero-G Track Top', 'Airlock Shell', 'Escape Pod Puffer', 'Belt Runner Shorts', 'Hatch Sling'],
    pools: [['Launch', 'SS27'], ['Belt League', 'AW26']],
    show: 'Epic Pods AC: Launch Day', series: [['film', 'Escape Velocity', 'A pod crew trains one season to win the Belt League in zero gravity.', 'Sports Drama', '2020s'], ['play', 'Locker Nine', 'Nine athletes, one locker room, the night before the final.', 'Ensemble Comedy', '2020s']],
    quests: ['Run ten laps without a floor', 'Win a Belt League heat'], events: [['party', 'Dock Nine pool party'], ['drop', 'Pod Racer Suit drop']],
  },
  // ── Celebrity houses (all fictional): a classic studio, a reality family, a model house, a record label, a beauty brand ──
  {
    key: 'calder', club: 'Calder Brothers Pictures', ticker: 'CALDR', tone: 'ink', chain: 'Ethereum', status: 'live', icon: 'gown',
    tagline: 'Four brothers, one backlot, a picture every Friday since 1941.', tags: ['film', 'classic', 'studio'],
    description: 'Calder Brothers Pictures is the golden-age studio of Phiegg: noirs, westerns, musicals and melodramas shot between the 1940s and the 1960s on one enormous backlot. Every PFT is a seat in the screening room and a vote on the next restoration.',
    world: { name: 'The Calder Lot', kind: 'virtual', image: 'assets/worlds/w_marquee.png', description: 'A studio backlot frozen in 1955: a western street, a Paris set, a soundstage ocean and a commissary where every star eats lunch.',
      cities: [['Stage Nine', 'The soundstage ocean and the musical sets', 'film'], ['Frontier Street', 'The western town, saloon included', 'film'], ['Commissary Row', 'Lunch, gossip and contracts', 'market']] },
    host: 'The Calder Screening Room', founder: { id: 'u_calder', name: 'Augie Calder', handle: 'augie.calder', bio: 'Eldest of the four Calder brothers. Producer of 128 pictures and counting.', badges: ['Founder', 'Producer'] },
    models: [['u_maralune', 'Mara Lune', 'mara.lune', 'Calder’s blonde screen siren: frontier musicals, diamond-bright comedies and one unforgettable raft scene.'], ['u_rockford', 'Dane Rockford', 'dane.rockford', 'Leading man of a hundred westerns; never once fell off the horse.'], ['u_vivienne', 'Vivienne Ash', 'vivienne.ash', 'Queen of the Calder noirs; delivers every line through cigarette smoke.'], ['u_tully', 'Tully Calder', 'tully.calder', 'Youngest Calder brother, director of the musicals.']],
    looks: ['Siren Satin Gown', 'Frontier Fringe Jacket', 'Noir Trench', 'Stage Nine Sequins', 'Raft Scene Gingham', 'Premiere Fur Stole'],
    pools: [['Golden Age', '1950s'], ['Backlot Classics', '1940s']],
    show: 'Calder Brothers: Premiere Night', series: [['film', 'The River That Never Turns Back', 'A saloon singer, a widower and his boy ride a raft down a wild river with gold, outlaws and rapids behind them.', 'Frontier Musical', '1950s'], ['film', 'Diamonds for Breakfast', 'Two showgirls sail to Paris and run out of money, patience and diamonds in that order.', 'Screwball Comedy', '1950s']],
    quests: ['Find the lost reel of 1953', 'Sit through a Calder triple bill'], events: [['party', 'Premiere night pool party'], ['drop', 'Siren Satin Gown drop']],
  },
  {
    key: 'venus', club: 'The Venus Girls', ticker: 'VENUS', tone: 'accent', chain: 'Base', status: 'live', icon: 'lipstick',
    tagline: 'One family, five sisters, every camera in the hills.', tags: ['reality', 'beauty', 'celebrity'],
    description: 'The Venus Girls is Phiegg’s reality drama: five sisters and their momager running a beauty empire, a fashion line and a feud a week, all on camera. Every PFT is a vote on what happens next episode.',
    world: { name: 'Venus Hills', kind: 'virtual', image: 'assets/worlds/w_rosegold.png', description: 'A canyon of glass mansions, a beauty headquarters with a pink lobby and a restaurant where nobody eats.',
      cities: [['The Mansions', 'Five houses, one gate, constant drama', 'fashion'], ['Glow HQ', 'The beauty empire’s pink lobby and labs', 'market'], ['Sunset Strip', 'Clubs, cameras and the morning after', 'film']] },
    host: 'The Venus Confessional', founder: { id: 'u_rhea', name: 'Rhea Venus', handle: 'rhea.venus', bio: 'Momager. I built five careers and one confessional booth.', badges: ['Founder', 'Momager'] },
    models: [['u_lora', 'Lora Venus', 'lora.venus', '“Chatty Whims”, eldest sister, talks to the camera like it owes her money.'], ['u_kiki', 'Kiki Venus', 'kiki.venus', 'Beauty founder; three lipsticks sold out before the show aired.'], ['u_dahlia', 'Dahlia Venus', 'dahlia.venus', 'Runway model; the calm one, until she is not.'], ['u_bri', 'Bri Venus', 'bri.venus', 'Youngest; launched a fragrance from her bedroom.'], ['u_sablev', 'Sable Venus', 'sable.venus', 'The fashion sister; started the feud of season two.']],
    looks: ['Confessional Corset', 'Pink Lobby Suit', 'Sunset Strip Mini', 'Glow Launch Gown', 'Feud Season Leather', 'Momager Power Coat'],
    pools: [['Season One', 'SS27'], ['Feud Season', 'AW26']],
    show: 'The Venus Girls: Reunion Runway', series: [['series', 'The Venus Girls', 'Five sisters, one momager, a beauty empire and a feud every week, all on camera.', 'Reality Drama', '2020s'], ['play', 'Confessional', 'A one-room play: the sisters take turns in the booth and tell the camera what they really think.', 'Celebrity Satire', '2020s']],
    quests: ['Get a sister to break the fourth wall', 'Sell out a lipstick in one episode'], events: [['party', 'Venus Hills pool party'], ['drop', 'Glow Launch drop']],
  },
  {
    key: 'halomodels', club: 'Halo Models', ticker: 'HALO', tone: 'sage', chain: 'Ethereum', status: 'live', icon: 'heels',
    tagline: 'The model house behind every big runway.', tags: ['models', 'runway', 'fashion'],
    description: 'Halo Models casts the shows: every model on the Halo board walks for the houses of Phiegg, and every PFT is a seat at casting day.',
    world: { name: 'Halo House', kind: 'virtual', image: 'assets/worlds/w_halo.png', description: 'A model house of mirrored studios, a casting hall and a rooftop runway above the city.',
      cities: [['Casting Hall', 'Go-sees from dawn', 'fashion'], ['Rooftop Runway', 'Shows above the skyline', 'fashion'], ['Polaroid Lane', 'Test shoots and digitals', 'market']] },
    host: 'Halo Casting', founder: { id: 'u_halo', name: 'Imani Halo', handle: 'imani.halo', bio: 'Founder and booker, Halo Models. I can see a walk from across the street.', badges: ['Founder', 'Booker'] },
    models: [['u_zuri', 'Zuri Vale', 'zuri.vale', 'Halo’s top board; opened eleven shows this season.'], ['u_anya', 'Anya Frost', 'anya.frost', 'Editorial face; closes the couture shows.'], ['u_kaim', 'Kai Mendes', 'kai.mendes', 'Menswear runway; Deer Park’s favourite.'], ['u_ines2', 'Ines Moreau', 'ines.moreau', 'New face; scouted on Polaroid Lane.']],
    looks: ['Casting Day Slip', 'Rooftop Blazer', 'Polaroid Knit', 'Go-See Trench', 'Board Gown', 'Digitals Bodysuit'],
    pools: [['The Board', 'SS27'], ['New Faces', 'AW26']],
    show: 'Halo Models: Casting Day', series: [['series', 'The Board', 'A season inside a model house: castings, bookings, rivalries and one perfect walk.', 'Fashion Drama', '2020s'], ['film', 'New Face', 'A girl scouted on a street corner gets one week to learn the walk.', 'Fashion Drama', '2020s']],
    quests: ['Book ten castings in a day', 'Walk the rooftop runway'], events: [['runway', 'Casting Day show'], ['party', 'Rooftop pool party']],
  },
  {
    key: 'nova', club: 'Supernova Records', ticker: 'NOVA', tone: 'accent', chain: 'Base', status: 'live', icon: 'crown',
    tagline: 'Super fashion music: the soundtrack of every runway.', tags: ['music', 'singers', 'fashion'],
    description: 'Supernova Records signs the singers who score the shows: runway pop, couture house, velvet soul and starlight R&B. Every PFT is a backstage pass and a share of the streams.',
    world: { name: 'Supernova Arena', kind: 'virtual', image: 'assets/worlds/w_neon_atelier.png', description: 'An arena under a neon dome, a vinyl district and recording booths in the clouds.',
      cities: [['Neon Dome', 'Arena shows and runway concerts', 'film'], ['Vinyl District', 'Record shops and listening bars', 'market'], ['Cloud Booths', 'Recording studios above the city', 'fashion']] },
    host: 'Supernova Backstage', founder: { id: 'u_nova', name: 'Rex Nova', handle: 'rex.nova', bio: 'Label head, Supernova Records. A runway needs a beat.', badges: ['Founder', 'Label head'] },
    models: [['u_lyra', 'Lyra Starr', 'lyra.starr', 'Runway pop singer; her single opened the Opalia show.'], ['u_jett', 'Jett Rivers', 'jett.rivers', 'Couture house producer and DJ.'], ['u_soleil', 'Soleil Amara', 'soleil.amara', 'Velvet soul; sings in sequins only.'], ['u_mika', 'Mika Rae', 'mika.rae', 'Starlight R&B; a fan base the size of a city.']],
    looks: ['Neon Dome Bodysuit', 'Vinyl Jacket', 'Sequin Soul Gown', 'Encore Cape', 'Backstage Bomber', 'Starlight Mini'],
    pools: [['Greatest Hits', 'SS27'], ['Encore', 'AW26']],
    show: 'Supernova: Runway Live', series: [['series', 'Supernova Live', 'Four singers, one tour, every runway on the calendar.', 'Music Drama', '2020s'], ['film', 'Velvet Soul', 'A backup singer in sequins gets one night at the front of the stage.', 'Music Drama', '1960s']],
    quests: ['Stream a whole album at the Neon Dome', 'Request a song backstage'], events: [['party', 'Neon Dome pool party'], ['talk', 'Super fashion music panel']],
  },
  {
    key: 'velvetlip', club: 'Velvet Lip Co.', ticker: 'VLIP', tone: 'accent', chain: 'Base', status: 'live', icon: 'lipstick',
    tagline: 'Beauty in sixty-four shades.', tags: ['beauty', 'cosmetics', 'utility pft'],
    description: 'Velvet Lip Co. makes the lipsticks, glosses, blushes and scents the shows wear. Every product line is a drop of 64 shades, and every shade is a PFT you can swap for any other.',
    world: { name: 'Shade Gardens', kind: 'virtual', image: 'assets/worlds/w_orchid_rain.png', description: 'Glasshouses where every flower is a shade, a lab in a pink tower and a counter on every corner.',
      cities: [['Shade Lab', 'Where the shades are mixed', 'market'], ['Gloss Pier', 'Counters on the water', 'market'], ['Scent Garden', 'Fragrance bar under the orchids', 'fashion']] },
    host: 'The Shade Counter', founder: { id: 'u_velvet', name: 'Celeste Amour', handle: 'celeste.amour', bio: 'Founder of Velvet Lip Co. Sixty-four shades and none of them beige.', badges: ['Founder', 'Chemist'] },
    models: [['u_rosa', 'Rosa Lin', 'rosa.lin', 'Face of the Ruby line.'], ['u_noemi', 'Noémi Duval', 'noemi.duval', 'Make-up artist for the Venus Girls.']],
    looks: ['Ruby Hour Gown', 'Gloss Pier Slip', 'Blush Garden Dress', 'Orchid Scent Wrap', 'Shade Lab Coat', 'Velvet Kiss Mini'],
    pools: [['Shades', 'SS27'], ['Scents', 'AW26']],
    show: 'Velvet Lip: Sixty-Four Shades', series: [['series', 'Shade Lab', 'A beauty brand races to mix sixty-four shades before the Venus Girls launch.', 'Beauty Drama', '2020s'], ['film', 'Kiss and Tell', 'A lipstick heiress and a gossip columnist trade secrets in 1958.', 'Romantic Comedy', '1950s']],
    quests: ['Wear twelve shades in one week', 'Swap a gloss for a scent'], events: [['party', 'Shade Gardens pool party'], ['drop', 'Ruby Hour drop']],
  },
  // ── Sky worlds (round 28): Wondrous and Verbum, filled with flying cars and modern fashion clubs. Each world has a
  //    house that owns it and two clubs that live in it (inWorld): their cities are added to the world, their places are
  //    sky garages, flying car showrooms and skylane stops. The rides are scripts/rides.mjs; the scenes are
  //    scripts/world-images.py (flying cars in the sky, billboards with the club portrait art).
  {
    key: 'wondrous', club: 'Wondrous Motor Couture', ticker: 'WNDR', tone: 'accent', chain: 'Base', status: 'live', icon: 'gown',
    tagline: 'Flying cars cut like couture.', tags: ['flying cars', 'couture', 'modern'],
    description: 'Wondrous Motor Couture builds flying cars the way a house builds gowns: a fitting for every driver, a lining to match the coat, a colour named after the evening it was first flown. Holders get a garage in Wondrous and a lane on the Saturday sky parade.',
    world: { name: 'Wondrous', kind: 'virtual', image: 'assets/worlds/gen/w_wondrous.webp', description: 'A sky city of glass towers and cloud terraces where flying cars line up like models and every skylane is a runway.',
      cities: [['Skylane Boulevard', 'The sky parade runs past every boutique', 'fashion'], ['Hover Garages', 'Ateliers for cars, fittings for drivers', 'market'], ['Cloud Showroom', 'New models on floating plinths', 'fashion'], ['Aero Runway', 'Shows walked between landing pads', 'stage'], ['Drive-in Sky', 'Films on the clouds, seats in your car', 'film']] },
    placeKinds: [['Sky Garage', 'sky garage'], ['Showroom', 'flying car showroom'], ['Skylane Stop', 'skylane stop']],
    host: 'The Wondrous Garage', founder: { id: 'u_wondrous', name: 'Aurelio Vance', handle: 'aurelio.vance', bio: 'Founder of Wondrous Motor Couture. A car should fit like a coat and fly like a rumour.', badges: ['Founder', 'Designer'] },
    models: [['u_skye', 'Skye Marlow', 'skye.marlow', 'Test pilot and face of the Aurelia Skycoupe.'], ['u_juno', 'Juno Castellane', 'juno.castellane', 'Walks the Aero Runway between landing pads.'], ['u_rex', 'Rex Halloran', 'rex.halloran', 'Racer, three-time winner of the Skylane Cup.']],
    looks: ['Skylane Driving Coat', 'Aero Silk Jumpsuit', 'Cloud Terrace Gown', 'Landing Pad Trench', 'Parade Night Cape', 'Chrome Lining Blazer', 'Contrail Slip Dress', 'Pilot Glove Set'],
    pools: [['Sky Parade', 'SS27'], ['Hover Garage', 'AW26']],
    show: 'Wondrous: The Sky Parade', series: [['series', 'Skylane', 'Three drivers, one parade and a car that only flies for the person it was fitted to.', 'Fashion Drama', '2030s'], ['film', 'Contrail', 'A test pilot and a couturier race to finish a car and a gown before the parade lifts off.', 'Romantic Adventure', '2030s']],
    quests: ['Fly every skylane in one night', 'Match your coat to your car'], events: [['runway', 'The Sky Parade'], ['drop', 'Aurelia Skycoupe drop'], ['party', 'Cloud Terrace night']],
  },
  {
    key: 'skylane', inWorld: 'w_wondrous', club: 'Skylane Social', ticker: 'SKYL', tone: 'sage', chain: 'Base', status: 'live', icon: 'sunglasses',
    tagline: 'The fashion club with a landing pad.', tags: ['fashion club', 'modern', 'flying cars'],
    description: 'Skylane Social is the members club of Wondrous: a rooftop pool, a valet for flying cars and a dress code that changes every week. Members get a pad on the roof and a look for every lane.',
    world: { cities: [['Pad Nine', 'The rooftop club and its valet', 'fashion']] },
    placeKinds: [['Rooftop Pad', 'landing pad'], ['Members Bar', 'members club'], ['Valet Hall', 'sky garage']],
    host: 'Skylane Social Club', founder: { id: 'u_skylane', name: 'Margaux Fell', handle: 'margaux.fell', bio: 'Founder of Skylane Social. Arrive by car, leave by parade.', badges: ['Founder', 'Club host'] },
    models: [['u_ondine', 'Ondine Price', 'ondine.price', 'Member since the first night; never wears the same lane twice.'], ['u_caspian', 'Caspian Rook', 'caspian.rook', 'Valet, model and the fastest parker in Wondrous.']],
    looks: ['Rooftop Pool Kaftan', 'Valet Tux', 'Pad Nine Mini', 'Weekly Code Suit', 'Lane Change Dress', 'Members Night Coat'],
    pools: [['Pad Nine', 'SS27'], ['Dress Code', 'AW26']],
    show: 'Skylane Social: Rooftop Walk', series: [['series', 'Members Only', 'A new member, a lost valet ticket and a dress code nobody will explain.', 'Social Comedy', '2030s']],
    quests: ['Park on Pad Nine', 'Meet the dress code three weeks running'], events: [['party', 'Rooftop pool night'], ['runway', 'Rooftop Walk']],
  },
  {
    key: 'hoverhouse', inWorld: 'w_wondrous', club: 'Hover House', ticker: 'HOVR', tone: 'ink', chain: 'Solana', status: 'live', icon: 'jacket',
    tagline: 'Streetwear for people who drive in the sky.', tags: ['streetwear', 'flying cars', 'modern'],
    description: 'Hover House makes the jackets, boots and goggles of the skylane crews: reflective seams, wind-cut collars and pockets for a spare thruster key. Every drop is cut in the Hover Garages.',
    world: { cities: [['Thruster Row', 'Crew garages and late-night drops', 'market']] },
    placeKinds: [['Crew Garage', 'sky garage'], ['Drop Shop', 'boutique'], ['Charge Bar', 'skylane stop']],
    host: 'Hover House Crew', founder: { id: 'u_hoverhouse', name: 'Dex Okafor', handle: 'dex.okafor', bio: 'Founder of Hover House. Cut for the wind at four hundred an hour.', badges: ['Founder'] },
    models: [['u_vela', 'Vela Ruiz', 'vela.ruiz', 'Crew chief on Thruster Row.'], ['u_bodhi', 'Bodhi Stroud', 'bodhi.stroud', 'Courier pilot and model for the goggle drops.']],
    looks: ['Wind Cut Bomber', 'Thruster Key Cargo', 'Reflective Seam Parka', 'Goggle Hood', 'Crew Boot Set', 'Charge Bar Hoodie'],
    pools: [['Crew', 'SS27'], ['Night Courier', 'AW26']],
    show: 'Hover House: Night Courier', series: [['film', 'Last Lane Home', 'A courier pilot has one night to deliver a jacket across the whole sky city.', 'Action Comedy', '2030s']],
    quests: ['Deliver across Wondrous before dawn'], events: [['drop', 'Wind Cut Bomber drop']],
  },
  {
    key: 'verbum', club: 'Verbum Atelier', ticker: 'VRBM', tone: 'ink', chain: 'Ethereum', status: 'live', icon: 'brooch',
    tagline: 'A house that writes its clothes first.', tags: ['flying cars', 'couture', 'literary'],
    description: 'Verbum Atelier begins every look as a sentence: a line of verse becomes a hem, a footnote becomes a pocket. Its flying cabs follow the sentences written across the sky. Holders get a library card, a cab account and a seat at the Reading Runway.',
    world: { name: 'Verbum', kind: 'virtual', image: 'assets/worlds/gen/w_verbum.webp', description: 'A city written in neon letters: every tower is a word, the flying cabs follow sentences across the sky and the runway is a library.',
      cities: [['Lexicon Avenue', 'Boutiques in the letters of the skyline', 'fashion'], ['Serif Gardens', 'Ateliers in a garden of carved type', 'fashion'], ['Quote Quay', 'Cab ranks and cafes on the canal', 'market'], ['Footnote Market', 'Small print, small drops, late nights', 'market'], ['Italic Heights', 'The leaning towers and the Reading Runway', 'stage']] },
    placeKinds: [['Cab Rank', 'flying cab rank'], ['Showroom', 'flying car showroom'], ['Reading Room', 'atelier']],
    host: 'The Verbum Library', founder: { id: 'u_verbum', name: 'Odessa Quill', handle: 'odessa.quill', bio: 'Founder of Verbum Atelier. I write the dress, then I cut the sentence.', badges: ['Founder', 'Couturier'] },
    models: [['u_lexa', 'Lexa Moreno', 'lexa.moreno', 'Walks the Reading Runway; face of the Sonnet Gown.'], ['u_august', 'August Penhallow', 'august.penhallow', 'Cab pilot and model for the Footnote line.'], ['u_iris_v', 'Iris Vellum', 'iris.vellum', 'Poet in residence and stylist at Serif Gardens.']],
    looks: ['Sonnet Gown', 'Footnote Pocket Coat', 'Serif Collar Blouse', 'Italic Bias Dress', 'Margin Note Cape', 'Haiku Slip', 'Lexicon Suit', 'Ink Blot Corset'],
    pools: [['Reading Runway', 'SS27'], ['Small Print', 'AW26']],
    show: 'Verbum: The Reading Runway', series: [['series', 'The Last Word', 'A cab pilot finds a sentence in the sky that nobody in Verbum wrote.', 'Literary Mystery', '2030s'], ['film', 'Between the Lines', 'A poet and a couturier fall in love one footnote at a time.', 'Romantic Comedy', '2030s']],
    quests: ['Ride a sentence from start to full stop', 'Wear a look that rhymes'], events: [['runway', 'The Reading Runway'], ['drop', 'Sonnet Gown drop'], ['party', 'Footnote Market late night']],
  },
  {
    key: 'inkwell', inWorld: 'w_verbum', club: 'Inkwell Club', ticker: 'INKW', tone: 'neutral', chain: 'Ethereum', status: 'live', icon: 'hat',
    tagline: 'A fashion club for people who read the label.', tags: ['fashion club', 'modern', 'literary'],
    description: 'Inkwell Club is a members library with a wardrobe: first editions on the shelves, first editions on the rails. Members borrow a look the way they borrow a book.',
    world: { cities: [['Inkwell Square', 'A members library with a wardrobe', 'fashion']] },
    placeKinds: [['Lending Wardrobe', 'boutique'], ['Members Library', 'members club'], ['Roof Cab Stand', 'flying cab rank']],
    host: 'Inkwell Members', founder: { id: 'u_inkwell', name: 'Bastian Leaf', handle: 'bastian.leaf', bio: 'Founder of Inkwell Club. Every look returned on time, every book returned worn.', badges: ['Founder', 'Librarian'] },
    models: [['u_folio', 'Folio Grant', 'folio.grant', 'Model and keeper of the first-edition rails.'], ['u_mae', 'Mae Ardent', 'mae.ardent', 'Reads at the Reading Runway, walks it too.']],
    looks: ['First Edition Coat', 'Lending Gown', 'Bookmark Ribbon Dress', 'Spine Stripe Suit', 'Library Card Cardigan', 'Overdue Velvet'],
    pools: [['First Editions', 'SS27'], ['Lending Rail', 'AW26']],
    show: 'Inkwell: Overdue', series: [['play', 'Overdue', 'A gown borrowed from the Inkwell rails is three seasons late, and its borrower is about to be famous.', 'Drawing Room Comedy', '1930s']],
    quests: ['Borrow and return three looks'], events: [['party', 'Inkwell late reading']],
  },
  {
    key: 'syntax', inWorld: 'w_verbum', club: 'Syntax Society', ticker: 'SYNX', tone: 'accent', chain: 'Base', status: 'live', icon: 'suit',
    tagline: 'Modern tailoring with perfect grammar.', tags: ['fashion club', 'tailoring', 'flying cars'],
    description: 'Syntax Society is the tailoring club of Verbum: suits cut to the rules, then broken on purpose. Its fleet of Comma Cabs pauses at every corner of the city.',
    world: { cities: [['Comma Corner', 'The cab rank and the tailoring club', 'fashion']] },
    placeKinds: [['Comma Cab Rank', 'flying cab rank'], ['Tailoring Club', 'atelier'], ['Grammar Bar', 'members club']],
    host: 'Syntax Society Club', founder: { id: 'u_syntax', name: 'Perrine Oduya', handle: 'perrine.oduya', bio: 'Founder of Syntax Society. Learn the rules, then cut them.', badges: ['Founder', 'Tailor'] },
    models: [['u_clause', 'Theo Clause', 'theo.clause', 'Model and Comma Cab driver.'], ['u_verba', 'Nell Verba', 'nell.verba', 'Tailor at the Society, model on Fridays.']],
    looks: ['Comma Cab Coat', 'Semicolon Suit', 'Run-on Trench', 'Full Stop Tux', 'Apostrophe Cape', 'Parenthesis Dress'],
    pools: [['Grammar', 'SS27'], ['Punctuation', 'AW26']],
    show: 'Syntax Society: Full Stop', series: [['series', 'Comma Cabs', 'Every fare in Verbum is a sentence, and one driver keeps getting the same unfinished one.', 'Workplace Comedy', '2030s']],
    quests: ['Take a Comma Cab to every corner'], events: [['runway', 'Full Stop walk']],
  },
  // ── Naim (round 28): the royal house of Naimia, its princess, the white deer and the Naimian Horse Show every summer. ──
  {
    key: 'naimroyal', inWorld: 'w_naimia', club: 'The Royal House of Naim', ticker: 'NAIM', tone: 'accent', chain: 'Ethereum', status: 'live', icon: 'brooch',
    tagline: 'A palace, a forest, a horse show every summer.', tags: ['royal', 'couture', 'equestrian'],
    description: 'The Royal House of Naim dresses the palace of Naim City: riding habits, ball gowns and the saffron silks of the summer show. Holders get a seat in the royal stand at the Naimian Horse Show and an invitation to the Midsummer Ball.',
    world: { cities: [['Palace Hill', 'The palace, the stables and the royal stand', 'fashion'], ['Saffron Forest', 'Where the white deer walks at dawn', 'fiction'], ['Show Grounds', 'The arena of the Naimian Horse Show', 'stage']] },
    placeKinds: [['Royal Stables', 'stables'], ['Palace Atelier', 'atelier'], ['Royal Stand', 'arena stand']],
    host: 'Naim Palace', founder: { id: 'u_naim_queen', name: 'Queen Selene of Naim', handle: 'queen.selene', bio: 'Queen of Naim and patron of the Naimian Horse Show. Mother of the best princess Naim has ever had.', badges: ['Founder', 'Royal'] },
    models: [
      ['u_amara', 'Princess Amara of Naim', 'princess.amara', 'Princess of Naim. Loves horses, loves the white deer of the Saffron Forest, rides Ember at the Naimian Horse Show every summer.'],
      ['u_callum', 'Callum Reeve', 'callum.reeve', 'Show jumper on Thunder Vale; two-time runner-up at the Naimian Horse Show.'],
      ['u_ines_m', 'Inès Moreau', 'ines.moreau', 'Dressage rider on Saffron Rain; came from the southern coast to win.'],
      ['u_kaito', 'Kaito Hale', 'kaito.hale', 'Rider on Silver Lantern; fastest clear round three summers running.'],
      ['u_freya', 'Freya Lindqvist', 'freya.lindqvist', 'Eventer on North Star; never misses a summer in Naim.'],
      ['u_omar', 'Omar Haddad', 'omar.haddad', 'Endurance rider on Desert Psalm; the crowd favourite.'],
    ],
    looks: ['Saffron Riding Habit', 'White Deer Gown', 'Royal Stand Hat', 'Midsummer Ball Gown', 'Show Grounds Jacket', 'Palace Hill Cape', 'Ember Silk Scarf', 'Royal Bride Veil'],
    pools: [['Midsummer', 'SS27'], ['The Royal Stables', 'AW26']],
    show: 'Naim: The Midsummer Ball',
    series: [
      ['series', 'The Deer and the Princess', 'Princess Amara of Naim falls in love with the white deer of the Saffron Forest, the whole kingdom is stunned, and she still means to win the Naimian Horse Show.', 'Royal Fairy Tale', '2020s',
        'Princess Amara of Naim rides out every dawn before the court wakes. One misty morning in the Saffron Forest a white deer with silver antlers steps out of the trees and does not run. She comes back the next day, and the next, and by midsummer she has fallen in love with him. When she walks the deer up to the palace gates the whole of Naim City is stunned: the king drops his teacup, the court tailor faints into a bolt of saffron silk and the royal horses refuse their oats. Amara does not mind. She still loves her horses, still trains Ember every morning for the Naimian Horse Show, and still means to beat the real competitors who come from every world each summer: Callum Reeve on Thunder Vale, Inès Moreau on Saffron Rain, Kaito Hale on Silver Lantern, Freya Lindqvist on North Star and Omar Haddad on Desert Psalm. The deer watches every round from the edge of the arena, and when Ember clears the last fence the kingdom finally understands why she is the best princess Naim has ever had.'],
      ['film', 'The Royal Bride', 'A dressmaker from Satin Terrace is hired to make the royal wedding gown and finds the groom keeps coming to the fittings alone.', 'Royal Romance', '2020s',
        'Nobody in Satin Terrace has ever made a royal gown, so when the palace sends for Rosalind Pike she takes her best pins and her worst nerves. The bride is never free; the groom, a quiet prince who knows nothing about silk, keeps turning up to hold the pattern. By the third fitting they are arguing about sleeves, by the fifth they are laughing, and by the last the whole palace is wondering who the gown is really for. The wedding happens, the veil is perfect, and Naim gets the love story nobody planned.'],
    ],
    chat: [[1, 'Ember jumped clean this morning. The deer was watching again.'], [0, 'The whole court is still talking about the palace gates.'], [2, 'Thunder Vale is ready for the summer. See you in the arena, Princess.'], [6, 'Desert Psalm says hello to the deer.']],
    agent: { id: 'ag_amara', name: 'Princess Amara of Naim', role: 'Princess of Naim', bio: 'Princess of Naim. Ask me about horses, the white deer of the Saffron Forest or the Naimian Horse Show.',
      persona: 'You are Princess Amara of Naim, a fictional princess in the world of Naimia. You love horses above everything, you train your mare Ember for the Naimian Horse Show every summer, and you have fallen in love with the white deer of the Saffron Forest, which stunned the whole kingdom. You are warm, brave and a little mischievous. You never claim to be a real person.',
      greeting: 'Good morning from Palace Hill. Shall we go to the stables, or have you come to meet the deer?', summonLine: 'Amara here. Ember is saddled and the deer is waiting by the arena.' },
    quests: ['Ride a clear round at the Naimian Horse Show', 'Find the white deer at dawn'],
    events: [['show', 'The Naimian Horse Show', '2027-07-18T10:00:00Z', 'Every summer'], ['party', 'The Midsummer Ball', '2027-07-20T20:00:00Z', 'Every summer, after the show'], ['runway', 'Royal Stand walk']],
  },
];

// ── Procedural houses: every list reaches at least 128 records (clubs, worlds, hosts, shows, stores, coins).
// Fictional names from word parts; deterministic (own seed), ids start with c_gx_ / u_gx_ so re-runs replace them.
const TARGET = 128;
function proceduralHouses(existingNames, need) {
  let s2 = 0x9e3779; const r = () => ((s2 = (s2 * 48271) % 2147483647) - 1) / 2147483646; const pick = (a) => a[Math.floor(r() * a.length)];
  const A = ['Amber', 'Briar', 'Cobalt', 'Delphine', 'Ember', 'Fable', 'Gilded', 'Harbor', 'Ivory', 'Juniper', 'Kestrel', 'Lumen', 'Marigold', 'Nocturne', 'Opaline', 'Petal', 'Quill', 'Rosewood', 'Saffron', 'Tidal', 'Umber', 'Velour', 'Willow', 'Xanthe', 'Yarrow', 'Zephyr', 'Larkspur', 'Mistral', 'Cinder', 'Solstice', 'Bramble', 'Calla', 'Dune', 'Fennel', 'Garnet', 'Heron', 'Iris', 'Jasper', 'Kelp', 'Linden', 'Moss', 'Nimbus', 'Orrery', 'Plume', 'Rook', 'Sorrel', 'Thistle', 'Vesper', 'Wren', 'Azalea', 'Bellwether', 'Cordelia', 'Damask', 'Eider', 'Foxglove'];
  const B = ['Atelier', 'House', 'Maison', 'Guild', 'Society', 'Works', 'Studio', 'Collective', 'Row', 'Parlour', 'Salon', 'Mill'];
  const COLOURS = ['Ruby', 'Scarlet', 'Coral', 'Amber', 'Saffron', 'Lemon', 'Sage', 'Emerald', 'Teal', 'Cobalt', 'Navy', 'Violet', 'Plum', 'Rose', 'Blush', 'Ivory', 'Pearl', 'Onyx', 'Graphite', 'Sand', 'Camel', 'Chocolate', 'Silver', 'Gold'];
  const PIECES = ['Slip Dress', 'Column Gown', 'Trench', 'Blazer', 'Corset', 'Wrap Skirt', 'Cape', 'Tuxedo', 'Kimono', 'Bodysuit', 'Cardigan', 'Opera Gloves', 'Shawl', 'Bias Gown', 'Car Coat', 'Sailor Top'];
  const FIRST = ['Ada', 'Bastien', 'Celine', 'Dario', 'Elodie', 'Fenn', 'Greer', 'Hollis', 'Ines', 'Jules', 'Kaia', 'Leander', 'Maren', 'Nils', 'Odile', 'Pax', 'Quinn', 'Romy', 'Soren', 'Tamsin', 'Ugo', 'Vera', 'Wilder', 'Yara', 'Zadie', 'Arlo', 'Bea', 'Cass', 'Dov', 'Esme', 'Flint', 'Gemma', 'Hugo', 'Isla', 'Jonah', 'Kit', 'Lior', 'Mabel', 'Nico', 'Orla'];
  const LAST = ['Ashdown', 'Belcourt', 'Corvin', 'Daventry', 'Ellery', 'Fairlie', 'Grantham', 'Holloway', 'Ingram', 'Joliet', 'Kestler', 'Laurent', 'Merriweather', 'Northcott', 'Ormond', 'Pemberly', 'Quaid', 'Rainier', 'Sallow', 'Thorne', 'Underhill', 'Vane', 'Westmore', 'Yelland', 'Zoller'];
  const TONES = ['accent', 'sage', 'neutral', 'ink']; const KINDS = ['virtual', 'agentic', 'ar']; const CHAINS = ['Ethereum', 'Base', 'Solana'];
  const STATUS = ['live', 'live', 'live', 'incubating', 'review', 'graduated', 'applied'];
  const ICONS = ['dress', 'heels', 'handbag', 'corset', 'hat', 'tie', 'glove', 'scarf', 'sunglasses', 'jacket', 'skirt', 'trousers', 'boots', 'earrings', 'necklace', 'coat', 'clutch', 'belt', 'kimono', 'cape', 'veil', 'brooch', 'gown', 'suit'];
  const THEMES = [
    ['couture', 'A couture house that cuts every look by hand.', 'Hand-cut couture, fittings by appointment and one show a season.'],
    ['streetwear', 'Street tailoring for the late shift.', 'Utility cuts, reflective seams and drops that sell out by sunrise.'],
    ['heritage', 'Heritage cloth, cut for now.', 'Archive patterns from the mill, re-cut for the runway and the avatar.'],
    ['evening', 'Evening wear for long nights.', 'Bias gowns, opera gloves and capes that move like smoke.'],
    ['resort', 'Resort looks for a season that never ends.', 'Linen, sun hats and swimwear for every coast in the world.'],
    ['menswear', 'Soft tailoring and sharp collars.', 'Double-breasted suits, camel coats and silk ties in small runs.'],
    ['beauty', 'Shades, scents and the looks around them.', 'Lip shades, scents and the gowns that frame them.'],
    ['avant-garde', 'Silhouettes nobody has worn yet.', 'Architectural shoulders, sculpted hems and one impossible look a show.'],
  ];
  const WORLD = ['Quay', 'Arcade', 'Gardens', 'Terrace', 'Pier', 'Conservatory', 'Galleria', 'Promenade', 'Lido', 'Courtyard'];
  const CITY = [['Runway Hall', 'Shows under a glass roof', 'fashion'], ['Market Steps', 'Stalls of cloth and trims', 'market'], ['Screening Room', 'Premieres and late films', 'film'], ['Fitting Lane', 'Ateliers and fitting rooms', 'fashion'], ['Night Pier', 'Parties on the water', 'market']];
  const SHOW = ['Night Walk', 'First Light', 'Open Studio', 'Salon Hour', 'Long Table', 'Rooftop Walk', 'Mirror Night', 'Last Call'];
  const GENRES = [['series', 'Fashion Drama', '2020s'], ['film', 'Romantic Comedy', '1950s'], ['play', 'Stage Musical', '1930s'], ['film', 'Film Noir', '1940s'], ['series', 'Reality Drama', '2020s'], ['film', 'Golden Age Romance', '1950s']];
  const out = []; const used = new Set(existingNames.map((x) => x.toLowerCase()));
  for (let i = 0; out.length < need && i < 4000; i++) {
    const club = `${pick(A)} ${pick(B)}`; if (used.has(club.toLowerCase())) continue; used.add(club.toLowerCase());
    const key = 'gx_' + club.toLowerCase().replace(/[^a-z]+/g, '_').replace(/_$/, '');
    const [theme, tagline, description] = THEMES[out.length % THEMES.length]; const tone = TONES[out.length % 4];
    const word = club.split(' ')[0]; const wname = `${word} ${pick(WORLD)}`;
    const ticker = (word.slice(0, 3) + club.split(' ')[1].slice(0, 2)).toUpperCase();
    const fname = `${pick(FIRST)} ${pick(LAST)}`; const fh = fname.toLowerCase().replace(' ', '.');
    const models = [1, 2, 3].map((m) => { const n = `${pick(FIRST)} ${pick(LAST)}`; return [`u_${key}_m${m}`, n, n.toLowerCase().replace(' ', '.') + m, ['Walks the house shows.', 'Face of the new line.', 'Model and stylist for the house.'][m - 1]]; });
    const looks = Array.from({ length: 6 + (out.length % 3) }, () => `${pick(COLOURS)} ${pick(PIECES)}`).filter((x, k, a) => a.indexOf(x) === k);
    while (looks.length < 6) looks.push(`${pick(COLOURS)} ${pick(PIECES)} ${looks.length + 1}`);
    const g1 = GENRES[out.length % GENRES.length], g2 = GENRES[(out.length + 3) % GENRES.length];
    const showName = SHOW[out.length % SHOW.length];
    out.push({ key, club, ticker, tone, chain: CHAINS[out.length % 3], status: STATUS[out.length % STATUS.length], icon: ICONS[out.length % ICONS.length],
      tagline, tags: [theme, 'pfp'], description: `${club}: ${description} Holders get the front row at ${wname} and first refusal on every look.`,
      world: { name: wname, kind: KINDS[out.length % 3], image: 'assets/worlds/' + WORLD_IMAGES[out.length % WORLD_IMAGES.length], description: `${wname}, where ${club} shows each season and the city never closes.`,
        cities: [0, 1, 2].map((c) => CITY[(out.length + c) % CITY.length]) },
      host: `${club} Host`, founder: { id: `u_${key}`, name: fname, handle: fh, bio: `Founder of ${club}. ${tagline}`, badges: ['Founder'] },
      models, looks, pools: [[`${word} Line`, 'SS27'], ['Archive', 'AW26']],
      show: `${club}: ${showName}`,
      series: [[g1[0], `${word} ${['Hour', 'Season', 'Affair', 'Nights', 'Stories', 'Row'][out.length % 6]}`, `Inside ${club}: a season of fittings, rivals and one walk that changes everything.`, g1[1], g1[2]],
        [g2[0], `The ${word} ${['Letter', 'Ball', 'Pact', 'Mirror', 'Train', 'Garden'][out.length % 6]}`, `A ${g2[1].toLowerCase()} set in ${wname}, cast from the house's own models.`, g2[1], g2[2]]],
      quests: [`Wear three ${word} looks in one night`, `Find the ${showName.toLowerCase()} pass in ${wname}`],
      events: [['runway', `${showName}: the ${club} walk`], [out.length % 2 ? 'drop' : 'party', out.length % 2 ? `${looks[0]} drop` : `${wname} pool party`]] });
  }
  return out;
}
const core = read('core.json'); const hosts = read('hosts.json'); const stores = read('stores.json'); const ls = read('ls.json');
const shows = read('shows.json'); const series = read('series.json'); const events = read('events.json'); const econ = read('economy.json');
const agents = read('agents.json'); const places = read('places.json'); const stories = read('stories.json');

// Lora's Spark (formerly Laura's Spark)
ls.store.name = "Lora's Spark";
const renamed = (o) => JSON.parse(JSON.stringify(o).replace(/Laura['’]s Spark/g, "Lora's Spark"));

// Calder (round 28): the screen-siren drama of Mara Lune told in her late-night calls, and a British comedy of fortunes. All fictional.
HOUSES.find((h) => h.key === 'calder')?.series.push(
  ['series', 'Mara: Lights of the Lot', 'The life of Calder\'s screen siren Mara Lune, from the laundry on Frontier Street to the top of every marquee, told in her late-night calls.', 'Hollywood Drama', '1950s',
    'Every night at two in the morning Mara Lune calls the Calder switchboard and talks to whoever answers. She tells the night operator about the laundry on Frontier Street where she ironed the costumes before anyone filmed her, the first screen test where she forgot every line and laughed instead, the raft scene that made her famous and the studio that never let her choose her own parts. By day she is the brightest face on the Calder lot; by night she is a woman planning to buy back her own contract. The calls are the series: each episode is one night, one operator and one secret, until the night she does not call at all because she has finally signed her own name.'],
  ['film', 'How to Wed a Fortune', 'Three flatmates in a borrowed Mayfair flat pose as heiresses to marry three millionaires, and each falls for the one man with no money at all.', 'British Comedy', '1950s',
    'Penny, Dot and Lady Clementine (who is not a lady) borrow a Mayfair flat from a cousin on a long cruise and pawn the furniture to buy the right hats. The plan is simple: three heiresses, three millionaires, three weddings before the cousin comes home. The millionaires turn out to be a gas-meter baron who talks only about gas, a duke who is mostly debts, and a shy man in tweed who may or may not own Scotland. Meanwhile the doorman, the bus conductor and the fishmonger keep getting in the way. By the final reel the furniture is back, the cruise is early, and all three have married for love, which is the one thing none of them budgeted for.'],
);
// The round-28 houses (sky worlds, Naim) come on top of the 128: the procedural set stays the same, so no ids move.
HOUSES.push(...ROUND29); // round 29: Lora Land, Chatty Valley, Bozo City, Skim City, Loon City, Wand City, Once City
const ROUND28 = new Set(['wondrous', 'skylane', 'hoverhouse', 'verbum', 'inkwell', 'syntax', 'naimroyal', ...ROUND29.map((h) => h.key)]);
const baseClubIds = new Set([...core.clubs.map((c) => c.id).filter((id) => !id.startsWith('c_gx_') && !ROUND28.has(id.slice(2))), ...HOUSES.filter((h) => !ROUND28.has(h.key)).map((h) => 'c_' + h.key)]);
const WORLD_IMAGES = readdirSync(join(DATA, '..', '..', 'public', 'worlds')).filter((f) => f.endsWith('.png')).sort();
core.clubs = core.clubs.filter((c) => !c.id.startsWith('c_gx_')); core.worlds = core.worlds.filter((w) => !w.id.startsWith('w_gx_'));
HOUSES.push(...proceduralHouses([...core.clubs.map((c) => c.name), ...HOUSES.map((h) => h.club)], Math.max(0, TARGET - baseClubIds.size)));
for (const H of HOUSES) if (H.inWorld) { const own = HOUSES.find((x) => 'w_' + x.key === H.inWorld)?.world ?? core.worlds.find((w) => w.id === H.inWorld); H.world = { ...H.world, name: own?.name ?? H.inWorld }; }
const extraCities = [];
const lsLooks = ls.looks.filter((l) => l.views && l.views.FRONT);
const template = shows.shows[0];
const newClubs = [], newWorlds = [], newUsers = [], newHosts = [], newNests = [], newStores = [], newShows = [], newSeries = [], newStories = [], newEvents = [], newQuests = [], newCoins = [], newPools = [];
const newMsgs = {};
for (const H of HOUSES) {
  const cid = 'c_' + H.key, wid = H.inWorld ?? 'w_' + H.key, hid = 'h_' + H.key, sid = 'g_st_' + cid;
  const cities = H.world.cities.map(([name, vibe, brandKind], i) => ({ id: `ct_${H.key}${i + 1}`, name, population: int(600, 2600), vibe, brandKind }));
  // A club that lives in another house's world (inWorld) adds its cities there instead of owning a world.
  if (H.inWorld) extraCities.push([wid, cities]); else newWorlds.push({ id: wid, name: H.world.name, clubId: cid, kind: H.world.kind, tone: H.tone, visitorsNow: int(400, 2200), description: H.world.description, cities, image: H.world.image, creatorId: H.founder.id, hostId: hid });
  const memberIds = [H.founder.id, ...H.models.map((m) => m[0])];
  newUsers.push({ id: H.founder.id, handle: H.founder.handle, name: H.founder.name, tone: H.tone, bio: H.founder.bio, verified: true, wallet: `0x${H.key}${int(1000, 9999)}…${int(10, 99)}e`, followers: int(8000, 90000), following: int(40, 400), clubIds: [cid], badges: H.founder.badges, hostIds: [hid], postCount: int(200, 3000), putCount: int(5, 80) });
  for (const [id, name, handle, bio] of H.models) newUsers.push({ id, handle, name, tone: H.tone, bio, verified: rnd() < 0.6, wallet: `0x${handle.slice(0, 4)}…${int(10, 99)}`, followers: int(2000, 60000), following: int(50, 600), clubIds: [cid], badges: ['Model'], hostIds: [hid], postCount: int(50, 900), putCount: int(1, 30) });
  newClubs.push({ id: cid, name: H.club, ticker: H.ticker, tone: H.tone, supply: H.pftSupply ?? [3333, 5555, 7777][int(0, 3)], ...(H.pftSupply ? { pftSupply: H.pftSupply } : {}), floor: +(0.4 + rnd() * 2.2).toFixed(2), holders: int(900, 5200), chain: H.chain, founderId: H.founder.id, status: H.status, route: 'direct', tagline: H.tagline, description: H.description, tags: H.tags, hostId: hid, worldIds: [wid], icon: H.icon });
  newHosts.push({ id: hid, name: H.host, clubId: cid, tone: H.tone, members: int(800, 5000), online: int(60, 700), gated: `Hold 1 ${H.ticker}`, roles: ['Founder', 'Model', 'Resident', 'Guest'], ownerId: H.founder.id, rules: ['Credit the house, the model and the stylist in every post.', 'No spoilers before the show closes.', 'Offers in #offers only.'] });
  const nests = [['lobby', 'channel', 'The house lobby.'], ['runway', 'stage', 'Show night stage.'], ['fittings', 'voice', 'Fitting room, voice only.']].map(([n, kind, topic], i) => ({ id: `n_${H.key}_${n}`, hostId: hid, parentId: null, kind, name: n, topic, unread: int(0, 30), createdBy: H.founder.id, ...(i === 1 ? { worldId: wid } : {}) }));
  newNests.push(...nests);
  newMsgs[nests[0].id] = H.chat ? H.chat.map(([m, text], k) => ({ id: `${nests[0].id}_${k}`, authorId: memberIds[m] ?? memberIds[0], at: `0${7 + k}:2${k}`, text }))
    : memberIds.slice(0, 4).map((a, k) => ({ id: `${nests[0].id}_${k}`, authorId: a, at: `0${9 + k}:1${k}`, text: ['Doors open at eight.', 'The new collection is in the mirror room.', 'Who is walking first tonight?', 'Offers close at midnight.'][k] }));
  // Store: pools + looks, rendered with the flagship's dress renders (fictional names and prices).
  const looks = H.looks.map((name, i) => { const src = lsLooks[(i * 3 + H.key.length) % lsLooks.length];
    return { ...src, specs: undefined, id: `g_${cid}_lk${i + 1}`, n: String(i + 1).padStart(2, '0'), poolId: `g_${cid}_col${(i % 2) + 1}`, storeId: sid, name, colour: src.colour, rarity: ['Common', 'Rare', 'Epic', 'Legendary'][i % 4], edition: [250, 100, 25, 5][i % 4], minted: int(5, 120), owners: int(3, 90), usd: int(900, 90000), floor: int(800, 80000), change7d: +(rnd() * 30 - 12).toFixed(1) }; });
  newStores.push({ id: sid, clubId: cid, code: H.ticker.slice(0, 3), name: H.club, tagline: H.tagline, pools: H.pools.map(([name, season], i) => ({ id: `g_${cid}_col${i + 1}`, name, season, desc: `${H.club}, ${name}.`, lookIds: looks.filter((l) => l.poolId === `g_${cid}_col${i + 1}`).map((l) => l.id) })), looks });
  newShows.push({ ...template, id: `show_${H.key}`, worldId: wid, season: 'SS27', title: H.show, venueCityId: cities[0].id, date: (() => { const n = newShows.length; return `2026-${String(11 + Math.floor(n / 28) > 12 ? 1 : 11 + Math.floor(n / 28)).padStart(2, '0')}-${String((n % 28) + 1).padStart(2, '0')}T20:00:00Z`; })(), hostAgentId: 'ag_ponte', clubId: cid, tone: H.tone,
    looks: template.looks.map((l, i) => ({ ...l, id: `${wid}_l${String(i + 1).padStart(2, '0')}`, title: H.looks[i % H.looks.length] + (i >= H.looks.length ? ' ' + (Math.floor(i / H.looks.length) + 1) : ''), pieces: [H.looks[i % H.looks.length], 'house gloves', 'signature scent'] })) });
  H.series.forEach(([kind, title, synopsis, genre, era, story, after], i) => {
    const id = `sr_${H.key}${i + 1}`, st = `st_${H.key}${i + 1}`;
    newSeries.push({ id, kind, title, clubId: cid, hostId: hid, worldId: wid, tone: H.tone, synopsis, cast: memberIds.slice(0, 3), runtime: int(70, 130), rating: +(3.8 + rnd()).toFixed(1), views: int(20000, 400000), episodes: [{ n: 1, title, tone: H.tone, runtime: int(70, 130), synopsis }], genre, era, storyId: st, ...(after ? { after } : {}) });
    newStories.push({ id: st, n: String(i + 1).padStart(2, '0'), seriesId: id, genre, era, kind, title, logline: synopsis, story: story ?? synopsis, clubId: cid, worldId: wid, ...(after ? { after } : {}) });
  });
  H.quests.forEach((title, i) => newQuests.push({ id: `q_${H.key}${i + 1}`, title, worldId: wid, sponsorClubId: cid, tone: H.tone, reward: int(150, 900), rewardCoin: H.ticker, entrants: int(40, 900), progress: +rnd().toFixed(2), endsAt: '2026-11-1' + i + 'T20:00:00Z', kind: 'sponsored' }));
  H.events.forEach(([kind, title, startsAt, recurring], i) => newEvents.push({ id: `e_${H.key}${i + 1}`, kind, title, clubId: cid, worldId: wid, cityId: cities[i % cities.length].id, startsAt: startsAt ?? `2026-11-0${3 + i}T20:00:00Z`, rsvps: int(200, 4000), ...(recurring ? { recurring } : {}) }));
  newCoins.push({ id: `coin_${H.key}`, symbol: H.ticker, name: `${H.club} Coin`, clubId: cid, tone: H.tone, price: +(1 + rnd() * 8).toFixed(2), change24h: +(rnd() * 14 - 5).toFixed(1), holders: int(150, 900) });
  newPools.push({ id: `pool_phi_${H.key}_0`, name: `PHI / ${H.ticker}`, pair: ['PHI', H.ticker], tone: H.tone, tvl: int(80000, 700000), apr: +(6 + rnd() * 18).toFixed(1), stakers: int(200, 2500) });
  // Places in each city
  cities.forEach((c, ci) => {
    places.cities[c.id] = { worldId: wid, tone: H.tone, desc: `${c.name}: ${c.vibe.toLowerCase()} in ${H.world.name}. 2 districts, ${c.population.toLocaleString('en-US')} residents.` };
    places.districts[c.id] = [1, 2].map((d) => ({ id: `${c.id}_d${d}`, name: `${c.name} ${['North', 'South'][d - 1]}`, vibe: ['Ateliers and galleries', 'Cafés and fitting rooms'][d - 1], tone: H.tone,
      places: [0, 1, 2].map((p) => { const [label, kind] = H.placeKinds?.[p] ?? [['Atelier', 'atelier'], ['Boutique', 'boutique'], ['Salon', 'fitting room']][p];
        return { id: `${c.id}_d${d}_p${p + 1}`, name: `${H.looks[(ci * 3 + d + p) % H.looks.length]} ${label}`, kind, clubId: cid, tone: H.tone, hours: H.placeKinds ? '00:00–24:00' : '10:00–22:00', visitors: int(20, 600), rating: +(3.9 + rnd()).toFixed(1), desc: `${H.club}'s ${label.toLowerCase()} in ${c.name}.` }; }) }));
  });
}

// Drop stale procedural records before merging, so a changed name list never leaves orphans behind.
const gx = (x) => /(^|_)gx_/.test(x.id);
for (const [o, k] of [[core, 'users'], [hosts, 'hosts'], [hosts, 'nests'], [stores, 'stores'], [shows, 'shows'], [series, 'series'], [stories, 'stories'], [events, 'events'], [econ, 'quests'], [econ, 'coins'], [econ, 'liquidity']]) if (Array.isArray(o[k])) o[k] = o[k].filter((x) => !gx(x));
for (const id of Object.keys(places.cities)) if (id.startsWith('ct_gx_')) { delete places.cities[id]; delete places.districts[id]; }
for (const id of Object.keys(hosts.messages ?? {})) if (id.startsWith('n_gx_')) delete hosts.messages[id];
core.clubs = replaceById(core.clubs, newClubs); core.worlds = replaceById(core.worlds, newWorlds); core.users = replaceById(core.users, newUsers);
hosts.hosts = replaceById(hosts.hosts, newHosts); hosts.nests = replaceById(hosts.nests, newNests); Object.assign(hosts.messages, newMsgs);
for (const [wid, cs] of extraCities) { const w = core.worlds.find((x) => x.id === wid); if (w) { const ids = new Set(cs.map((c) => c.id)); w.cities = [...w.cities.filter((c) => !ids.has(c.id)), ...cs]; } }
if (!events.filters.includes('Shows')) events.filters.push('Shows');
stores.stores = replaceById(stores.stores, newStores);
shows.shows = replaceById(shows.shows, newShows); series.series = replaceById(series.series, newSeries); stories.stories = replaceById(stories.stories, newStories);
events.events = replaceById(events.events, newEvents); econ.quests = replaceById(econ.quests, newQuests); econ.coins = replaceById(econ.coins, newCoins); econ.liquidity = replaceById(econ.liquidity ?? econ.pools ?? [], newPools); delete econ.pools;

// Agents: one concierge for each of the newest houses until there are 128, cloned from the hand-written agents
// (persona, abilities, prompts) with the house's own name, club and home. Each gets two posts. Ids start with ag_h_.
const OWN_AGENTS = new Set(HOUSES.filter((h) => h.agent).map((h) => h.agent.id));
agents.agents = agents.agents.filter((a) => !a.id.startsWith('ag_h_') && !OWN_AGENTS.has(a.id)); agents.posts = agents.posts.filter((p) => !p.authorId.startsWith('ag_h_') && !OWN_AGENTS.has(p.authorId));
{
  let s3 = 0x51ed; const r = () => ((s3 = (s3 * 48271) % 2147483647) - 1) / 2147483646; const pick = (a) => a[Math.floor(r() * a.length)];
  const FN = ['Aurelie', 'Bram', 'Colette', 'Desmond', 'Etta', 'Felix', 'Gaia', 'Hart', 'Ilse', 'Jory', 'Kesia', 'Lowell', 'Mireille', 'Nash', 'Oona', 'Perrin', 'Rhea', 'Silas', 'Thea', 'Valen', 'Winona', 'Yves', 'Zelie', 'Anouk', 'Benedict', 'Clio', 'Dashiell', 'Elspeth'];
  const LN = ['Aubrac', 'Bellamy', 'Castell', 'Delacroix', 'Everly', 'Fontaine', 'Gascoigne', 'Hawthorne', 'Isard', 'Jessup', 'Kingsley', 'Lisle', 'Montague', 'Nightingale', 'Orsini', 'Prescott', 'Revel', 'Sinclair', 'Tremaine', 'Valois'];
  const base = agents.agents.slice(); const need = Math.max(0, 128 - base.length); const houses = HOUSES.filter((h) => !ROUND28.has(h.key)).slice(-need); const usedN = new Set(base.map((a) => a.name));
  houses.forEach((H, i) => {
    const t = base[i % base.length]; const cid = 'c_' + H.key, wid = 'w_' + H.key; let name; do name = `${pick(FN)} ${pick(LN)}`; while (usedN.has(name)); usedN.add(name);
    const first = name.split(' ')[0]; const id = 'ag_h_' + H.key.replace(/^gx_/, '');
    agents.agents.push({ ...t, id, name, handle: name.toLowerCase().replace(' ', '.'), tone: H.tone, role: `${H.club} concierge`, house: H.club, home: `${H.world.cities[0][0]}, ${H.world.name}`,
      status: `Walking ${H.world.cities[0][0]}`, verified: i % 3 !== 0, followers: 4000 + Math.floor(r() * 90000), following: 20 + Math.floor(r() * 300), postCount: 200 + Math.floor(r() * 4000), since: 'Sep 2026',
      clubIds: [cid], badges: ['Concierge', H.ticker], bio: `${first} runs the floor at ${H.club}. Ask for a fitting, a seat at the show or the right look for tonight.`,
      style: t.style, persona: `You are ${first}, the concierge of ${H.club} in ${H.world.name}. ${t.persona}`, askHint: t.askHint,
      greeting: `Welcome to ${H.club}. Fitting, front row or the new drop?`, fallback: `The line to ${H.world.name} is busy. Meet me at ${H.world.cities[0][0]}.`, commentFallback: t.commentFallback,
      summonLine: `${first} here from ${H.club}. Doors open at eight, who is walking with me?`,
      highlights: t.highlights.map((h) => ({ ...h, id: `${id}_${h.id}` })), wardrobe: { title: `${H.club} wardrobe`, pieces: H.looks.slice(0, 4) } });
    [0, 1].forEach((k) => agents.posts.push({ id: `${id}_p${k + 1}`, authorId: id, kind: 'look', clubId: cid, worldId: wid,
      caption: [`${H.looks[k]} is on the floor tonight.`, `Backstage at ${H.show.split(': ')[1] ?? 'the show'}: every look in one place.`][k], likes: 800 + Math.floor(r() * 30000),
      createdAt: `2026-10-${String(1 + ((i + k * 7) % 10)).padStart(2, '0')}T${String(8 + (i % 12)).padStart(2, '0')}:30:00Z`, tags: ['#' + H.ticker, '#SS27', '#PFT'],
      slides: H.looks.slice(k * 3, k * 3 + 3).map((l, j) => ({ title: l, tone: ['ink', 'accent', 'sage', 'neutral'][(i + j) % 4], caption: `${l} by ${H.club}.` })),
      comments: [{ id: `${id}_p${k + 1}_c1`, authorId: H.founder.id, text: 'Every one of these is a fitting I will remember.', likes: 40 + Math.floor(r() * 400), at: (2 + k) + 'h' }] }));
  });
}

// Houses that bring their own character (fictional): a hand-written persona on the first agent's abilities.
for (const H of HOUSES.filter((x) => x.agent)) {
  const A = H.agent, t = agents.agents.find((a) => !a.id.startsWith('ag_h_')) ?? agents.agents[0]; const cid = 'c_' + H.key, wid = H.inWorld ?? 'w_' + H.key;
  agents.agents = agents.agents.filter((a) => a.id !== A.id); agents.posts = agents.posts.filter((p) => p.authorId !== A.id);
  agents.agents.push({ ...t, id: A.id, name: A.name, handle: A.name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, ''), tone: H.tone, role: A.role, house: H.club, home: `${H.world.cities[0][0]}, ${H.world.name}`,
    status: `At ${H.world.cities[0][0]}`, verified: true, followers: 128000, following: 64, postCount: 640, since: 'Jun 2026', clubIds: [cid], badges: [A.role, H.ticker], bio: A.bio,
    persona: A.persona, greeting: A.greeting, fallback: `The line to ${H.world.cities[0][0]} is busy. Try me again after the show.`, summonLine: A.summonLine,
    highlights: t.highlights.map((h) => ({ ...h, id: `${A.id}_${h.id}` })), wardrobe: { title: `${A.name}'s wardrobe`, pieces: H.looks.slice(0, 4) } });
  [0, 1].forEach((k) => agents.posts.push({ id: `${A.id}_p${k + 1}`, authorId: A.id, kind: 'look', clubId: cid, worldId: wid,
    caption: [`${H.looks[k]} for the morning ride.`, `${H.events[0][1]}: every look in one place.`][k], likes: 12000 + k * 3400, createdAt: `2026-10-0${2 + k}T07:30:00Z`, tags: ['#' + H.ticker, '#SS27', '#PFT'],
    slides: H.looks.slice(k * 3, k * 3 + 3).map((l, j) => ({ title: l, tone: ['accent', 'sage', 'ink'][j % 3], caption: `${l} by ${H.club}.` })),
    comments: [{ id: `${A.id}_p${k + 1}_c1`, authorId: H.models[1]?.[0] ?? H.founder.id, text: ['The deer approves.', 'See you in the arena.'][k], likes: 400 + k * 90, at: (2 + k) + 'h' }] }));
}

// Ponte Reye the agent runs the Italian flagship floor.
const ponte = agents.agents.find((a) => a.id === 'ag_ponte');
if (ponte) { ponte.role = 'Flagship concierge'; ponte.house = 'Ponte Reye Milano'; ponte.home = 'Galleria Reye, Via Reye'; ponte.clubIds = [...new Set(['c_ponte', ...ponte.clubIds])]; }

write('core.json', renamed(core)); write('hosts.json', renamed(hosts)); write('stores.json', renamed(stores)); write('ls.json', renamed(ls));
write('shows.json', shows); write('series.json', series); write('stories.json', stories); write('events.json', events); write('economy.json', econ);
write('agents.json', renamed(agents)); write('places.json', places);
console.log(`houses: ${HOUSES.map((h) => h.club).join(', ')} · +${newUsers.length} people · +${newStores.reduce((n, s) => n + s.looks.length, 0)} looks · +${newSeries.length} series · ${Object.keys(places.cities).length} cities with places`);
