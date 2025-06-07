# GitLab Group Pages Setup Guide

This guide explains how to configure the `edu-boost.gitlab.io` repository to serve documentation from multiple projects under the `edu-boost` group.

## Overview

The goal is to have:

-   Main landing page: `https://edu-boost.gitlab.io`
-   GitInspectorGUI docs: `https://edu-boost.gitlab.io/gitinspectorgui/`
-   Future project docs: `https://edu-boost.gitlab.io/project-name/`

## Required Configuration for `edu-boost.gitlab.io` Repository

### 1. GitLab CI/CD Configuration (`.gitlab-ci.yml`)

Create or update the `.gitlab-ci.yml` file in the `edu-boost.gitlab.io` repository:

```yaml
stages:
    - collect
    - deploy

variables:
    # Project IDs for documentation collection
    GITINSPECTORGUI_PROJECT_ID: "your-project-id-here" # Replace with actual project ID

collect_docs:
    stage: collect
    image: alpine:latest
    before_script:
        - apk add --no-cache curl jq
    script:
        # Create the public directory structure
        - mkdir -p public

        # Create the main landing page
        - |
            cat > public/index.html << 'EOF'
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>edu-boost - Educational Tools & Resources</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                    .project { border: 1px solid #ddd; margin: 20px 0; padding: 20px; border-radius: 8px; }
                    .project h2 { margin-top: 0; color: #333; }
                    .project a { color: #0066cc; text-decoration: none; }
                    .project a:hover { text-decoration: underline; }
                    header { text-align: center; margin-bottom: 40px; }
                    header h1 { color: #2c3e50; }
                </style>
            </head>
            <body>
                <header>
                    <h1>edu-boost</h1>
                    <p>Educational Tools & Resources</p>
                </header>

                <div class="project">
                    <h2>GitInspectorGUI</h2>
                    <p>A modern desktop application for analyzing Git repositories with an intuitive graphical interface.</p>
                    <p><a href="/gitinspectorgui/">📖 View Documentation</a></p>
                </div>

                <!-- Add more projects here as they become available -->

                <footer style="margin-top: 40px; text-align: center; color: #666;">
                    <p>Part of the edu-boost organization</p>
                </footer>
            </body>
            </html>
            EOF

        # Download GitInspectorGUI documentation
        - |
            echo "Downloading GitInspectorGUI documentation..."
            curl --location --header "PRIVATE-TOKEN: $CI_JOB_TOKEN" \
                 "https://gitlab.com/api/v4/projects/$GITINSPECTORGUI_PROJECT_ID/jobs/artifacts/main/download?job=pages" \
                 --output gitinspectorgui-docs.zip

            # Extract and place in correct location
            unzip -q gitinspectorgui-docs.zip
            if [ -d "public/gitinspectorgui" ]; then
                cp -r public/gitinspectorgui public_final/gitinspectorgui
            else
                echo "Warning: GitInspectorGUI documentation not found in expected location"
            fi

            # Move the final public directory
            rm -rf public
            mv public_final public

    artifacts:
        paths:
            - public
    rules:
        - if: $CI_COMMIT_REF_NAME == $CI_DEFAULT_BRANCH

pages:
    stage: deploy
    dependencies:
        - collect_docs
    script:
        - echo "Deploying group pages..."
        - ls -la public/
    artifacts:
        paths:
            - public
    rules:
        - if: $CI_COMMIT_REF_NAME == $CI_DEFAULT_BRANCH
```

### 2. Project ID Configuration

To find the GitInspectorGUI project ID:

1. Go to the GitInspectorGUI project in GitLab
2. Look at the project settings or the URL
3. The project ID is visible in the project settings under "General"
4. Replace `your-project-id-here` in the CI configuration above

### 3. Alternative Approach: Manual Artifact Collection

If the automated approach doesn't work initially, you can use a simpler manual approach:

```yaml
pages:
    script:
        - mkdir -p public/gitinspectorgui
        - |
            cat > public/index.html << 'EOF'
            <!DOCTYPE html>
            <html>
            <head><title>edu-boost</title></head>
            <body>
                <h1>edu-boost Organization</h1>
                <ul>
                    <li><a href="/gitinspectorgui/">GitInspectorGUI Documentation</a></li>
                </ul>
            </body>
            </html>
            EOF
        - echo "Placeholder for GitInspectorGUI docs" > public/gitinspectorgui/index.html
    artifacts:
        paths:
            - public
    rules:
        - if: $CI_COMMIT_REF_NAME == $CI_DEFAULT_BRANCH
```

Then manually upload the documentation artifacts from the GitInspectorGUI project.

## GitLab Settings Configuration

### 1. Group Settings

1. Go to the `edu-boost` group settings
2. Navigate to "General" → "Advanced"
3. Ensure "Pages" is enabled for the group

### 2. Project Settings for `edu-boost.gitlab.io`

1. Go to the `edu-boost.gitlab.io` project settings
2. Navigate to "Pages"
3. Ensure the project is configured as the group's pages source
4. The URL should show as `https://edu-boost.gitlab.io`

### 3. Project Settings for `gitinspectorgui`

1. Go to the `gitinspectorgui` project settings
2. Navigate to "Pages"
3. The pages should be disabled for direct access (since we're using group pages)
4. Ensure the CI/CD pipeline has permission to create artifacts

## Testing the Setup

1. **Test GitInspectorGUI build locally:**

    ```bash
    cd /path/to/gitinspectorgui
    ./scripts/test-docs-build.sh
    python3 -m http.server 8080 --directory public_temp
    # Visit http://localhost:8080/gitinspectorgui/
    ```

2. **Test group pages locally:**
    ```bash
    cd /path/to/edu-boost.gitlab.io
    # After setting up the CI configuration above
    python3 -m http.server 8080 --directory public
    # Visit http://localhost:8080/
    ```

## Troubleshooting

### Common Issues

1. **404 errors:** Check that the directory structure matches the URL paths
2. **Permission errors:** Ensure the CI/CD token has access to download artifacts
3. **Build failures:** Check that all project IDs are correct

### Verification Steps

1. Check that `https://edu-boost.gitlab.io` loads the landing page
2. Check that `https://edu-boost.gitlab.io/gitinspectorgui/` loads the documentation
3. Verify that internal links within the documentation work correctly

## Adding Future Projects

To add a new project's documentation:

1. Configure the new project with similar CI/CD setup as GitInspectorGUI
2. Add the project to the group pages CI/CD configuration
3. Update the landing page HTML to include a link to the new project
4. Test the integration

## Security Considerations

-   Use project access tokens with minimal required permissions
-   Regularly review and rotate access tokens
-   Ensure only authorized projects can contribute to group pages
