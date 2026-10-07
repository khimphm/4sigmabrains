import { MigrationInterface, QueryRunner } from 'typeorm';

export class CoreModules1791089560968 implements MigrationInterface {
  name = 'CoreModules1791089560968';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "activity_logs" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "actor_id" uuid, "entity_type" character varying NOT NULL, "entity_id" uuid NOT NULL, "project_id" uuid, "action" character varying NOT NULL, "summary" character varying NOT NULL, "meta" jsonb NOT NULL DEFAULT '{}', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f25287b6140c5ba18d38776a796" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0adcd018824a041e0f0becab44" ON "activity_logs"  ("project_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_153c3fec7301b8bcc96a0e1537" ON "activity_logs"  ("entity_type", "entity_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."attachment_target" AS ENUM('TASK', 'PROJECT', 'DISCUSSION')`,
    );
    await queryRunner.query(
      `CREATE TABLE "attachments" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "target_type" "public"."attachment_target" NOT NULL, "target_id" uuid NOT NULL, "file_name" character varying NOT NULL, "mime_type" character varying NOT NULL, "size" bigint NOT NULL, "object_key" character varying NOT NULL, "uploader_id" uuid NOT NULL, CONSTRAINT "PK_5e1f050bcff31e3084a1d662412" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_71531a01a179b2d6f62dd7bab9" ON "attachments"  ("target_type", "target_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."project_role" AS ENUM('LEAD', 'MEMBER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "project_members" ("project_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" "public"."project_role" NOT NULL DEFAULT 'MEMBER', "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b3f491d3a3f986106d281d8eb4b" PRIMARY KEY ("project_id", "user_id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."project_status" AS ENUM('ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "key" character varying(10) NOT NULL, "description" text, "color" character varying(9) NOT NULL DEFAULT '#1F4FD1', "status" "public"."project_status" NOT NULL DEFAULT 'ACTIVE', "start_date" date, "due_date" date, "owner_id" uuid NOT NULL, "task_seq" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_63e67599567b2126cfef14e1474" UNIQUE ("key"), CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "decision_votes" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "decision_id" uuid NOT NULL, "option_id" uuid NOT NULL, "user_id" uuid NOT NULL, "comment" text, CONSTRAINT "UQ_41ffa61d0fd26ec1e4e7f852597" UNIQUE ("decision_id", "user_id"), CONSTRAINT "PK_bcdff3f4ffb1bf4542a6920742e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."decision_status" AS ENUM('OPEN', 'DECIDED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "decisions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "project_id" uuid, "title" character varying NOT NULL, "context" text NOT NULL, "status" "public"."decision_status" NOT NULL DEFAULT 'OPEN', "due_date" TIMESTAMP WITH TIME ZONE, "owner_id" uuid NOT NULL, "chosen_option_id" uuid, "rationale" text, "decided_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_48eee6fa229cd5e43648f6a2ec3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "decision_options" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "decision_id" uuid NOT NULL, "title" character varying NOT NULL, "description" text, "pros" text array NOT NULL DEFAULT '{}', "cons" text array NOT NULL DEFAULT '{}', "position" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_1719ea2db0b0362b07d237720ed" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "discussions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "project_id" uuid, "title" character varying NOT NULL, "body" text NOT NULL, "author_id" uuid NOT NULL, "mention_ids" uuid array NOT NULL DEFAULT '{}', "pinned" boolean NOT NULL DEFAULT false, "reply_count" integer NOT NULL DEFAULT '0', "last_activity_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4b3d110d8e5d9077ddc0a0d1b4c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bed5143a22cd95ad33e14605e4" ON "discussions"  ("project_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "discussion_replies" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "discussion_id" uuid NOT NULL, "author_id" uuid NOT NULL, "body" text NOT NULL, "mention_ids" uuid array NOT NULL DEFAULT '{}', CONSTRAINT "PK_4edf52f48af13c113eb7b1bb518" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e3ea46ba52dba54bcec7394aa5" ON "discussion_replies"  ("discussion_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_type" AS ENUM('TASK_ASSIGNED', 'TASK_DUE_SOON', 'TASK_OVERDUE', 'TASK_STATUS_CHANGED', 'TASK_COMMENTED', 'MENTIONED', 'DISCUSSION_REPLY', 'DECISION_CREATED', 'DECISION_MADE', 'PROJECT_ADDED', 'MEMBER_PENDING', 'ACCOUNT_APPROVED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "actor_id" uuid, "type" "public"."notification_type" NOT NULL, "title" character varying NOT NULL, "body" text, "link" character varying, "read_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5323ccd23482802bd9759e88ee" ON "notifications"  ("user_id", "read_at") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."task_status" AS ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."task_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "project_id" uuid NOT NULL, "number" integer NOT NULL, "title" character varying NOT NULL, "description" text, "status" "public"."task_status" NOT NULL DEFAULT 'TODO', "priority" "public"."task_priority" NOT NULL DEFAULT 'MEDIUM', "assignee_id" uuid, "reporter_id" uuid NOT NULL, "start_date" date, "due_date" TIMESTAMP WITH TIME ZONE, "completed_at" TIMESTAMP WITH TIME ZONE, "labels" text array NOT NULL DEFAULT '{}', "position" double precision NOT NULL DEFAULT '0', "reminder_sent_at" TIMESTAMP WITH TIME ZONE, "overdue_notified_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_855d484825b715c545349212c7" ON "tasks"  ("assignee_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_707cfc415c7c12d38dfc2ec8eb" ON "tasks"  ("due_date") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_10434cf29644a4a93a76858a96" ON "tasks"  ("project_id", "number") `,
    );
    await queryRunner.query(
      `CREATE TABLE "task_checklist_items" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "task_id" uuid NOT NULL, "content" character varying NOT NULL, "done" boolean NOT NULL DEFAULT false, "position" double precision NOT NULL DEFAULT '0', CONSTRAINT "PK_4e4ad2f667e6a79aa843ba5cc8c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "task_comments" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "task_id" uuid NOT NULL, "author_id" uuid NOT NULL, "body" text NOT NULL, "mention_ids" uuid array NOT NULL DEFAULT '{}', CONSTRAINT "PK_83b99b0b03db29d4cafcb579b77" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ba9e465cfc707006e60aae5994" ON "task_comments"  ("task_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "title" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "department" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "phone" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "bio" text`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "email_notifications" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_d4a993f3a163eca3d27ffee1361" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" ADD CONSTRAINT "FK_73407cf2d2a0e64546bacf309a7" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" ADD CONSTRAINT "FK_b5729113570c20c7e214cf3f58d" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" ADD CONSTRAINT "FK_e89aae80e010c2faa72e6a49ce8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_b1bd2fbf5d0ef67319c91acb5cf" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "decision_votes" ADD CONSTRAINT "FK_049936fdac4137660200a385d2b" FOREIGN KEY ("decision_id") REFERENCES "decisions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "decision_votes" ADD CONSTRAINT "FK_6afd17853fda28267d69c973cc2" FOREIGN KEY ("option_id") REFERENCES "decision_options"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "decision_votes" ADD CONSTRAINT "FK_f602470f5255a26beee03ac8809" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "decisions" ADD CONSTRAINT "FK_7941d1cb97d56e12ec59f4b1393" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "decisions" ADD CONSTRAINT "FK_ff40af78cc82719d09bf4f3dc5a" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "decision_options" ADD CONSTRAINT "FK_a18e6776e0f4989c15b85d15a47" FOREIGN KEY ("decision_id") REFERENCES "decisions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "discussions" ADD CONSTRAINT "FK_bed5143a22cd95ad33e14605e4e" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "discussions" ADD CONSTRAINT "FK_cedb0b583906c7f01fc7bd4972c" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "discussion_replies" ADD CONSTRAINT "FK_e3ea46ba52dba54bcec7394aa55" FOREIGN KEY ("discussion_id") REFERENCES "discussions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "discussion_replies" ADD CONSTRAINT "FK_58982359a1aa87d51e829beaaca" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_20f8b51fd9655c0b69feed5efc6" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_9eecdb5b1ed8c7c2a1b392c28d4" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_855d484825b715c545349212c7f" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_87d662c4ff7beec6ad017466fc4" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_checklist_items" ADD CONSTRAINT "FK_16eac8446e23230a0e7f3586bcb" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_comments" ADD CONSTRAINT "FK_ba9e465cfc707006e60aae59946" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_comments" ADD CONSTRAINT "FK_76901a920ba9ec5be8dbd64d747" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task_comments" DROP CONSTRAINT "FK_76901a920ba9ec5be8dbd64d747"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_comments" DROP CONSTRAINT "FK_ba9e465cfc707006e60aae59946"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_checklist_items" DROP CONSTRAINT "FK_16eac8446e23230a0e7f3586bcb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_87d662c4ff7beec6ad017466fc4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_855d484825b715c545349212c7f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_9eecdb5b1ed8c7c2a1b392c28d4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_20f8b51fd9655c0b69feed5efc6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discussion_replies" DROP CONSTRAINT "FK_58982359a1aa87d51e829beaaca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discussion_replies" DROP CONSTRAINT "FK_e3ea46ba52dba54bcec7394aa55"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discussions" DROP CONSTRAINT "FK_cedb0b583906c7f01fc7bd4972c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discussions" DROP CONSTRAINT "FK_bed5143a22cd95ad33e14605e4e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "decision_options" DROP CONSTRAINT "FK_a18e6776e0f4989c15b85d15a47"`,
    );
    await queryRunner.query(
      `ALTER TABLE "decisions" DROP CONSTRAINT "FK_ff40af78cc82719d09bf4f3dc5a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "decisions" DROP CONSTRAINT "FK_7941d1cb97d56e12ec59f4b1393"`,
    );
    await queryRunner.query(
      `ALTER TABLE "decision_votes" DROP CONSTRAINT "FK_f602470f5255a26beee03ac8809"`,
    );
    await queryRunner.query(
      `ALTER TABLE "decision_votes" DROP CONSTRAINT "FK_6afd17853fda28267d69c973cc2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "decision_votes" DROP CONSTRAINT "FK_049936fdac4137660200a385d2b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT "FK_b1bd2fbf5d0ef67319c91acb5cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" DROP CONSTRAINT "FK_e89aae80e010c2faa72e6a49ce8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" DROP CONSTRAINT "FK_b5729113570c20c7e214cf3f58d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" DROP CONSTRAINT "FK_73407cf2d2a0e64546bacf309a7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_d4a993f3a163eca3d27ffee1361"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "email_notifications"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bio"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "department"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "title"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ba9e465cfc707006e60aae5994"`,
    );
    await queryRunner.query(`DROP TABLE "task_comments"`);
    await queryRunner.query(`DROP TABLE "task_checklist_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_10434cf29644a4a93a76858a96"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_707cfc415c7c12d38dfc2ec8eb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_855d484825b715c545349212c7"`,
    );
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TYPE "public"."task_priority"`);
    await queryRunner.query(`DROP TYPE "public"."task_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5323ccd23482802bd9759e88ee"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notification_type"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e3ea46ba52dba54bcec7394aa5"`,
    );
    await queryRunner.query(`DROP TABLE "discussion_replies"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bed5143a22cd95ad33e14605e4"`,
    );
    await queryRunner.query(`DROP TABLE "discussions"`);
    await queryRunner.query(`DROP TABLE "decision_options"`);
    await queryRunner.query(`DROP TABLE "decisions"`);
    await queryRunner.query(`DROP TYPE "public"."decision_status"`);
    await queryRunner.query(`DROP TABLE "decision_votes"`);
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TYPE "public"."project_status"`);
    await queryRunner.query(`DROP TABLE "project_members"`);
    await queryRunner.query(`DROP TYPE "public"."project_role"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_71531a01a179b2d6f62dd7bab9"`,
    );
    await queryRunner.query(`DROP TABLE "attachments"`);
    await queryRunner.query(`DROP TYPE "public"."attachment_target"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_153c3fec7301b8bcc96a0e1537"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0adcd018824a041e0f0becab44"`,
    );
    await queryRunner.query(`DROP TABLE "activity_logs"`);
  }
}
