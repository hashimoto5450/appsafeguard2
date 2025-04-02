#!/bin/bash
# Set GitHub credentials in the URL
git remote set-url origin https://${GITHUB_TOKEN}@github.com/hashimoto5450/appsafeguard.git
# Push to GitHub
git push -u origin main