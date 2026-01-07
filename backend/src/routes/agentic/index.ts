/**
 * Agentic Routes Index
 * Combines all agentic/AI sub-routes
 */
import { Router } from 'express';
import agentsRoutes from './agents.routes';
import agentTasksRoutes from './agent-tasks.routes';
import agentMessagesRoutes from './agent-messages.routes';
import coordinationRoutes from './coordination.routes';
import eventsRoutes from './events.routes';
import knowledgeGraphRoutes from './knowledge-graph.routes';

const router = Router();

// Mount agentic sub-routes
router.use('/agents', agentsRoutes);
router.use('/tasks', agentTasksRoutes);
router.use('/messages', agentMessagesRoutes);
router.use('/coordination', coordinationRoutes);
router.use('/events', eventsRoutes);
router.use('/knowledge-graph', knowledgeGraphRoutes);

export default router;
