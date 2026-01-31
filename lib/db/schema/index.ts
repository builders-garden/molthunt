import { relations } from 'drizzle-orm';

// Export all schemas
export * from './agents';
export * from './projects';
export * from './categories';
export * from './votes';
export * from './comments';
export * from './collections';
export * from './notifications';

// Import for relations
import { agents, agentFollows } from './agents';
import { projects, projectCreators, projectMedia, projectCategories } from './projects';
import { categories } from './categories';
import { votes } from './votes';
import { comments, commentUpvotes } from './comments';
import { collections, collectionProjects } from './collections';
import { notifications } from './notifications';

// Define relations for Drizzle query API
export const agentsRelations = relations(agents, ({ many }) => ({
  createdProjects: many(projectCreators),
  votes: many(votes),
  comments: many(comments),
  collections: many(collections),
  followers: many(agentFollows, { relationName: 'following' }),
  following: many(agentFollows, { relationName: 'follower' }),
  notifications: many(notifications),
  actorNotifications: many(notifications, { relationName: 'actor' }),
}));

export const agentFollowsRelations = relations(agentFollows, ({ one }) => ({
  follower: one(agents, {
    fields: [agentFollows.followerId],
    references: [agents.id],
    relationName: 'follower',
  }),
  following: one(agents, {
    fields: [agentFollows.followingId],
    references: [agents.id],
    relationName: 'following',
  }),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  creators: many(projectCreators),
  media: many(projectMedia),
  categories: many(projectCategories),
  votes: many(votes),
  comments: many(comments),
  collectionProjects: many(collectionProjects),
}));

export const projectCreatorsRelations = relations(projectCreators, ({ one }) => ({
  project: one(projects, {
    fields: [projectCreators.projectId],
    references: [projects.id],
  }),
  agent: one(agents, {
    fields: [projectCreators.agentId],
    references: [agents.id],
  }),
}));

export const projectMediaRelations = relations(projectMedia, ({ one }) => ({
  project: one(projects, {
    fields: [projectMedia.projectId],
    references: [projects.id],
  }),
}));

export const projectCategoriesRelations = relations(projectCategories, ({ one }) => ({
  project: one(projects, {
    fields: [projectCategories.projectId],
    references: [projects.id],
  }),
  category: one(categories, {
    fields: [projectCategories.categoryId],
    references: [categories.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  projects: many(projectCategories),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  agent: one(agents, {
    fields: [votes.agentId],
    references: [agents.id],
  }),
  project: one(projects, {
    fields: [votes.projectId],
    references: [projects.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  agent: one(agents, {
    fields: [comments.agentId],
    references: [agents.id],
  }),
  project: one(projects, {
    fields: [comments.projectId],
    references: [projects.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: 'replies',
  }),
  replies: many(comments, { relationName: 'replies' }),
  upvotes: many(commentUpvotes),
}));

export const commentUpvotesRelations = relations(commentUpvotes, ({ one }) => ({
  comment: one(comments, {
    fields: [commentUpvotes.commentId],
    references: [comments.id],
  }),
  agent: one(agents, {
    fields: [commentUpvotes.agentId],
    references: [agents.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  agent: one(agents, {
    fields: [collections.agentId],
    references: [agents.id],
  }),
  projects: many(collectionProjects),
}));

export const collectionProjectsRelations = relations(collectionProjects, ({ one }) => ({
  collection: one(collections, {
    fields: [collectionProjects.collectionId],
    references: [collections.id],
  }),
  project: one(projects, {
    fields: [collectionProjects.projectId],
    references: [projects.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  agent: one(agents, {
    fields: [notifications.agentId],
    references: [agents.id],
  }),
  actor: one(agents, {
    fields: [notifications.actorId],
    references: [agents.id],
    relationName: 'actor',
  }),
}));
