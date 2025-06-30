# Documentation Deployment

## Quick Start

Deploy MkDocs documentation to GitHub Pages:

```bash
# Enable documentation deployment
./scripts/switch-ci.sh docs

# Test locally first
./scripts/test-docs-build.sh

# Deploy
git add .
git commit -m "docs: update documentation"
git push origin main
```

Site will be available at: `https://boost-edu-tools.github.io/gitinspectorgui`

## Local Testing

```bash
# Test build
./scripts/test-docs-build.sh

# Live preview during development
mkdocs serve
# Open: http://127.0.0.1:8000
```

## CI Pipeline Modes

| Command                       | Purpose              |
| ----------------------------- | -------------------- |
| `./scripts/switch-ci.sh docs` | Documentation only   |
| `./scripts/switch-ci.sh apps` | Apps + Documentation |
| `./scripts/switch-ci.sh off`  | Disable CI/CD        |

## Troubleshooting

**Build fails:**
- Check GitHub Actions logs: Go to **Actions** tab → Select failed workflow → View logs
- Run `./scripts/test-docs-build.sh` locally first
- Manually restart: **Actions** tab → Select workflow → **Re-run all jobs**

**Documentation not updating:**
- Verify GitHub Actions completed successfully
- Clear browser cache
