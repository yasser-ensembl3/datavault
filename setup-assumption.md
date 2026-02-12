# Setup pour le boss

## 2 étapes

1. Remplace `YOUR_NOTION_TOKEN` par le vrai token Notion (demande à Yasser)
2. Copie le contenu ci-dessous dans `~/.claude/CLAUDE.md` sur ton Mac
   (Si le fichier existe déjà, ajoute le contenu à la fin)

Ensuite ouvre Claude Code et parle normalement. Quand une hypothèse sort, Claude propose de la sauvegarder.

---

## Contenu à copier dans ~/.claude/CLAUDE.md

```markdown
## Research Hypotheses — Notion Integration

Tu es connecté à une database Notion "Assumptions" pour sauvegarder les hypothèses de recherche.

### Config

- API: https://api.notion.com/v1
- Token: YOUR_NOTION_TOKEN
- Database: 30558fe731b181eda996eb03dd645bfb

### Comportement

- Quand une hypothèse, insight ou assumption émerge dans la conversation → demande : "Tu veux que je sauvegarde cette hypothèse ?"
- Quand l'utilisateur dit "save", "sauvegarde", "ajoute hypothèse", "note cette hypothèse" → structure les infos et envoie vers Notion
- Quand l'utilisateur dit "liste mes hypothèses" → récupère depuis Notion
- Quand l'utilisateur dit "valide/invalide l'hypothèse X" → mets à jour le status

### Créer une hypothèse

```bash
curl -s -X POST "https://api.notion.com/v1/pages" \
  -H "Authorization: Bearer YOUR_NOTION_TOKEN" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "parent": { "database_id": "30558fe731b181eda996eb03dd645bfb" },
    "properties": {
      "Name": { "title": [{ "text": { "content": "TITRE DE L HYPOTHESE" } }] },
      "Description": { "rich_text": [{ "text": { "content": "Description détaillée..." } }] },
      "Status": { "select": { "name": "Hypothesis" } },
      "Confidence": { "select": { "name": "Medium" } },
      "Area": { "select": { "name": "Domaine de recherche" } },
      "Evidence": { "rich_text": [{ "text": { "content": "Résumé des preuves..." } }] },
      "Sources": { "rich_text": [{ "text": { "content": "https://lien-vers-source..." } }] },
      "Notes": { "rich_text": [{ "text": { "content": "Notes additionnelles..." } }] }
    }
  }'
```

Champs disponibles :
- Name (obligatoire) : l'énoncé de l'hypothèse
- Description : explication détaillée
- Status : Hypothesis, Testing, Validated, Invalidated, Revised
- Confidence : Low, Medium, High
- Area : domaine (ex: ADHD, LLM, Neuroscience...)
- Evidence : résumé des preuves
- Sources : liens vers papers/articles
- Notes : notes libres

N'inclus que les champs pertinents. Ne force pas à tout remplir.

### Lister les hypothèses

```bash
curl -s -X POST "https://api.notion.com/v1/databases/30558fe731b181eda996eb03dd645bfb/query" \
  -H "Authorization: Bearer YOUR_NOTION_TOKEN" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{ "sorts": [{ "timestamp": "created_time", "direction": "descending" }], "page_size": 20 }'
```

### Mettre à jour une hypothèse

```bash
curl -s -X PATCH "https://api.notion.com/v1/pages/PAGE_ID" \
  -H "Authorization: Bearer YOUR_NOTION_TOKEN" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{ "properties": { "Status": { "select": { "name": "Validated" } } } }'
```

### Ajouter une annexe (lien, note) à une hypothèse existante

```bash
curl -s -X PATCH "https://api.notion.com/v1/blocks/PAGE_ID/children" \
  -H "Authorization: Bearer YOUR_NOTION_TOKEN" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{ "children": [{ "object": "block", "type": "bookmark", "bookmark": { "url": "https://..." } }] }'
```
```
