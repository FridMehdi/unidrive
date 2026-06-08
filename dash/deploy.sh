#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# Script de déploiement du frontend UDrive sur CloudFront + S3
# ═══════════════════════════════════════════════════════════════════════════════

set -e  # Arrêter en cas d'erreur

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="eu-west-1"
BUCKET_NAME=""
DISTRIBUTION_ID=""

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🚀 Déploiement Frontend UDrive sur CloudFront + S3          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Étape 1: Récupérer les outputs Terraform ──────────────────────────────────
echo -e "${YELLOW}📋 Étape 1/5: Récupération de la configuration Terraform...${NC}"
cd /Users/mahdifrid/projects/vs7/Pocs/udrive-app/udrive-microservices/infrastructure/terraform

BUCKET_NAME=$(terraform output -raw frontend_bucket_name 2>/dev/null || echo "")
DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")

if [ -z "$BUCKET_NAME" ] || [ -z "$DISTRIBUTION_ID" ]; then
  echo -e "${RED}❌ Erreur: Impossible de récupérer les outputs Terraform${NC}"
  echo -e "${YELLOW}   Assurez-vous que cloudfront.tf est déployé${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Configuration récupérée:${NC}"
echo -e "   Bucket: ${GREEN}$BUCKET_NAME${NC}"
echo -e "   Distribution: ${GREEN}$DISTRIBUTION_ID${NC}"
echo ""

# ── Étape 2: Build de l'application Next.js ───────────────────────────────────
cd /Users/mahdifrid/projects/ui-drive/dash

echo -e "${YELLOW}📦 Étape 2/5: Installation des dépendances...${NC}"
npm install

echo -e "${YELLOW}🔨 Étape 3/5: Build de l'application Next.js...${NC}"
npm run build

if [ ! -d "out" ]; then
  echo -e "${RED}❌ Erreur: Le répertoire 'out' n'a pas été créé${NC}"
  echo -e "${YELLOW}   Vérifiez que next.config.ts contient 'output: export'${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Build réussi (répertoire 'out' créé)${NC}"
echo ""

# ── Étape 4: Upload vers S3 ───────────────────────────────────────────────────
echo -e "${YELLOW}☁️  Étape 4/5: Upload vers S3...${NC}"

# Sync vers S3 avec cache headers appropriés
aws s3 sync out/ "s3://$BUCKET_NAME/" \
  --region "$AWS_REGION" \
  --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "*.html" \
  --exclude "*.json"

# HTML et JSON sans cache (pour les mises à jour rapides)
aws s3 sync out/ "s3://$BUCKET_NAME/" \
  --region "$AWS_REGION" \
  --cache-control "public,max-age=0,must-revalidate" \
  --exclude "*" \
  --include "*.html" \
  --include "*.json"

echo -e "${GREEN}✅ Fichiers uploadés sur S3${NC}"
echo ""

# ── Étape 5: Invalidation du cache CloudFront ─────────────────────────────────
echo -e "${YELLOW}🔄 Étape 5/5: Invalidation du cache CloudFront...${NC}"

INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text \
  --region us-east-1)  # CloudFront est toujours en us-east-1

echo -e "${GREEN}✅ Invalidation créée: ${INVALIDATION_ID}${NC}"
echo -e "${YELLOW}   (Propagation: 1-5 minutes)${NC}"
echo ""

# ── Résumé ─────────────────────────────────────────────────────────────────────
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Déploiement terminé avec succès !                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Informations de déploiement:${NC}"
echo -e "   • Bucket S3: ${GREEN}$BUCKET_NAME${NC}"
echo -e "   • Distribution CloudFront: ${GREEN}$DISTRIBUTION_ID${NC}"
echo -e "   • URL: ${GREEN}https://app.u-drive.ai${NC}"
echo ""
echo -e "${YELLOW}⏳ Attendez 2-5 minutes pour la propagation du cache...${NC}"
echo ""
echo -e "${BLUE}🔗 Liens utiles:${NC}"
echo -e "   • Frontend: ${GREEN}https://app.u-drive.ai${NC}"
echo -e "   • API: ${GREEN}https://api.u-drive.ai${NC}"
echo -e "   • CloudFront Console: ${BLUE}https://console.aws.amazon.com/cloudfront/home?region=us-east-1#/distributions/${DISTRIBUTION_ID}${NC}"
echo ""
