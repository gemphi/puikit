# How Phiegg's content gets served

Every picture and media record has one key. Locally it sits in `media/phi-media/` and in a local S3 store; on AWS the same key sits
in S3 behind CloudFront. Apps read through `mediaUrl` (`src/lib/media.ts`), so changing `VITE_PHI_MEDIA` is the whole move.

## The bucket

```
worlds/<slug>/        world.json, logo.svg (3D Phifing), logo-original.webp, icon.webp, hero.webp, gallery/
worlds/<slug>/zones/<slug>/zone.json
lands/types.json      the 16 official land types, numbered
lands/<slug>/         land renders
collections/<slug>/   collection.json, items/<token>.json, index/page-NNNN.json, images/<token>.webp
feeds/                all/page-NNNN.json, moments.json, worlds/<slug>.json
posts/<id>/post.json
profiles/<id>/        profile.json, avatar.webp
assets/               items, rides, jewels, portraits, welcome, landing, scenes, brand, logo
manifest.json
```

What the old project and you call a city (Skim City, Naim City) is a **world** here, and the app's cities act as its
**zones**. A land type, like Crystal Caves, is what a zone or city is built on.

## Rules for art

Only finished art that belongs to its place goes in. `scripts/media/catalog.json` names it, file by file. Drafts, art with
no known owner, and third-party NFT collections stay out; a world with nothing of its own keeps its scene and 3D logo.

## Run it

```bash
pip install -r scripts/media/requirements.txt
python scripts/media/build_media.py
python scripts/media/import_collections.py --images
docker compose -f app/docker-compose.media.yml up -d
scripts/media/sync.sh local
```

Then start an app with `VITE_PHI_MEDIA=http://localhost:8333/phi-media`.

## Move to AWS

```bash
cd deploy/aws/media && terraform init && terraform apply -var 'allowed_origins=["https://phiace.com"]'
scripts/media/sync.sh aws "$(terraform output -raw bucket)"
```

Build the apps with `VITE_PHI_MEDIA=https://<cdn_domain>`.

## Google Drive holds the finals

`scripts/media/drive-map.json` records where each finished set is. The connector can read Drive but cannot carry
thousands of images, so these come down as zips into Downloads (or `media/incoming`):

| Folder | What it holds |
|---|---|
| `BOLD-NFTS-FINAL` | EPAC images (`EPAC-NNNN.png`) and `FINAL-NFT-NONPIXEL`, its attributes |
| `BPSC-NFTS-8000` | Bold Pups in the BPSC club (`BPSC-NNNN.png`), in folders of 1,000 |
| `BOLD-PUPS/BPWC` | `BPWC-1-1000`, Bold Pups attributes including each pup's club |
| `SKIM-CITY` and the other city folders | city logos and icons, by land type |

Then run `python scripts/media/import_collections.py --images` and `scripts/media/sync.sh local`. Drive turns its sheets
into xlsx in a folder download, which is what the importer reads.

## Still to do

- The final sets above, once downloaded. Bold Ape Epic Club in the store is the old set (`BAEC-NFTS-OLD` on Drive); EPAC
  replaces it. HHOC (2,000) is the other Bold Pups club and is in, but without attributes until the sheets cover it.
- Epic Pods (150) have records but no images found yet; `BOLD-EPICS` on Drive is the place to look.
- Each land type's city logo options need one chosen per city.
- Phiora does not read `collections/` or `feeds/` yet; the app still takes its feed from its own data.
- Source renders should get a private bucket of their own.
