import { Activity } from '../modules/activity/activity.entity.js';
import { Attachment } from '../modules/attachments/attachment.entity.js';
import { DecisionOption } from '../modules/decisions/decision-option.entity.js';
import { DecisionVote } from '../modules/decisions/decision-vote.entity.js';
import { Decision } from '../modules/decisions/decision.entity.js';
import { DiscussionReply } from '../modules/discussions/discussion-reply.entity.js';
import { Discussion } from '../modules/discussions/discussion.entity.js';
import { Notification } from '../modules/notifications/notification.entity.js';
import { ProjectMember } from '../modules/projects/project-member.entity.js';
import { Project } from '../modules/projects/project.entity.js';
import { ChecklistItem } from '../modules/tasks/checklist-item.entity.js';
import { TaskComment } from '../modules/tasks/task-comment.entity.js';
import { Task } from '../modules/tasks/task.entity.js';
import { User } from '../modules/users/user.entity.js';

export const entities = [
  User,
  Project,
  ProjectMember,
  Task,
  ChecklistItem,
  TaskComment,
  Attachment,
  Discussion,
  DiscussionReply,
  Decision,
  DecisionOption,
  DecisionVote,
  Notification,
  Activity,
];
