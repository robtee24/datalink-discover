# Datalink Discover

Static microsite for the Datalink Discover conference series (HTML, CSS, JS).

Internal links omit the `.html` extension. **Vercel:** `vercel.json` sets `cleanUrls` so `/bentonville/schedule` serves `bentonville/schedule.html`. **Apache:** use the included `.htaccess` rewrite. Plain `python3 -m http.server` does not rewrite extensionless URLs—use `vercel dev` / deploy, or open files with the full `.html` path for quick checks.
