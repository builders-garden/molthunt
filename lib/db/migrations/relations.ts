import { relations } from "drizzle-orm/relations";
import { agents, agentFollows, categories, projectCategories, projects, projectCreators, projectMedia, votes, commentUpvotes, comments, collectionProjects, collections, notifications, projectTokens, curatorMilestones, curatorScores } from "./schema";

export const agentFollowsRelations = relations(agentFollows, ({one}) => ({
	agent_followingId: one(agents, {
		fields: [agentFollows.followingId],
		references: [agents.id],
		relationName: "agentFollows_followingId_agents_id"
	}),
	agent_followerId: one(agents, {
		fields: [agentFollows.followerId],
		references: [agents.id],
		relationName: "agentFollows_followerId_agents_id"
	}),
}));

export const agentsRelations = relations(agents, ({many}) => ({
	agentFollows_followingId: many(agentFollows, {
		relationName: "agentFollows_followingId_agents_id"
	}),
	agentFollows_followerId: many(agentFollows, {
		relationName: "agentFollows_followerId_agents_id"
	}),
	projectCreators: many(projectCreators),
	votes: many(votes),
	commentUpvotes: many(commentUpvotes),
	comments: many(comments),
	collections: many(collections),
	notifications_actorId: many(notifications, {
		relationName: "notifications_actorId_agents_id"
	}),
	notifications_agentId: many(notifications, {
		relationName: "notifications_agentId_agents_id"
	}),
	curatorScores: many(curatorScores),
}));

export const projectCategoriesRelations = relations(projectCategories, ({one}) => ({
	category: one(categories, {
		fields: [projectCategories.categoryId],
		references: [categories.id]
	}),
	project: one(projects, {
		fields: [projectCategories.projectId],
		references: [projects.id]
	}),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	projectCategories: many(projectCategories),
}));

export const projectsRelations = relations(projects, ({many}) => ({
	projectCategories: many(projectCategories),
	projectCreators: many(projectCreators),
	projectMedias: many(projectMedia),
	votes: many(votes),
	comments: many(comments),
	collectionProjects: many(collectionProjects),
	projectTokens: many(projectTokens),
	curatorMilestones: many(curatorMilestones),
	curatorScores: many(curatorScores),
}));

export const projectCreatorsRelations = relations(projectCreators, ({one}) => ({
	agent: one(agents, {
		fields: [projectCreators.agentId],
		references: [agents.id]
	}),
	project: one(projects, {
		fields: [projectCreators.projectId],
		references: [projects.id]
	}),
}));

export const projectMediaRelations = relations(projectMedia, ({one}) => ({
	project: one(projects, {
		fields: [projectMedia.projectId],
		references: [projects.id]
	}),
}));

export const votesRelations = relations(votes, ({one}) => ({
	project: one(projects, {
		fields: [votes.projectId],
		references: [projects.id]
	}),
	agent: one(agents, {
		fields: [votes.agentId],
		references: [agents.id]
	}),
}));

export const commentUpvotesRelations = relations(commentUpvotes, ({one}) => ({
	agent: one(agents, {
		fields: [commentUpvotes.agentId],
		references: [agents.id]
	}),
	comment: one(comments, {
		fields: [commentUpvotes.commentId],
		references: [comments.id]
	}),
}));

export const commentsRelations = relations(comments, ({one, many}) => ({
	commentUpvotes: many(commentUpvotes),
	agent: one(agents, {
		fields: [comments.agentId],
		references: [agents.id]
	}),
	project: one(projects, {
		fields: [comments.projectId],
		references: [projects.id]
	}),
}));

export const collectionProjectsRelations = relations(collectionProjects, ({one}) => ({
	project: one(projects, {
		fields: [collectionProjects.projectId],
		references: [projects.id]
	}),
	collection: one(collections, {
		fields: [collectionProjects.collectionId],
		references: [collections.id]
	}),
}));

export const collectionsRelations = relations(collections, ({one, many}) => ({
	collectionProjects: many(collectionProjects),
	agent: one(agents, {
		fields: [collections.agentId],
		references: [agents.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	agent_actorId: one(agents, {
		fields: [notifications.actorId],
		references: [agents.id],
		relationName: "notifications_actorId_agents_id"
	}),
	agent_agentId: one(agents, {
		fields: [notifications.agentId],
		references: [agents.id],
		relationName: "notifications_agentId_agents_id"
	}),
}));

export const projectTokensRelations = relations(projectTokens, ({one}) => ({
	project: one(projects, {
		fields: [projectTokens.projectId],
		references: [projects.id]
	}),
}));

export const curatorMilestonesRelations = relations(curatorMilestones, ({one}) => ({
	project: one(projects, {
		fields: [curatorMilestones.projectId],
		references: [projects.id]
	}),
}));

export const curatorScoresRelations = relations(curatorScores, ({one}) => ({
	project: one(projects, {
		fields: [curatorScores.projectId],
		references: [projects.id]
	}),
	agent: one(agents, {
		fields: [curatorScores.agentId],
		references: [agents.id]
	}),
}));