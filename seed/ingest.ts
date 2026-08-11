import fs from "fs";
import path from "path";
import driver from "../src/lib/db";
import { applySchema } from "./schema";

const REPOS_FILE = path.join(__dirname, "repos.json");
const DATA_SNAPSHOT_FILE = path.join(__dirname, "data.json");

interface RepoData {
  fullName: string;
  name: string;
  description: string;
  url: string;
  stars: number;
  primaryLanguage: string;
  topics: string[];
}

interface PersonData {
  login: string;
  name: string;
  avatarUrl: string;
  bio: string;
  company: string;
  location: string;
  followers: number;
  githubUrl: string;
}

interface ContributionData {
  personLogin: string;
  repoFullName: string;
  commits: number;
}

interface SeedSnapshot {
  repositories: RepoData[];
  people: PersonData[];
  contributions: ContributionData[];
}

async function runIngestion() {
  const isOffline = process.argv.includes("--offline");
  const githubToken = process.env.GITHUB_TOKEN;

  console.log("==========================================");
  console.log("  PathForge Data Ingestion Pipeline");
  console.log("==========================================\n");

  await applySchema();

  let snapshot: SeedSnapshot;

  if (isOffline || !githubToken) {
    if (!isOffline && !githubToken) {
      console.warn("⚠️ GITHUB_TOKEN not found in env. Falling back to static seed data (data.json)...");
    } else {
      console.log("📦 Using static offline seed data (data.json)...");
    }

    if (!fs.existsSync(DATA_SNAPSHOT_FILE)) {
      throw new Error(`Data snapshot file not found at ${DATA_SNAPSHOT_FILE}`);
    }

    snapshot = JSON.parse(fs.readFileSync(DATA_SNAPSHOT_FILE, "utf-8"));
  } else {
    console.log("🚀 Starting live ingestion via GitHub REST API...");
    const headers = {
      Authorization: `token ${githubToken}`,
      "User-Agent": "PathForge-Seed-Script",
      Accept: "application/vnd.github.v3+json",
    };

    const reposList: string[] = JSON.parse(fs.readFileSync(REPOS_FILE, "utf-8"));
    const reposMap = new Map<string, RepoData>();
    const peopleMap = new Map<string, PersonData>();
    const contributions: ContributionData[] = [];

    let count = 0;
    for (const repoFullName of reposList) {
      count++;
      console.log(`[${count}/${reposList.length}] Fetching ${repoFullName}...`);

      try {
        // 1. Repo Metadata
        const repoRes = await fetch(`https://api.github.com/repos/${repoFullName}`, { headers });
        if (!repoRes.ok) {
          console.warn(`  ⚠️ Failed to fetch repo ${repoFullName}: ${repoRes.statusText}`);
          continue;
        }
        const repoDataJson = (await repoRes.json()) as {
          full_name: string;
          name: string;
          description: string;
          html_url: string;
          stargazers_count: number;
          language: string;
          topics: string[];
        };

        const repoData: RepoData = {
          fullName: repoDataJson.full_name,
          name: repoDataJson.name,
          description: repoDataJson.description || "",
          url: repoDataJson.html_url,
          stars: repoDataJson.stargazers_count,
          primaryLanguage: repoDataJson.language || "TypeScript",
          topics: repoDataJson.topics || [],
        };
        reposMap.set(repoData.fullName, repoData);

        // 2. Repo Contributors
        const contribRes = await fetch(
          `https://api.github.com/repos/${repoFullName}/contributors?per_page=30`,
          { headers }
        );
        if (!contribRes.ok) continue;

        const contribsList = (await contribRes.json()) as Array<{
          login: string;
          type: string;
          contributions: number;
          avatar_url: string;
          html_url: string;
        }>;

        for (const contrib of contribsList) {
          if (!contrib.login || contrib.type === "Bot") continue;

          contributions.push({
            personLogin: contrib.login,
            repoFullName: repoData.fullName,
            commits: contrib.contributions,
          });

          if (!peopleMap.has(contrib.login)) {
            peopleMap.set(contrib.login, {
              login: contrib.login,
              name: contrib.login,
              avatarUrl: contrib.avatar_url || `https://github.com/${contrib.login}.png`,
              bio: "",
              company: "",
              location: "",
              followers: 0,
              githubUrl: contrib.html_url || `https://github.com/${contrib.login}`,
            });
          }
        }
      } catch (err) {
        console.warn(`  ⚠️ Skipped ${repoFullName}: ${(err as Error).message}`);
      }
    }

    // 3. Person Enrichment
    console.log(`\nEnriching ${peopleMap.size} contributor profiles...`);
    let personCount = 0;
    for (const [login, person] of peopleMap.entries()) {
      personCount++;
      if (personCount % 15 === 0) {
        console.log(`  Enriched ${personCount}/${peopleMap.size} users...`);
      }
      try {
        const userRes = await fetch(`https://api.github.com/users/${login}`, { headers });
        if (userRes.ok) {
          const uData = (await userRes.json()) as {
            name: string;
            bio: string;
            company: string;
            location: string;
            followers: number;
          };
          person.name = uData.name || person.login;
          person.bio = uData.bio || "";
          person.company = uData.company || "";
          person.location = uData.location || "";
          person.followers = uData.followers || 0;
        }
      } catch {
        /* proceed with defaults if lookup fails */
      }
    }

    snapshot = {
      repositories: Array.from(reposMap.values()),
      people: Array.from(peopleMap.values()),
      contributions,
    };

    // Save offline backup
    fs.writeFileSync(DATA_SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
    console.log(`\n💾 Saved snapshot to ${DATA_SNAPSHOT_FILE}`);
  }

  // 4. Batch Load into CognoDB Graph Database
  console.log("\n📥 Ingesting nodes and relationships into CognoDB...");
  const session = driver.session();

  try {
    // Ingest Repositories via UNWIND batch
    console.log(`  Writing ${snapshot.repositories.length} Repository nodes (batch)...`);
    await session.run(
      `UNWIND $batch AS repo
       MERGE (r:Repository {fullName: repo.fullName})
       SET r.name = repo.name,
           r.description = repo.description,
           r.url = repo.url,
           r.stars = repo.stars,
           r.primaryLanguage = repo.primaryLanguage,
           r.topics = repo.topics`,
      { batch: snapshot.repositories }
    );

    // Ingest People via UNWIND batch
    console.log(`  Writing ${snapshot.people.length} Person nodes (batch)...`);
    await session.run(
      `UNWIND $batch AS person
       MERGE (p:Person {login: person.login})
       SET p.name = person.name,
           p.avatarUrl = person.avatarUrl,
           p.bio = person.bio,
           p.company = person.company,
           p.location = person.location,
           p.followers = person.followers,
           p.githubUrl = person.githubUrl`,
      { batch: snapshot.people }
    );

    // Ingest CONTRIBUTED_TO Relationships via UNWIND batch
    console.log(`  Writing ${snapshot.contributions.length} CONTRIBUTED_TO relationships (batch)...`);
    await session.run(
      `UNWIND $batch AS contrib
       MATCH (p:Person {login: contrib.personLogin})
       MATCH (r:Repository {fullName: contrib.repoFullName})
       MERGE (p)-[c:CONTRIBUTED_TO]->(r)
       SET c.commits = contrib.commits,
           c.ingestedAt = datetime()`,
      { batch: snapshot.contributions }
    );

    // 5. Derive CO_AUTHORED_WITH weighted edges
    console.log("  Deriving weighted CO_AUTHORED_WITH relationships between co-contributors...");
    const coAuthorResult = await session.run(
      `MATCH (p1:Person)-[:CONTRIBUTED_TO]->(r:Repository)<-[:CONTRIBUTED_TO]-(p2:Person)
       WHERE p1.login < p2.login
       WITH p1, p2, count(DISTINCT r) AS sharedRepos
       MERGE (p1)-[c1:CO_AUTHORED_WITH]-(p2)
       SET c1.sharedRepos = sharedRepos,
           c1.updatedAt = datetime()
       RETURN count(c1) AS coAuthorships`
    );

    const coAuthorsCount = coAuthorResult.records[0]?.get("coAuthorships")?.toNumber() ?? 0;

    console.log("\n✅ Ingestion finished successfully!");
    console.log("------------------------------------------");
    console.log(`  Repositories:      ${snapshot.repositories.length}`);
    console.log(`  People:            ${snapshot.people.length}`);
    console.log(`  CONTRIBUTED_TO:    ${snapshot.contributions.length}`);
    console.log(`  CO_AUTHORED_WITH:  ${coAuthorsCount}`);
    console.log("------------------------------------------\n");
  } finally {
    await session.close();
  }
}

runIngestion()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Ingestion failed:", err);
    process.exit(1);
  });
