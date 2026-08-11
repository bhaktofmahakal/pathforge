import driver from "./db";
import neo4j, { Integer, Path as Neo4jPath } from "neo4j-driver";

/* ─── Interfaces ─── */

export interface PersonNode {
  login: string;
  name: string;
  avatarUrl: string;
  bio: string;
  company: string;
  location: string;
  followers: number;
  githubUrl: string;
}

export interface RepositoryNode {
  fullName: string;
  name: string;
  description: string;
  url: string;
  stars: number;
  primaryLanguage: string;
  topics: string[];
}

export interface PersonProfile extends PersonNode {
  contributedRepos: Array<
    RepositoryNode & {
      commits: number;
    }
  >;
  topCollaborators: Array<{
    login: string;
    name: string;
    avatarUrl: string;
    sharedRepos: number;
  }>;
}

export interface PathNode {
  login: string;
  name: string;
  avatarUrl: string;
}

export interface PathLink {
  source: string;
  target: string;
  sharedRepos: number;
}

export interface GraphPathResult {
  hops: number;
  nodes: PathNode[];
  links: PathLink[];
  pathSegments: Array<{
    from: PathNode;
    to: PathNode;
    sharedRepos: number;
  }>;
}

export interface ConnectorResult {
  login: string;
  name: string;
  avatarUrl: string;
  followers: number;
}

export interface RecommendationResult {
  fullName: string;
  description: string;
  stars: number;
  primaryLanguage: string;
  url: string;
  strength: number;
}

export interface LeaderboardEntry {
  login: string;
  name: string;
  avatarUrl: string;
  company: string;
  connections: number;
}

/* ─── Query 1: Shortest Connection Path ─── */

/**
 * Signature Query 1 — Shortest Connection Path (Flagship multi-hop traversal)
 * Traverses CO_AUTHORED_WITH edges up to 6 hops between two contributors.
 */
export async function getShortestPath(
  fromLogin: string,
  toLogin: string
): Promise<GraphPathResult | null> {
  const session = driver.session({ defaultAccessMode: neo4j.session.READ });
  try {
    const result = await session.run(
      `MATCH (a:Person {login: $fromLogin}), (b:Person {login: $toLogin})
       MATCH path = shortestPath((a)-[:CO_AUTHORED_WITH*..6]-(b))
       RETURN path, length(path) AS hops`,
      { fromLogin, toLogin }
    );

    if (result.records.length === 0) return null;

    const record = result.records[0];
    const hops = (record.get("hops") as Integer).toNumber();
    const rawPath = record.get("path") as Neo4jPath;

    const nodesMap = new Map<string, PathNode>();
    const links: PathLink[] = [];
    const pathSegments: GraphPathResult["pathSegments"] = [];

    const addPersonNode = (props: Record<string, unknown>) => {
      const login = String(props.login || "");
      if (login && !nodesMap.has(login)) {
        nodesMap.set(login, {
          login,
          name: String(props.name || props.login || ""),
          avatarUrl: String(props.avatarUrl || `https://github.com/${login}.png`),
        });
      }
    };

    if (rawPath.start) addPersonNode(rawPath.start.properties);
    if (rawPath.end) addPersonNode(rawPath.end.properties);

    // Parse path segments & links
    const segments = Array.isArray(rawPath.segments) ? rawPath.segments : [];
    for (const segment of segments) {
      const startProps = segment.start?.properties || {};
      const endProps = segment.end?.properties || {};
      const relProps = segment.relationship?.properties || {};

      addPersonNode(startProps);
      addPersonNode(endProps);

      const fromNode: PathNode = {
        login: String(startProps.login || ""),
        name: String(startProps.name || startProps.login || ""),
        avatarUrl: String(startProps.avatarUrl || ""),
      };

      const toNode: PathNode = {
        login: String(endProps.login || ""),
        name: String(endProps.name || endProps.login || ""),
        avatarUrl: String(endProps.avatarUrl || ""),
      };

      const sharedRepos =
        typeof relProps.sharedRepos === "number"
          ? relProps.sharedRepos
          : (relProps.sharedRepos as Integer)?.toNumber?.() ?? 1;

      links.push({
        source: fromNode.login,
        target: toNode.login,
        sharedRepos,
      });

      pathSegments.push({
        from: fromNode,
        to: toNode,
        sharedRepos,
      });
    }

    return {
      hops,
      nodes: Array.from(nodesMap.values()),
      links,
      pathSegments,
    };
  } finally {
    await session.close();
  }
}

