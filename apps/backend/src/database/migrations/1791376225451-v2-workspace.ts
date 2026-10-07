import { MigrationInterface, QueryRunner } from 'typeorm';

export class V2Workspace1791376225451 implements MigrationInterface {
  name = 'V2Workspace1791376225451';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "contact_name" character varying, "email" character varying, "phone" character varying, "address" character varying, "notes" text, CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_sessions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "user_agent" character varying, "ip" character varying, "method" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "last_seen_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "revoked_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_e93e031a5fed190d4789b6bfd83" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9658e959c490b0a634dfc5478" ON "user_sessions"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "dataset_label_types" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" text, "color" character varying(9) NOT NULL DEFAULT '#F0813F', "position" double precision NOT NULL DEFAULT '0', "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_cbe64987811523bb07bd7fb3247" UNIQUE ("name"), CONSTRAINT "PK_61ed21859b943bbb0f3051bd9e3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "dataset_batches" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" text, "project_id" uuid, "created_by_id" uuid NOT NULL, CONSTRAINT "PK_6abb39b7be2631abaf71dba0194" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."drawing_status" AS ENUM('UNLABELED', 'LABELING', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "dataset_drawings" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "batch_id" uuid NOT NULL, "code" character varying NOT NULL, "title" character varying, "file_name" character varying NOT NULL, "mime_type" character varying NOT NULL, "size" bigint NOT NULL, "object_key" character varying NOT NULL, "page_count" integer NOT NULL DEFAULT '1', "status" "public"."drawing_status" NOT NULL DEFAULT 'UNLABELED', "labeler_id" uuid, "reviewer_id" uuid, "submitted_at" TIMESTAMP WITH TIME ZONE, "reviewed_at" TIMESTAMP WITH TIME ZONE, "review_note" text, CONSTRAINT "PK_e79eea0d41d92268552fcddfe49" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_3c208e7cee93219b61921339cb" ON "dataset_drawings"  ("batch_id", "code") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."annotation_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "dataset_annotations" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "drawing_id" uuid NOT NULL, "label_type_id" uuid NOT NULL, "page" integer NOT NULL DEFAULT '1', "x" double precision NOT NULL, "y" double precision NOT NULL, "width" double precision NOT NULL, "height" double precision NOT NULL, "note" text, "status" "public"."annotation_status" NOT NULL DEFAULT 'PENDING', "author_id" uuid NOT NULL, "reviewed_by_id" uuid, "review_note" text, CONSTRAINT "PK_6a1723d396b4a44f95a5ef49ba7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c41bfafd19fe9930ac69e0f68e" ON "dataset_annotations"  ("drawing_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."opinion_kind" AS ENUM('OPINION', 'QUESTION', 'PROPOSAL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "decision_opinions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "decision_id" uuid NOT NULL, "parent_id" uuid, "kind" "public"."opinion_kind" NOT NULL DEFAULT 'OPINION', "body" text NOT NULL, "mention_ids" uuid array NOT NULL DEFAULT '{}', "author_id" uuid NOT NULL, CONSTRAINT "PK_c256351bda3a394f73647ebff50" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4d3242a54855896f2ce504c95d" ON "decision_opinions"  ("decision_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "decision_opinion_agrees" ("opinion_id" uuid NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ac0d9acefd98dcc970d65388fd6" PRIMARY KEY ("opinion_id", "user_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "settings" ("key" character varying NOT NULL, "value" jsonb NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c8639b7626fa94ba8265628f214" PRIMARY KEY ("key"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "task_watchers" ("task_id" uuid NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a9ea28114ca0842fe549b67e5d4" PRIMARY KEY ("task_id", "user_id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "microsoft_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_a5711ddc02238171575201a0806" UNIQUE ("microsoft_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "github_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_09a2296ade1053a0cc4080bda4a" UNIQUE ("github_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "password_hash" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "totp_secret" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "totp_enabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "skills" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "client_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "web_notifications" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "remind_24h" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "remind_2h" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "calendar_token" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "attachments" ADD "project_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "attachments" ADD "version" integer NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(`ALTER TABLE "attachments" ADD "previous_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "attachments" ADD "is_latest" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" ADD "shared_with_client" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "projects" ADD "client_id" uuid`);
    await queryRunner.query(`ALTER TABLE "decisions" ADD "conclusion" text`);
    await queryRunner.query(`ALTER TABLE "decisions" ADD "decided_by_id" uuid`);
    // Chuyển "Quyết định" cũ sang "Phân tích và chốt": phương án đã chọn + lý do thành kết luận
    await queryRunner.query(
      `UPDATE "decisions" d SET "conclusion" = concat_ws(E'\n\n', o."title", d."rationale"), "decided_by_id" = d."owner_id" FROM "decision_options" o WHERE o."id" = d."chosen_option_id"`,
    );
    await queryRunner.query(
      `INSERT INTO "decision_opinions" ("decision_id", "kind", "body", "author_id", "created_at") SELECT o."decision_id", 'PROPOSAL', concat_ws(E'\n', o."title", o."description"), d."owner_id", o."created_at" FROM "decision_options" o JOIN "decisions" d ON d."id" = o."decision_id"`,
    );
    await queryRunner.query(`DROP TABLE "decision_votes"`);
    await queryRunner.query(`DROP TABLE "decision_options"`);
    await queryRunner.query(
      `ALTER TABLE "decisions" DROP COLUMN "chosen_option_id"`,
    );
    await queryRunner.query(`ALTER TABLE "decisions" DROP COLUMN "rationale"`);
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD "acceptance_criteria" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD "reminder_2h_sent_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_checklist_items" ADD "completed_by_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_checklist_items" ADD "completed_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."user_role" ADD VALUE 'CLIENT'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."notification_type" ADD VALUE 'TASK_WATCHED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."notification_type" ADD VALUE 'FILE_SHARED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."notification_type" ADD VALUE 'DRAWING_REVIEW'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."notification_type" ADD VALUE 'DRAWING_REVIEWED'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fe78d8a39780832c17d451b108" ON "attachments"  ("project_id") `,
    );
    // Gắn dự án cho file đã có để hiện trong thư viện "Tệp và bản vẽ"
    await queryRunner.query(
      `UPDATE "attachments" SET "project_id" = "target_id" WHERE "target_type" = 'PROJECT'`,
    );
    await queryRunner.query(
      `UPDATE "attachments" a SET "project_id" = t."project_id" FROM "tasks" t WHERE a."target_type" = 'TASK' AND t."id" = a."target_id"`,
    );
    await queryRunner.query(
      `UPDATE "attachments" a SET "project_id" = d."project_id" FROM "discussions" d WHERE a."target_type" = 'DISCUSSION' AND d."id" = a."target_id"`,
    );
    // Bộ nhãn lỗi mặc định (theo Figma), sửa được ở Cài đặt
    await queryRunner.query(`INSERT INTO "dataset_label_types" ("name", "description", "color", "position") VALUES
          ('Thiếu kích thước', 'Thiếu kích thước hoặc cao độ cần thiết', '#F0813F', 1),
          ('Sai kích thước', 'Kích thước mâu thuẫn hoặc cộng không khớp', '#B42318', 2),
          ('Ký hiệu không có trong chú giải', 'Dùng ký hiệu chưa định nghĩa trong bảng chú giải', '#7C3AED', 3),
          ('Khung tên thiếu thông tin', 'Thiếu ngày duyệt, người vẽ, số hiệu...', '#1F4FD1', 4),
          ('Mâu thuẫn giữa các bản vẽ', 'Thông tin khác nhau giữa mặt bằng, mặt cắt, chi tiết', '#0F766E', 5),
          ('Ghi chú không rõ', 'Ghi chú mơ hồ, khó hiểu hoặc sai chính tả kỹ thuật', '#B45309', 6)`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_0d1e90d75674c54f8660c4ed446" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_e9658e959c490b0a634dfc54783" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_ca29f959102228649e714827478" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dataset_batches" ADD CONSTRAINT "FK_3daa7b616c6293ae387fd0bf32b" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dataset_batches" ADD CONSTRAINT "FK_d3c68e782bdf8e0adc3e3988db8" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dataset_drawings" ADD CONSTRAINT "FK_e9e50ca8e4571105714d5588516" FOREIGN KEY ("batch_id") REFERENCES "dataset_batches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dataset_drawings" ADD CONSTRAINT "FK_010e54dc81559bf8e96c5063d1b" FOREIGN KEY ("labeler_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dataset_drawings" ADD CONSTRAINT "FK_3294a230893b1c45df84d664751" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dataset_annotations" ADD CONSTRAINT "FK_c41bfafd19fe9930ac69e0f68e2" FOREIGN KEY ("drawing_id") REFERENCES "dataset_drawings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dataset_annotations" ADD CONSTRAINT "FK_de973965962bc3ac819a381d4e0" FOREIGN KEY ("label_type_id") REFERENCES "dataset_label_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dataset_annotations" ADD CONSTRAINT "FK_50b7189c4401792beff2f375f29" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dataset_annotations" ADD CONSTRAINT "FK_fb729dfc01f066f4f9545314169" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "decisions" ADD CONSTRAINT "FK_e87b8c8be53423f2f20aa06a7a7" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "decision_opinions" ADD CONSTRAINT "FK_833f8061c858818ee93b055a325" FOREIGN KEY ("decision_id") REFERENCES "decisions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "decision_opinions" ADD CONSTRAINT "FK_9cca30d92d8ec4811ac903f9a66" FOREIGN KEY ("parent_id") REFERENCES "decision_opinions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "decision_opinions" ADD CONSTRAINT "FK_72d5234b103b4c4ccb4fd42ca96" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "decision_opinion_agrees" ADD CONSTRAINT "FK_05eb5d78391dc14eb46b8b1cf3b" FOREIGN KEY ("opinion_id") REFERENCES "decision_opinions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "decision_opinion_agrees" ADD CONSTRAINT "FK_d7b5168908c50838e002b9cd682" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_checklist_items" ADD CONSTRAINT "FK_a2b79d5d63748327381b951657a" FOREIGN KEY ("completed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_watchers" ADD CONSTRAINT "FK_6ec69c77281f4bc0a18fdbc722a" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_watchers" ADD CONSTRAINT "FK_ff976f3fc177614cc4a60291de1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task_watchers" DROP CONSTRAINT "FK_ff976f3fc177614cc4a60291de1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_watchers" DROP CONSTRAINT "FK_6ec69c77281f4bc0a18fdbc722a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_checklist_items" DROP CONSTRAINT "FK_a2b79d5d63748327381b951657a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "decision_opinion_agrees" DROP CONSTRAINT "FK_d7b5168908c50838e002b9cd682"`,
    );
    await queryRunner.query(
      `ALTER TABLE "decision_opinion_agrees" DROP CONSTRAINT "FK_05eb5d78391dc14eb46b8b1cf3b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "decision_opinions" DROP CONSTRAINT "FK_72d5234b103b4c4ccb4fd42ca96"`,
    );
    await queryRunner.query(
      `ALTER TABLE "decision_opinions" DROP CONSTRAINT "FK_9cca30d92d8ec4811ac903f9a66"`,
    );
    await queryRunner.query(
      `ALTER TABLE "decision_opinions" DROP CONSTRAINT "FK_833f8061c858818ee93b055a325"`,
    );
    await queryRunner.query(
      `ALTER TABLE "decisions" DROP CONSTRAINT "FK_e87b8c8be53423f2f20aa06a7a7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dataset_annotations" DROP CONSTRAINT "FK_fb729dfc01f066f4f9545314169"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dataset_annotations" DROP CONSTRAINT "FK_50b7189c4401792beff2f375f29"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dataset_annotations" DROP CONSTRAINT "FK_de973965962bc3ac819a381d4e0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dataset_annotations" DROP CONSTRAINT "FK_c41bfafd19fe9930ac69e0f68e2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dataset_drawings" DROP CONSTRAINT "FK_3294a230893b1c45df84d664751"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dataset_drawings" DROP CONSTRAINT "FK_010e54dc81559bf8e96c5063d1b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dataset_drawings" DROP CONSTRAINT "FK_e9e50ca8e4571105714d5588516"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dataset_batches" DROP CONSTRAINT "FK_d3c68e782bdf8e0adc3e3988db8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dataset_batches" DROP CONSTRAINT "FK_3daa7b616c6293ae387fd0bf32b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT "FK_ca29f959102228649e714827478"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_e9658e959c490b0a634dfc54783"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_0d1e90d75674c54f8660c4ed446"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fe78d8a39780832c17d451b108"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_type_old" AS ENUM('TASK_ASSIGNED', 'TASK_DUE_SOON', 'TASK_OVERDUE', 'TASK_STATUS_CHANGED', 'TASK_COMMENTED', 'MENTIONED', 'DISCUSSION_REPLY', 'DECISION_CREATED', 'DECISION_MADE', 'PROJECT_ADDED', 'MEMBER_PENDING', 'ACCOUNT_APPROVED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notification_type_old" USING "type"::"text"::"public"."notification_type_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."notification_type"`);
    await queryRunner.query(
      `ALTER TYPE "public"."notification_type_old" RENAME TO "notification_type"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_role_old" AS ENUM('ADMIN', 'MANAGER', 'MEMBER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."user_role_old" USING "role"::"text"::"public"."user_role_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."user_role"`);
    await queryRunner.query(
      `ALTER TYPE "public"."user_role_old" RENAME TO "user_role"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_checklist_items" DROP COLUMN "completed_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_checklist_items" DROP COLUMN "completed_by_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP COLUMN "reminder_2h_sent_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP COLUMN "acceptance_criteria"`,
    );
    await queryRunner.query(
      `ALTER TABLE "decisions" DROP COLUMN "decided_by_id"`,
    );
    await queryRunner.query(`ALTER TABLE "decisions" DROP COLUMN "conclusion"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "client_id"`);
    await queryRunner.query(
      `ALTER TABLE "attachments" DROP COLUMN "shared_with_client"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" DROP COLUMN "is_latest"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" DROP COLUMN "previous_id"`,
    );
    await queryRunner.query(`ALTER TABLE "attachments" DROP COLUMN "version"`);
    await queryRunner.query(
      `ALTER TABLE "attachments" DROP COLUMN "project_id"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "calendar_token"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "remind_2h"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "remind_24h"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "web_notifications"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "client_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "skills"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "totp_enabled"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "totp_secret"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_hash"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_09a2296ade1053a0cc4080bda4a"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "github_id"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_a5711ddc02238171575201a0806"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "microsoft_id"`);
    await queryRunner.query(`ALTER TABLE "decisions" ADD "rationale" text`);
    await queryRunner.query(
      `ALTER TABLE "decisions" ADD "chosen_option_id" uuid`,
    );
    await queryRunner.query(`DROP TABLE "task_watchers"`);
    await queryRunner.query(`DROP TABLE "settings"`);
    await queryRunner.query(`DROP TABLE "decision_opinion_agrees"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4d3242a54855896f2ce504c95d"`,
    );
    await queryRunner.query(`DROP TABLE "decision_opinions"`);
    await queryRunner.query(`DROP TYPE "public"."opinion_kind"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c41bfafd19fe9930ac69e0f68e"`,
    );
    await queryRunner.query(`DROP TABLE "dataset_annotations"`);
    await queryRunner.query(`DROP TYPE "public"."annotation_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3c208e7cee93219b61921339cb"`,
    );
    await queryRunner.query(`DROP TABLE "dataset_drawings"`);
    await queryRunner.query(`DROP TYPE "public"."drawing_status"`);
    await queryRunner.query(`DROP TABLE "dataset_batches"`);
    await queryRunner.query(`DROP TABLE "dataset_label_types"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e9658e959c490b0a634dfc5478"`,
    );
    await queryRunner.query(`DROP TABLE "user_sessions"`);
    await queryRunner.query(`DROP TABLE "clients"`);
  }
}
