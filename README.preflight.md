# Trae Preflight

This folder is prepared for `wangxt-1096-1`.

Use `.env` for stable local ports and compose project identity:

- APP_PORT: 18396
- API_PORT: 19396
- WEB_PORT: 20396
- DB_PORT: 21396
- REDIS_PORT: 22396

Smoke entry:

```bash
bash scripts/smoke.sh
```

The preflight files are environment scaffolding only. The generated business
project can replace or extend them when needed.
