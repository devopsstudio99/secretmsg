#!/bin/bash
# Git setup script for Secret Message App

echo "Setting up Git repository..."

# Initialize git
git init

# Add all files
git add .

# Show status
echo ""
echo "Files to be committed:"
git status

echo ""
echo "Next steps:"
echo "1. Review the files above"
echo "2. Run: git commit -m 'Initial commit: Secret Message App'"
echo "3. Create a repository on GitHub"
echo "4. Run: git remote add origin YOUR_GITHUB_URL"
echo "5. Run: git push -u origin main"
