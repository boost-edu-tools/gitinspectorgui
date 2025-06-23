# Documentation Deployment

## Overview

Deploy MkDocs documentation to GitLab Pages using automated CI/CD pipeline.

## Local Testing

### Test Documentation Build

```bash
# Install dependencies
uv sync --group dev

# Test build locally
./scripts/test-docs-build.sh
```

### Serve Built Site

```bash
# Serve documentation locally
python3 -m http.server 8080 --directory public

# Open: http://localhost:8080
```

### Verification Checklist

- All pages load correctly
- Navigation works properly
- Mermaid diagrams render
- Search functionality works
- Mobile responsiveness

## GitLab Pages Deployment

### CI/CD Configuration

```bash
# Enable documentation pipeline
./scripts/switch-ci.sh docs

# Commit and deploy
git add .
git commit -m "Enable documentation deployment"
git push origin main
```

### Pipeline Modes

| Mode     | Command                       | Purpose              |
| -------- | ----------------------------- | -------------------- |
| **docs** | `./scripts/switch-ci.sh docs` | Documentation only   |
| **apps** | `./scripts/switch-ci.sh apps` | Apps + Documentation |
| **off**  | `./scripts/switch-ci.sh off`  | Disable CI/CD        |

### Deployment Process

1. **Configure** - Run switch-ci.sh script
2. **Push** - Commit triggers pipeline
3. **Monitor** - Check CI/CD → Pipelines
4. **Access** - Site available at `https://boost-edu-tools.github.io/gitinspectorgui`

## File Structure

```
project/
├── .ci/
│   ├── base.yml          # Base CI configuration
│   ├── docs.yml          # Documentation job
│   └── app.yml           # Application jobs
├── mkdocs.yml            # MkDocs configuration
├── docs/                 # Documentation source
├── scripts/
│   ├── switch-ci.sh      # CI configuration switcher
│   └── test-docs-build.sh # Local testing
└── .gitlab-ci.yml        # Generated CI file
```

## Troubleshooting

### Pipeline Issues

**Build fails:**

- Check CI/CD → Pipelines logs
- Verify MkDocs configuration
- Check for broken links

**Documentation not updating:**

- Verify pipeline completed successfully
- Clear browser cache
- Wait for CDN propagation

### Local Issues

**Test script fails:**

```bash
# Check Python version
python3 --version

# Verify project directory
pwd

# Check MkDocs config
cat mkdocs.yml
```

**Dependencies missing:**

```bash
# Reinstall dependencies
uv sync --group dev

# Verify MkDocs installation
mkdocs --version
```

## Development Workflow

### Standard Process

1. **Edit** - Modify files in `docs/` directory
2. **Preview** - Run `mkdocs serve` for live preview
3. **Test** - Run `./scripts/test-docs-build.sh`
4. **Deploy** - Push to main branch

### Live Preview

```bash
# Start development server
mkdocs serve

# Open: http://127.0.0.1:8000
```

## CI/CD Pipeline Details

### Documentation Job

```yaml
pages:
  stage: deploy
  image: python:3.13
  script:
    - pip install -e .[dev]
    - mkdocs build --site-dir public
  artifacts:
    paths:
      - public
  only:
    - main
```

### Pipeline Triggers

- **Automatic** - Push to main branch
- **Manual** - Retry from GitLab UI
- **Scheduled** - Optional scheduled builds

## Safety Features

- **Default disabled** - CI/CD requires explicit enablement
- **Local validation** - Test script prevents broken deployments
- **Isolated builds** - Virtual environments prevent conflicts
- **Rollback capability** - Failed builds don't affect live site

## Monitoring

### Pipeline Status

- Navigate to **CI/CD** → **Pipelines**
- Monitor job progress and logs
- Check deployment status

### Site Health

- Verify site accessibility
- Test navigation and search
- Check mobile responsiveness
- Validate external links

## Summary

GitLab Pages deployment provides automated documentation publishing with local testing capabilities. The flexible CI/CD configuration supports both documentation-only and full application deployments.
