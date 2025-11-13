#!/bin/bash

# Portal Fusion - GitHub Setup Script
# This script helps you push the Portal Fusion project to your GitHub repository

echo "======================================"
echo "    Portal Fusion GitHub Setup       "
echo "======================================"
echo "🌀 Seamless computing, unified"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d ".git" ]; then
    echo "❌ Please run this script from the Portal Fusion project root."
    exit 1
fi

echo "✅ Git repository is initialized and ready!"
echo ""
echo "📋 Follow these steps to push to GitHub:"
echo ""
echo "1️⃣  Create a new repository on GitHub:"
echo "    • Go to https://github.com/new"
echo "    • Repository name: portal-fusion"
echo "    • Description: Seamless computing, unified - Cross-platform bridge for PC and Mac"
echo "    • Set to Public or Private (your choice)"
echo "    • DO NOT initialize with README, .gitignore, or license"
echo "    • Click 'Create repository'"
echo ""
echo "2️⃣  After creating the repository, run these commands:"
echo ""
echo "    git remote add origin https://github.com/YOUR_USERNAME/portal-fusion.git"
echo "    git push -u origin main"
echo ""
echo "    Or if using SSH:"
echo "    git remote add origin git@github.com:YOUR_USERNAME/portal-fusion.git"
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
echo "🎨 Brand Colors:"
echo "    Primary PC: #2563EB (Deep Blue)"
echo "    Primary Mac: #8B5CF6 (Vibrant Purple)"
echo "    Fusion: #2563EB → #6366F1 → #8B5CF6"
echo ""
echo "🎉 Your Portal Fusion project is ready for GitHub!"