/* ─── Query 2: Who Can Introduce Me ─── */

/**
 * Signature Query 2 — Who can introduce me (2-hop mutual connector)
 * Finds bridge people connected to both me and the target person.
 */
export async function getConnectors(
  myLogin: string,
  targetLogin: string
): Promise<ConnectorResult[]> {
  const session = driver.session({ defaultAccessMode: neo4j.session.READ });
  try {
    const result = await session.run(
      `MATCH (me:Person {login: $myLogin})-[:CO_AUTHORED_WITH]-(bridge:Person)
             -[:CO_AUTHORED_WITH]-(target:Person {login: $targetLogin})
       WHERE NOT (me)-[:CO_AUTHORED_WITH]-(target) AND me <> target
       RETURN DISTINCT bridge.login AS login,
                       bridge.name AS name,
                       bridge.avatarUrl AS avatarUrl,
                       bridge.followers AS followers
       ORDER BY bridge.followers DESC
       LIMIT 10`,
      { myLogin, targetLogin }
    );

    return result.records.map((record) => ({
      login: record.get("login"),
      name: record.get("name") || record.get("login"),
      avatarUrl: record.get("avatarUrl") || `https://github.com/${record.get("login")}.png`,
      followers: (record.get("followers") as Integer)?.toNumber?.() ?? 0,
    }));
  } finally {
    await session.close();
  }
}

/* ─── Query 3: Repo Recommendations ─── */

/**
 * Signature Query 3 — Repo recommendation via variable-length collaboration path
 * (Demonstrates query awkward for relational DBs: variable-length traversal + exclusion + aggregation)
 */
export async function getRecommendations(
  login: string
): Promise<RecommendationResult[]> {
  const session = driver.session({ defaultAccessMode: neo4j.session.READ });
  try {
    const result = await session.run(
      `MATCH (me:Person {login: $login})-[:CO_AUTHORED_WITH*1..2]-(co:Person)
       MATCH (co)-[:CONTRIBUTED_TO]->(rec:Repository)
       WHERE NOT (me)-[:CONTRIBUTED_TO]->(rec) AND me <> co
       RETURN DISTINCT rec.fullName AS fullName,
                       rec.description AS description,
                       rec.stars AS stars,
                       rec.primaryLanguage AS primaryLanguage,
                       rec.url AS url,
                       count(DISTINCT co) AS strength
       ORDER BY strength DESC, stars DESC
       LIMIT 10`,
      { login }
    );

    return result.records.map((record) => ({
      fullName: record.get("fullName"),
      description: record.get("description") || "",
      stars: (record.get("stars") as Integer)?.toNumber?.() ?? 0,
      primaryLanguage: record.get("primaryLanguage") || "TypeScript",
      url: record.get("url") || `https://github.com/${record.get("fullName")}`,
      strength: (record.get("strength") as Integer)?.toNumber?.() ?? 0,
    }));
  } finally {
    await session.close();
  }
}

/* ─── Query 4: Most-Connected People Leaderboard ─── */

/**
 * Signature Query 4 — Most-connected people (degree centrality on CO_AUTHORED_WITH)
 */
export async function getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const session = driver.session({ defaultAccessMode: neo4j.session.READ });
  try {
    const result = await session.run(
      `MATCH (p:Person)-[r:CO_AUTHORED_WITH]-()
       RETURN p.login AS login,
              p.name AS name,
              p.avatarUrl AS avatarUrl,
              p.company AS company,
              count(DISTINCT r) AS connections
       ORDER BY connections DESC
       LIMIT $limit`,
      { limit: neo4j.int(limit) }
    );

    return result.records.map((record) => ({
      login: record.get("login"),
      name: record.get("name") || record.get("login"),
      avatarUrl: record.get("avatarUrl") || `https://github.com/${record.get("login")}.png`,
      company: record.get("company") || "",
      connections: (record.get("connections") as Integer)?.toNumber?.() ?? 0,
    }));
  } finally {
    await session.close();
  }
}

