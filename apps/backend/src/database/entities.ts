import { Activity } from '../modules/activity/activity.entity.js';
import { Attachment } from '../modules/attachments/attachment.entity.js';
import { UserSession } from '../modules/auth/user-session.entity.js';
import { Client } from '../modules/clients/client.entity.js';
import {
  Annotation,
  Drawing,
  DrawingBatch,
  LabelType,
} from '../modules/dataset/dataset.entities.js';
import {
  DecisionOpinion,
  OpinionAgree,
} from '../modules/decisions/decision-opinion.entity.js';
import { Decision } from '../modules/decisions/decision.entity.js';
import { DiscussionReply } from '../modules/discussions/discussion-reply.entity.js';
import { Discussion } from '../modules/discussions/discussion.entity.js';
import { Notification } from '../modules/notifications/notification.entity.js';
import { ProjectMember } from '../modules/projects/project-member.entity.js';
import { Project } from '../modules/projects/project.entity.js';
import { Setting } from '../modules/settings/setting.entity.js';
import { ChecklistItem } from '../modules/tasks/checklist-item.entity.js';
import { TaskComment } from '../modules/tasks/task-comment.entity.js';
import { TaskWatcher } from '../modules/tasks/task-watcher.entity.js';
import { Task } from '../modules/tasks/task.entity.js';
import { User } from '../modules/users/user.entity.js';

export const entities = [
  User,
  UserSession,
  Client,
  Project,
  ProjectMember,
  Task,
  ChecklistItem,
  TaskComment,
  TaskWatcher,
  Attachment,
  Discussion,
  DiscussionReply,
  Decision,
  DecisionOpinion,
  OpinionAgree,
  Notification,
  Activity,
  Setting,
  LabelType,
  DrawingBatch,
  Drawing,
  Annotation,
];
