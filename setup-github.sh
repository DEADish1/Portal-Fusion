#!/bin/bash

# CrossBridge - GitHub Setup Script
# This script helps you push the CrossBridge project to your GitHub repository

echo "======================================"
echo "   CrossBridge GitHub Setup Helper    "
echo "======================================"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d ".git" ]; then
    echo "❌ Please run this script from the CrossBridge project root."
    exit 1
fi

echo "✅ Git repository is initialized and ready!"
echo ""
echo "📋 Follow these steps to push to GitHub:"
echo ""
echo "1️⃣  Create a new repository on GitHub:"
echo "    • Go to https://github.com/new"
echo "    • Repository name: crossbridge"
echo "    • Description: Comprehensive cross-platform bridge system for MacBook and Windows tablet"
echo "    • Set to Public or Private (your choice)"
echo "    • DO NOT initialize with README, .gitignore, or license"
echo "    • Click 'Create repository'"
echo ""
echo "2️⃣  After creating the repository, run these commands:"
echo ""
echo "    git remote add origin https://github.com/YOUR_USERNAME/crossbridge.git"
echo "    git push -u origin main"
echo ""
echo "    Or if using SSH:"
echo "    git remote add origin git@github.com:YOUR_USERNAME/crossbridge.git"
echo "    git push -u origin main"
echo ""
echo "3️⃣  Optional: Enable GitHub Actions in your repository settings"
echo "    for automated CI/CD workflows"
echo ""
echo "📁 Current Git Status:"
git status --short
echo ""
echo "📊 Repository Statistics:"
echo "    Commits: $(git rev-list --count HEAD)"
echo "    Files: $(git ls-files | wc -l)"
echo "    Size: $(du -sh .git | cut -f1)"
echo ""
echo "🎉 Your CrossBridge project is ready for GitHub!"
