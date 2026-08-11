# PathForge — OSS Contributor Connection Graph
> **Build a Graph Database Application** · Wexa AI Take-Home Assignment (Assignment 2)  
> Powered by **CognoDB Cloud** (openCypher over Bolt protocol) & **Next.js 16 App Router**  
> **Live Demo**: [https://pathforge-gilt.vercel.app](https://pathforge-gilt.vercel.app) · **GitHub**: [https://github.com/bhaktofmahakal/pathforge](https://github.com/bhaktofmahakal/pathforge)

---

## 🎯 Product Use Case: What is PathForge Used For?

### The Problem
In open-source software development, reaching key maintainers (e.g. core maintainers of React, Vite, Next.js, or Babel) is difficult. Traditional developer platforms like GitHub display repositories and star counts, but they **cannot answer multi-hop network questions**:
- *"How am I connected to a maintainer I want to reach?"*
- *"Who in my network has co-authored code with both me and them to give me a warm introduction?"*
- *"What repositories are people 1–2 hops out in my developer graph contributing to that I haven't discovered yet?"*

### The Solution: LinkedIn's "How You're Connected" for Open Source
**PathForge** is an open-source contributor graph intelligence platform. It maps 620+ maintainers and 25 core repositories into a graph database to power 4 core real-world developer workflows:

1. 🤝 **Warm Introductions (Bridge Connectors)**: Want an intro to a target maintainer? PathForge finds 2-hop mutual collaborators who have co-authored code with both of you and ranks them by follower influence.
2. 🔗 **Shortest Collaboration Path (Multi-hop Traversal)**: Finds the exact chain of shared repository contributions connecting any two developers across 1 to 6 hops, visualized as a workflow node pipeline.
3. 🚀 **Graph-Based Repository Discovery**: Recommends repositories being built 1–2 hops out in your collaboration network, superior to generic star-count rankings.
4. 🏆 **Network Centrality Leaderboard**: Identifies key open-source ecosystem maintainers ranked by degree centrality across shared repositories.

---

## 1. Overview & Core Features

- 🔍 **Contributor Search & Profiles**: Typeahead search over 620+ open-source contributors with commit counts, company, location, bio, and real GitHub follower counts.
- 🔗 **Shortest Connection Path**: 2+ hop graph traversal finding the shortest collaboration chain between any two contributors.
- 🤝 **Bridge Connectors ("Who Can Introduce Me")**: Ranks 2-hop mutual collaborators who can introduce you to a target contributor.
- 🚀 **Graph Repo Recommendations**: Recommends open-source repositories based on 1..2 hop network collaboration paths.
- 🏆 **Most-Connected Leaderboard**: Ranks top contributors by network degree centrality on shared repository co-authorships.

---

## 2. Why a Graph Database?

A relational database models this domain as a `contributions(person_id, repo_id)` join table. Two fundamental categories of queries break down in SQL:

### 1. Variable-Depth Path Finding
Finding the shortest connection between Person A and Person B requires an unknown number of hops. In SQL, this requires a recursive Common Table Expression (CTE) with manual cycle detection. As graph depth increases, every hop adds another join across a growing intermediate table — causing query execution time and memory footprint to grow exponentially.

In **openCypher**, `shortestPath((a)-[:CO_AUTHORED_WITH*..6]-(b))` is a single line. The CognoDB graph engine walks memory pointers directly from node to node without join table lookups, completing multi-hop path traversals in single-digit milliseconds.

### 2. Pattern-Shaped Queries with Unknown Cardinality
Finding *"repositories you don't contribute to yet, but people 1–2 hops out from you do"* requires combining relationship-existence checks, exclusions, and aggregations across variable-length paths. In SQL, this requires multiple self-joins combined with `NOT EXISTS` subqueries that are verbose, prone to logical errors, and produce poor query execution plans.

In **openCypher**, this is a single, readable pattern match:
```cypher
MATCH (me:Person {login: $login})-[:CO_AUTHORED_WITH*1..2]-(co:Person)
MATCH (co)-[:CONTRIBUTED_TO]->(rec:Repository)
WHERE NOT (me)-[:CONTRIBUTED_TO]->(rec) AND me <> co
RETURN DISTINCT rec.fullName, count(DISTINCT co) AS strength
ORDER BY strength DESC
```

---

## 3. Data Model

### Nodes & Properties
- **`(:Person)`**: `login` (unique key), `name`, `avatarUrl`, `bio`, `company`, `location`, `followers`, `githubUrl`
- **`(:Repository)`**: `fullName` (unique key, e.g. `"vercel/next.js"`), `name`, `description`, `url`, `stars`, `primaryLanguage`, `topics`

### Relationships
- **`(:Person)-[:CONTRIBUTED_TO {commits, ingestedAt}]->(:Repository)`**: Direct contribution edge from a contributor to a repository.
- **`(:Person)-[:CO_AUTHORED_WITH {sharedRepos, updatedAt}]-(:Person)`**: Precomputed weighted collaboration edge between contributors who co-authored one or more repositories.

### Schema Constraints & Indexes
```cypher
CREATE CONSTRAINT person_login_unique IF NOT EXISTS FOR (p:Person) REQUIRE p.login IS UNIQUE;
CREATE CONSTRAINT repo_fullname_unique IF NOT EXISTS FOR (r:Repository) REQUIRE r.fullName IS UNIQUE;
CREATE INDEX person_login_idx IF NOT EXISTS FOR (p:Person) ON (p.login);
CREATE INDEX repo_fullname_idx IF NOT EXISTS FOR (r:Repository) ON (r.fullName);
```

---

## 4. Main Cypher Queries Explained

All Cypher queries run through `neo4j-driver` using **100% parameterized queries** (`session.run(cypher, params)`). No string-concatenated Cypher is used anywhere in the codebase.

### Query 1 — Shortest Connection Path (Multi-hop Traversal)
```cypher
MATCH (a:Person {login: $fromLogin}), (b:Person {login: $toLogin})
MATCH path = shortestPath((a)-[:CO_AUTHORED_WITH*..6]-(b))
RETURN path, length(path) AS hops
```
- **Purpose**: Powers `/path` page. Finds the shortest path up to 6 hops connecting two contributors.

### Query 2 — Bridge Connectors ("Who Can Introduce Me")
```cypher
MATCH (me:Person {login: $myLogin})-[:CO_AUTHORED_WITH]-(bridge:Person)
      -[:CO_AUTHORED_WITH]-(target:Person {login: $targetLogin})
WHERE NOT (me)-[:CO_AUTHORED_WITH]-(target) AND me <> target
RETURN DISTINCT bridge.login AS login, bridge.name AS name, bridge.avatarUrl AS avatarUrl, bridge.followers AS followers
ORDER BY bridge.followers DESC
LIMIT 10
```
- **Purpose**: Powers `/connect` page. Ranks 2-hop mutual collaborators who connect `me` to `target`.

### Query 3 — Variable-Length Network Repo Recommendations
```cypher
MATCH (me:Person {login: $login})-[:CO_AUTHORED_WITH*1..2]-(co:Person)
MATCH (co)-[:CONTRIBUTED_TO]->(rec:Repository)
WHERE NOT (me)-[:CONTRIBUTED_TO]->(rec) AND me <> co
RETURN DISTINCT rec.fullName AS fullName, rec.description AS description, rec.stars AS stars, rec.primaryLanguage AS primaryLanguage, rec.url AS url, count(DISTINCT co) AS strength
ORDER BY strength DESC, stars DESC
LIMIT 10
```
- **Purpose**: Powers `/recommend` page. Recommends repositories touched by network collaborators 1–2 hops away.

### Query 4 — Network Centrality Leaderboard
```cypher
MATCH (p:Person)-[r:CO_AUTHORED_WITH]-()
RETURN p.login AS login, p.name AS name, p.avatarUrl AS avatarUrl, p.company AS company, count(DISTINCT r) AS connections
ORDER BY connections DESC
LIMIT $limit
```
- **Purpose**: Powers `/leaderboard` page. Ranks contributors by degree centrality.

---

## 5. Setup & Local Run Instructions

### Prerequisites
- Node.js 18+
- CognoDB Cloud free instance (`c0`)
- GitHub Personal Access Token (`public_repo` scope)

### Step 1: Configure Environment Variables
Create `.env.local`:
```ini
COGNODB_URI=bolt+s://db-7edafd2c.databases.cognodb.com:7687
COGNODB_PASSWORD=<your-cognodb-password>
GITHUB_TOKEN=ghp_<your-github-personal-access-token>
```

### Step 2: Install Dependencies & Run Seed Pipeline
```bash
npm install
npm run seed
```

### Step 3: Run Development Server & Build Test
```bash
npm run dev
npm run build
```

---

## 6. License & Submission

Submitted for **Wexa AI Take-Home Assignment 2**.  
Built by **Utsav** using **CognoDB Cloud** and **Next.js**.