/* ─── Helper: Person Profile ─── */

export async function getPersonProfile(login: string): Promise<PersonProfile | null> {
  const session = driver.session({ defaultAccessMode: neo4j.session.READ });
  try {
    const result = await session.run(
      `MATCH (p:Person {login: $login})
       OPTIONAL MATCH (p)-[c:CONTRIBUTED_TO]->(r:Repository)
       WITH p, collect({
         fullName: r.fullName,
         name: r.name,
         description: r.description,
         url: r.url,
         stars: r.stars,
         primaryLanguage: r.primaryLanguage,
         topics: r.topics,
         commits: c.commits
       }) AS repos
       OPTIONAL MATCH (p)-[co:CO_AUTHORED_WITH]-(other:Person)
       WITH p, repos, other, co.sharedRepos AS sharedRepos
       ORDER BY sharedRepos DESC
       WITH p, repos, collect(DISTINCT {
         login: other.login,
         name: other.name,
         avatarUrl: other.avatarUrl,
         sharedRepos: sharedRepos
       })[0..6] AS topCollaborators
       RETURN p, repos, topCollaborators`,
      { login }
    );

    if (result.records.length === 0 || !result.records[0].get("p")) {
      return null;
    }

    const pProps = result.records[0].get("p").properties;
    const rawRepos = result.records[0].get("repos") as Array<Record<string, unknown>>;
    const rawCollabs = (result.records[0].get("topCollaborators") || []) as Array<Record<string, unknown>>;

    const contributedRepos = rawRepos
      .filter((repo) => repo && repo.fullName)
      .map((repo) => ({
        fullName: String(repo.fullName),
        name: String(repo.name || repo.fullName),
        description: String(repo.description || ""),
        url: String(repo.url || ""),
        stars: (repo.stars as Integer)?.toNumber?.() ?? Number(repo.stars || 0),
        primaryLanguage: String(repo.primaryLanguage || "TypeScript"),
        topics: Array.isArray(repo.topics) ? repo.topics.map(String) : [],
        commits: (repo.commits as Integer)?.toNumber?.() ?? Number(repo.commits || 1),
      }));

    const topCollaborators = rawCollabs
      .filter((collab) => collab && collab.login)
      .map((collab) => ({
        login: String(collab.login),
        name: String(collab.name || collab.login),
        avatarUrl: String(collab.avatarUrl || `https://github.com/${collab.login}.png`),
        sharedRepos: (collab.sharedRepos as Integer)?.toNumber?.() ?? Number(collab.sharedRepos || 1),
      }));

    return {
      login: String(pProps.login),
      name: String(pProps.name || pProps.login),
      avatarUrl: String(pProps.avatarUrl || `https://github.com/${pProps.login}.png`),
      bio: String(pProps.bio || ""),
      company: String(pProps.company || ""),
      location: String(pProps.location || ""),
      followers: (pProps.followers as Integer)?.toNumber?.() ?? Number(pProps.followers || 0),
      githubUrl: String(pProps.githubUrl || `https://github.com/${pProps.login}`),
      contributedRepos,
      topCollaborators,
    };
  } finally {
    await session.close();
  }
}

/* ─── Helper: Search People ─── */

export async function searchPeople(query: string, limit = 8): Promise<PathNode[]> {
  if (!query || query.trim().length < 2) return [];

  const session = driver.session({ defaultAccessMode: neo4j.session.READ });
  try {
    const result = await session.run(
      `MATCH (p:Person)
       WHERE toLower(p.login) CONTAINS toLower($query) OR toLower(p.name) CONTAINS toLower($query)
       RETURN p.login AS login, p.name AS name, p.avatarUrl AS avatarUrl
       LIMIT $limit`,
      { query: query.trim(), limit: neo4j.int(limit) }
    );

    return result.records.map((r) => ({
      login: r.get("login"),
      name: r.get("name") || r.get("login"),
      avatarUrl: r.get("avatarUrl") || `https://github.com/${r.get("login")}.png`,
    }));
  } finally {
    await session.close();
  }
}
