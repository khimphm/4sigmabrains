import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1790000000000 implements MigrationInterface {
  name = 'CreateUsers1790000000000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TYPE "user_role" AS ENUM ('ADMIN', 'MANAGER', 'MEMBER')`,
    );
    await q.query(
      `CREATE TYPE "user_status" AS ENUM ('PENDING', 'ACTIVE', 'DISABLED')`,
    );
    await q.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar NOT NULL UNIQUE,
        "google_id" varchar UNIQUE,
        "name" varchar NOT NULL,
        "avatar_url" varchar,
        "role" "user_role" NOT NULL DEFAULT 'MEMBER',
        "status" "user_status" NOT NULL DEFAULT 'PENDING',
        "last_login_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "users"`);
    await q.query(`DROP TYPE "user_status"`);
    await q.query(`DROP TYPE "user_role"`);
  }
}
