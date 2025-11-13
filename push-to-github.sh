#!/bin/bash

# Portal Fusion - GitHub Push Script
# This script helps you push the Portal Fusion project to your GitHub repository

echo "================================================"
echo "     Portal Fusion - GitHub Push Assistant      "
echo "================================================"
echo "🌀 Seamless computing, unified"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: Not in Portal Fusion project root${NC}"
    echo "Please run this script from the portal-fusion directory"
    exit 1
fi

echo -e "${GREEN}✅ Git repository detected${NC}"
echo ""

# Show current Git status
echo -e "${BLUE}📊 Current Repository Status:${NC}"
echo "--------------------------------"
git status --short
echo ""

# Show commit history
echo -e "${BLUE}📝 Commit History:${NC}"
echo "--------------------------------"
git log --oneline -5
echo ""

# Check for existing remote
EXISTING_REMOTE=$(git remote get-url origin 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Existing remote detected:${NC} $EXISTING_REMOTE"
    echo ""
    echo "Would you like to:"
    echo "1) Push to existing remote"
    echo "2) Change to a different repository"
    echo "3) Exit"
    read -p "Choose (1/2/3): " choice
    
    case $choice in
        1)
            echo -e "${GREEN}Pushing to existing remote...${NC}"
            ;;
        2)
            read -p "Enter new repository URL (https://github.com/USERNAME/REPO.git): " NEW_REMOTE
            git remote remove origin
            git remote add origin "$NEW_REMOTE"
            echo -e "${GREEN}✅ Remote updated to: $NEW_REMOTE${NC}"
            ;;
        3)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice. Exiting.${NC}"
            exit 1
            ;;
    esac
else
    echo -e "${YELLOW}No remote repository configured.${NC}"
    echo ""
    echo "Please follow these steps:"
    echo ""
    echo -e "${BLUE}Step 1: Create a new repository on GitHub${NC}"
    echo "  1. Go to: https://github.com/new"
    echo "  2. Repository name: portal-fusion"
    echo "  3. Description: Seamless computing, unified - Cross-platform PC to Mac application"
    echo "  4. Make it Public or Private (your choice)"
    echo "  5. DO NOT initialize with README, .gitignore, or license"
    echo "  6. Click 'Create repository'"
    echo ""
    echo -e "${BLUE}Step 2: Copy your repository URL${NC}"
    echo "  It should look like: https://github.com/YOUR_USERNAME/portal-fusion.git"
    echo ""
    read -p "Enter your repository URL: " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        echo -e "${RED}❌ No URL provided. Exiting.${NC}"
        exit 1
    fi
    
    git remote add origin "$REPO_URL"
    echo -e "${GREEN}✅ Remote added: $REPO_URL${NC}"
fi

echo ""
echo -e "${BLUE}📤 Ready to push to GitHub${NC}"
echo "--------------------------------"
echo "This will push all 8 commits:"
echo "  1. Initial monorepo foundation"
echo "  2. GitHub configuration"
echo "  3. Setup helper script"
echo "  4. Portal Fusion rebrand"
echo "  5. CSS and UI system"
echo "  6. Logo component system"
echo "  7. SVG logo assets"
echo "  8. Application metadata"
echo ""

read -p "Do you want to push now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Pushing to GitHub...${NC}"
    
    # Push with progress
    git push -u origin main --progress 2>&1 | while IFS= read -r line; do
        echo "  $line"
    done
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo ""
        echo -e "${GREEN}🎉 Successfully pushed to GitHub!${NC}"
        echo ""
        
        # Get the remote URL and format it for display
        REMOTE_URL=$(git remote get-url origin)
        REPO_URL="${REMOTE_URL%.git}"
        
        # Convert SSH to HTTPS for display if needed
        if [[ $REPO_URL == git@github.com:* ]]; then
            REPO_URL="${REPO_URL/git@github.com:/https://github.com/}"
        fi
        
        echo -e "${GREEN}✨ Your Portal Fusion project is now live at:${NC}"
        echo -e "${BLUE}$REPO_URL${NC}"
        echo ""
        echo -e "${GREEN}📋 Next steps:${NC}"
        echo "  1. Visit your repository: $REPO_URL"
        echo "  2. Add a README description"
        echo "  3. Configure GitHub Actions (already set up!)"
        echo "  4. Enable GitHub Pages for documentation"
        echo "  5. Create releases with tags"
        echo ""
        echo -e "${BLUE}🏷️ To create a release:${NC}"
        echo "  git tag -a v1.0.0 -m \"Initial release\""
        echo "  git push origin v1.0.0"
        echo ""
        echo -e "${YELLOW}⭐ Don't forget to star your repository!${NC}"
    else
        echo ""
        echo -e "${RED}❌ Push failed. Common issues:${NC}"
        echo "  1. Authentication required - Set up SSH keys or use HTTPS with token"
        echo "  2. Repository doesn't exist - Create it on GitHub first"
        echo "  3. Permission denied - Check repository ownership"
        echo ""
        echo -e "${BLUE}For authentication, you can:${NC}"
        echo "  1. Use GitHub CLI: gh auth login"
        echo "  2. Set up SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh"
        echo "  3. Use personal access token: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token"
    fi
else
    echo -e "${YELLOW}Push cancelled. You can run this script again when ready.${NC}"
fi

echo ""
echo "================================================"
echo "     Portal Fusion - GitHub Push Complete       "
echo "================================================"
