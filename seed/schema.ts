import driver from "../src/lib/db";

export async function applySchema() {
  const session = driver.session();
  try {
    console.log("Applying CognoDB schema constraints and indexes...");

    // Unique constraint on Person.login
    try {
      await session.run(
        "CREATE CONSTRAINT person_login IF NOT EXISTS FOR (p:Person) REQUIRE p.login IS UNIQUE"
      );
      console.log("  ✓ Constraint: Person.login IS UNIQUE");
    } catch (err) {
      console.log("  ℹ Person constraint note:", (err as Error).message);
    }

    // Unique constraint on Repository.fullName
    try {
      await session.run(
        "CREATE CONSTRAINT repo_fullname IF NOT EXISTS FOR (r:Repository) REQUIRE r.fullName IS UNIQUE"
      );
      console.log("  ✓ Constraint: Repository.fullName IS UNIQUE");
    } catch (err) {
      console.log("  表 Repository constraint note:", (err as Error).message);
    }

    // Index on Repository.primaryLanguage
    try {
      await session.run(
        "CREATE INDEX repo_language IF NOT EXISTS FOR (r:Repository) ON (r.primaryLanguage)"
      );
      console.log("  ✓ Index: Repository(primaryLanguage)");
    } catch (err) {
      console.log("  ℹ Repository index note:", (err as Error).message);
    }

    console.log("Schema constraints successfully applied.\n");
  } finally {
    await session.close();
  }
}

if (require.main === module) {
  applySchema()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Schema application failed:", err);
      process.exit(1);
    });
}
