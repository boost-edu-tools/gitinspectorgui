# Documentation Deployment Guide

This guide explains how to test and deploy the MkDocs documentation to GitLab Pages.

> **Note**: This project is hosted under the `edu-boost` GitLab group.

## 🧪 Step 1: Test Locally First

Before enabling automatic CI/CD, ensure your environment is set up and test the documentation build:

```bash
# Ensure dependencies are installed (if not already done)
uv sync --group dev

# Run the local test script
./scripts/test-docs-build.sh
```

This script will:

-   Use your existing `.venv` environment
-   Verify MkDocs dependencies from `pyproject.toml`
-   Build the documentation to `public/` directory
-   Show build statistics and next steps

## 🌐 Step 2: Test the Built Site

After running the test script, serve the built site locally:

```bash
# Serve the built documentation
python3 -m http.server 8080 --directory public

# Open in browser: http://localhost:8080
```

Verify that:

-   All pages load correctly
-   Navigation works properly
-   Mermaid diagrams render
-   Search functionality works
-   Mobile responsiveness is good

## 🚀 Step 3: Deploy to GitLab Pages

Deployment to GitLab Pages is handled by a CI/CD pipeline. The configuration is managed by the `scripts/switch-ci.sh` script, which generates the `.gitlab-ci.yml` file.

### 3.1 How It Works

The `switch-ci.sh` script assembles the final `.gitlab-ci.yml` from partial files located in the `.ci/` directory. This allows for flexible pipeline configurations.

-   `.ci/base.yml`: Contains the basic stage definitions.
-   `.ci/docs.yml`: Contains the specific job for building and deploying the MkDocs site to GitLab Pages.
-   `.ci/app.yml`: Contains jobs for building the main application (used for full releases).

### 3.2 Enabling the Documentation Pipeline

To deploy the documentation, you must first generate the correct CI/CD configuration file.

```bash
# Enable the documentation-only pipeline
./scripts/switch-ci.sh docs
```

This command creates a `.gitlab-ci.yml` file configured to only build and deploy the documentation.

### 3.3 Pushing Changes to Deploy

Once the pipeline is enabled, any push to the default branch (`main`) will automatically trigger the `pages` job.

```bash
# Add your changes and the generated CI file
git add .
git commit -m "Update documentation and enable Pages deployment"
git push origin main
```

### 3.4 Monitor Deployment

1. Go to **CI/CD** → **Pipelines** in your GitLab project
2. Watch the `pages` job in the pipeline
3. Once successful, your documentation will be available at:
   **https://edu-boost.gitlab.io/gitinspectorgui**

## 🔧 Troubleshooting

### Pipeline Fails

If the GitLab Pages pipeline fails:

1. Check the job logs in GitLab CI/CD → Pipelines
2. Common issues:
    - Missing dependencies (should be handled by the pipeline)
    - MkDocs configuration errors
    - Broken links in documentation

### Local Test Fails

If the local test script fails:

1. Check Python 3 is installed: `python3 --version`
2. Ensure you're in the project root directory
3. Check MkDocs configuration: `mkdocs.yml`

### Documentation Not Updating

If changes don't appear on the live site:

1. Verify the pipeline completed successfully
2. Check GitLab Pages settings
3. Clear browser cache
4. Wait a few minutes for CDN propagation

## 📁 File Structure

```
project/
├── .ci/                          # Partial CI/CD configurations
│   ├── app.yml                   # App build jobs
│   ├── base.yml                  # Base CI configuration
│   └── docs.yml                  # Documentation job
├── mkdocs.yml                    # MkDocs configuration
├── docs/                         # Documentation source
├── scripts/
│   ├── switch-ci.sh             # CI configuration switcher
│   └── test-docs-build.sh       # Local documentation testing
└── .gitlab-ci.yml                # Generated CI file (ignored by Git)
```

## ⚖️ CI/CD Configuration Comparison

| Mode     | Command                       | Purpose              |
| -------- | ----------------------------- | -------------------- |
| **Docs** | `./scripts/switch-ci.sh docs` | Documentation only   |
| **Apps** | `./scripts/switch-ci.sh apps` | Apps + Documentation |
| **Off**  | `./scripts/switch-ci.sh off`  | Disable all CI/CD    |

**When to use Documentation CI:**

-   Regular documentation updates
-   Faster feedback on doc changes
-   Lower resource usage
-   Automatic deployment on doc changes

**When to use Full Application CI:**

-   Creating application releases
-   Building cross-platform binaries
-   Comprehensive testing pipeline
-   Publishing to package repositories

## 🔄 Workflow

1. **Develop**: Edit documentation in `docs/` directory
2. **Test**: Run `python -m mkdocs serve` for live preview
3. **Validate**: Run `./test-docs-build.sh` before committing
4. **Deploy**: Push to `main` branch (if CI/CD is enabled)

## 🛡️ Safety Features

-   CI/CD is disabled by default (`.gitlab-ci.yml.disabled`)
-   Local testing script validates build before deployment
-   Documentation builds are isolated in virtual environments
-   Failed builds don't affect the live site

## 📞 Support

If you encounter issues:

1. Check the local test output for specific errors
2. Review MkDocs documentation: https://www.mkdocs.org/
3. Check GitLab Pages documentation: https://docs.gitlab.com/ee/user/project/pages/
