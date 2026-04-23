# nodebb-plugin-backblaze-b2-s3-uploads

Stores NodeBB forum uploads in **Backblaze B2** through the S3-compatible API. Files are served through a permission-aware proxy that issues short-lived presigned URLs, so:

- Uploads in **public categories** are reachable by anonymous visitors (still through the proxy, which checks `topics:read` for guests).
- Uploads in **private categories** require the visitor to have `topics:read` on that category.
- Direct B2 URLs are never put into post content — only opaque proxy URLs are, so leaked links die with the user's session/permission.

## How it works

1. User uploads a file. Plugin intercepts `filter:uploadFile` / `filter:uploadImage`, streams the file to B2, stores `{uid, name, type, size}` keyed by the B2 object key in NodeBB's database.
2. Post content references the file as `/uploads/b2/<key>`.
3. On `action:post.save` / `action:post.edit`, the plugin scans the post and links each referenced key to `{pid, tid, cid}`.
4. When a browser requests `/uploads/b2/<key>`, the plugin checks `privileges.categories.can('topics:read', cid, uid)`, generates a fresh presigned URL with TTL from settings, and 302-redirects.
5. The 302 is `Cache-Control: private, max-age=(TTL - 60s)` so the browser doesn't hit NodeBB on every image load.

## Install

```bash
cd /path/to/nodebb
npm install git+https://github.com/sqlik/nodebb-plugin-backblaze-b2-s3-uploads.git
./nodebb activate nodebb-plugin-backblaze-b2-s3-uploads
./nodebb restart
```

Or for local development, link the directory:

```bash
cd /path/to/nodebb-plugin-backblaze-b2-s3-uploads && npm install
cd /path/to/nodebb && npm install /path/to/nodebb-plugin-backblaze-b2-s3-uploads
./nodebb activate nodebb-plugin-backblaze-b2-s3-uploads
./nodebb restart
```

## Configure

Open **ACP → Plugins → Backblaze B2 Uploads (S3 API)** and fill in the fields:

![ACP settings page](screenshots/acp-settings.png)



| Field | Example | Notes |
|---|---|---|
| S3 Endpoint | `https://s3.eu-central-003.backblazeb2.com` | From your B2 bucket details ("S3 API") |
| Region | `eu-central-003` | The bit between `s3.` and `.backblazeb2.com` |
| Bucket name | `forum-uploads` | Bucket must be **Private** |
| Application Key ID | `0035…` | Use a key restricted to **this single bucket** |
| Application Key | `K003…` | Stored in NodeBB settings DB |
| Path prefix | `uploads` | All keys go under this prefix |
| Presigned URL TTL | `600` | Seconds. 600 = 10 min. Max 604800 (7 days). |
| Max file size | `26214400` | 25 MB default |
| Max video size | `104857600` | 100 MB default |
| Allowed extensions | `jpg,jpeg,png,…` | Comma separated |

> **Heads-up:** NodeBB has its own global upload limit in **Settings → Uploads**. The lower of the two wins.

## Recommended B2 setup

1. Create a **Private** bucket.
2. Create an **Application Key** scoped to *only* that bucket, with `read+write` permissions.
3. Optionally add a CORS rule allowing your forum origin (only matters if you add direct browser uploads later — not needed for the proxy flow).

## Optional: Bunny CDN delivery

By default the proxy redirects to a B2 presigned URL — every visitor pulls bytes straight from B2. If you want **edge caching, image optimization and global low-latency delivery**, enable Bunny CDN.

### How it works

```
Browser → /uploads/b2/<key>            (NodeBB proxy: permission check)
        ← 302 https://<zone>.b-cdn.net/<key>?token=...&expires=...
Browser → Bunny edge POP (verifies token, serves from cache or pulls from B2)
        ← bytes
```

The proxy still runs every request — permission checks remain authoritative. Only the bytes are delivered through Bunny.

### Bunny dashboard setup

1. **Pull Zones → Add Pull Zone**
   - Origin Type: `Backblaze B2`
   - Application Key ID + Application Key (from B2; can be the same key the plugin uses)
   - Bucket name + region
2. **Settings → Security → Token Authentication**: **ON**
3. Copy the **Token Authentication Key** shown there
4. (optional) **Optimizer**: ON for auto WebP/AVIF + image resize via URL params
5. (optional) **Settings → Caching**: tune to taste

### Plugin settings

In the **Bunny CDN delivery** section of the ACP page, fill:

| Field | Example |
|---|---|
| Use Bunny CDN delivery | ☑️ |
| Bunny zone hostname | `omdm-uploads.b-cdn.net` |
| Token Authentication Key | (from Bunny dashboard) |
| Bunny token TTL | `0` (= same as B2 TTL) or custom |

### Tradeoffs

- **B2 → Bunny transfer is free** (Bandwidth Alliance) — origin pulls cost nothing
- **Bunny → user transfer** is paid but cheap (~$0.01/GB)
- Each visitor still hits the NodeBB proxy first for permission check — no cache bypass on auth

## Maintenance: orphan cleanup

Files uploaded but never used in a saved post become orphans (e.g. user opens the composer, drops an image, then closes the tab without submitting). The plugin tracks every upload in a sorted set `b2-uploads:orphans`; the entry is removed on `action:post.save` / `action:post.edit` once the upload is referenced from a saved post.

A background sweep runs every `cleanupIntervalHours` (default 6h). Anything still in the orphans set older than `cleanupAgeHours` (default 24h) is deleted from B2 and from the database.

ACP fields:

| Field | Default | Notes |
|---|---|---|
| Enable scheduled orphan cleanup | ON | Disables the background timer when off |
| Delete orphans older than (hours) | `24` | Generous grace window — covers slow drafts |
| Sweep interval (hours) | `6` | How often the timer fires |

There is also a **Run cleanup sweep now** button in the ACP that triggers the sweep immediately and reports `scanned / deleted / failed` counts.

## Roadmap

- [ ] Migration command for existing local uploads (with dry-run mode)
- [ ] Per-user / per-group upload quotas
- [ ] Optional IP-bound Bunny tokens

## License

MIT
