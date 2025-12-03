import pool from '../../config/database.js';
import logger from '../../utils/logger.js';

/**
 * EventBusService
 * 
 * Provides event-driven communication between agents and system components.
 * Implements publish-subscribe pattern with persistent event storage.
 * 
 * Singleton pattern to ensure single event bus instance.
 */
class EventBusService {
  constructor() {
    if (EventBusService.instance) {
      return EventBusService.instance;
    }

    this.db = pool;
    this.handlers = new Map(); // In-memory event handlers
    EventBusService.instance = this;
  }

  /**
   * Publish an event to the event bus
   * @param {string} eventType - Type of event
   * @param {string} source - Source identifier (agent_id, service_name, etc.)
   * @param {Object} payload - Event payload
   * @returns {Promise<Object>} Created event
   */
  async publish(eventType, source, payload) {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Insert event into database
      const result = await client.query(
        `INSERT INTO system_events (event_type, source, payload)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [eventType, source, payload]
      );

      const event = result.rows[0];

      // Process event asynchronously (find and notify subscribers)
      setImmediate(() => this.processEvent(event).catch(err => {
        logger.error('Error processing event:', { eventId: event.event_id, error: err.message });
      }));

      // Emit to in-memory handlers
      this.emit(eventType, { ...event, payload });

      await client.query('COMMIT');

      logger.info('Event published', { 
        eventId: event.event_id,
        eventType,
        source 
      });

      return event;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error publishing event:', { eventType, source, error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Subscribe to events
   * @param {string} agentId - Agent UUID
   * @param {string} eventType - Event type to subscribe to (supports wildcards: 'agent.*')
   * @param {Object} filter - Optional filter criteria
   * @returns {Promise<Object>} Created subscription
   */
  async subscribe(agentId, eventType, filter = null) {
    try {
      const result = await this.db.query(
        `INSERT INTO event_subscriptions (agent_id, event_type, filter)
         VALUES ($1, $2, $3)
         ON CONFLICT (agent_id, event_type) 
         DO UPDATE SET 
           filter = EXCLUDED.filter,
           active = true,
           updated_at = NOW()
         RETURNING *`,
        [agentId, eventType, filter]
      );

      logger.info('Event subscription created', { 
        subscriptionId: result.rows[0].subscription_id,
        agentId,
        eventType 
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating subscription:', { agentId, eventType, error: error.message });
      throw error;
    }
  }

  /**
   * Unsubscribe from events
   * @param {string} subscriptionId - Subscription UUID
   * @returns {Promise<void>}
   */
  async unsubscribe(subscriptionId) {
    try {
      const result = await this.db.query(
        `UPDATE event_subscriptions 
         SET active = false, updated_at = NOW()
         WHERE subscription_id = $1
         RETURNING subscription_id`,
        [subscriptionId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }

      logger.info('Event subscription deactivated', { subscriptionId });
    } catch (error) {
      logger.error('Error unsubscribing:', { subscriptionId, error: error.message });
      throw error;
    }
  }

  /**
   * Get active subscriptions for an agent
   * @param {string} agentId - Agent UUID
   * @returns {Promise<Array>} Array of subscriptions
   */
  async getSubscriptions(agentId) {
    try {
      const result = await this.db.query(
        `SELECT * FROM event_subscriptions
         WHERE agent_id = $1 AND active = true
         ORDER BY created_at DESC`,
        [agentId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting subscriptions:', { agentId, error: error.message });
      throw error;
    }
  }

  /**
   * Get recent events
   * @param {string} eventType - Optional event type filter
   * @param {Date} since - Optional timestamp filter
   * @param {number} limit - Maximum number of events (default 100)
   * @returns {Promise<Array>} Array of events
   */
  async getRecentEvents(eventType = null, since = null, limit = 100) {
    try {
      let query = 'SELECT * FROM system_events WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (eventType) {
        query += ` AND event_type = $${paramCount}`;
        params.push(eventType);
        paramCount++;
      }

      if (since) {
        query += ` AND created_at >= $${paramCount}`;
        params.push(since);
        paramCount++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
      params.push(limit);

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting recent events:', { eventType, since, error: error.message });
      throw error;
    }
  }

  /**
   * Process an event - find matching subscriptions and queue notifications
   * @param {Object} event - Event object
   * @returns {Promise<void>}
   */
  async processEvent(event) {
    try {
      // Find matching subscriptions
      const result = await this.db.query(
        `SELECT * FROM event_subscriptions
         WHERE active = true
           AND (
             event_type = $1 
             OR event_type = substring($1 from '^[^.]+') || '.*'
             OR event_type = '*'
           )`,
        [event.event_type]
      );

      const subscriptions = result.rows;

      if (subscriptions.length === 0) {
        logger.debug('No subscribers for event', { eventType: event.event_type });
        return;
      }

      // Filter subscriptions based on filter criteria
      const matchingSubscriptions = subscriptions.filter(sub => {
        if (!sub.filter) return true;

        // Apply filter logic (simplified - can be enhanced)
        try {
          const filter = sub.filter;
          for (const [key, value] of Object.entries(filter)) {
            if (event.payload[key] !== value) {
              return false;
            }
          }
          return true;
        } catch (err) {
          logger.warn('Error applying subscription filter', { 
            subscriptionId: sub.subscription_id,
            error: err.message 
          });
          return false;
        }
      });

      // Create notifications for matching subscriptions
      for (const subscription of matchingSubscriptions) {
        try {
          await this.db.query(
            `INSERT INTO agent_tasks (agent_id, type, payload, priority, status)
             VALUES ($1, 'EVENT_NOTIFICATION', $2, 3, 'PENDING')`,
            [
              subscription.agent_id,
              {
                event_id: event.event_id,
                event_type: event.event_type,
                source: event.source,
                payload: event.payload,
                subscription_id: subscription.subscription_id
              }
            ]
          );

          logger.debug('Event notification queued', { 
            agentId: subscription.agent_id,
            eventType: event.event_type 
          });
        } catch (err) {
          logger.error('Error queuing event notification:', { 
            agentId: subscription.agent_id,
            eventId: event.event_id,
            error: err.message 
          });
        }
      }

      logger.info('Event processed', { 
        eventId: event.event_id,
        eventType: event.event_type,
        notificationCount: matchingSubscriptions.length 
      });
    } catch (error) {
      logger.error('Error processing event:', { 
        eventId: event.event_id,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Add in-memory event handler
   * @param {string} eventType - Event type
   * @param {Function} handler - Handler function
   */
  addHandler(eventType, handler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType).push(handler);
    logger.debug('Event handler added', { eventType });
  }

  /**
   * Remove in-memory event handler
   * @param {string} eventType - Event type
   * @param {Function} handler - Handler function to remove
   */
  removeHandler(eventType, handler) {
    if (!this.handlers.has(eventType)) {
      return;
    }

    const handlers = this.handlers.get(eventType);
    const index = handlers.indexOf(handler);
    
    if (index > -1) {
      handlers.splice(index, 1);
      logger.debug('Event handler removed', { eventType });
    }

    if (handlers.length === 0) {
      this.handlers.delete(eventType);
    }
  }

  /**
   * Emit event to in-memory handlers (synchronous, local events)
   * @param {string} eventType - Event type
   * @param {Object} payload - Event payload
   */
  emit(eventType, payload) {
    // Exact match handlers
    if (this.handlers.has(eventType)) {
      const handlers = this.handlers.get(eventType);
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          logger.error('Error in event handler:', { eventType, error: error.message });
        }
      });
    }

    // Wildcard handlers (e.g., 'agent.*')
    const eventPrefix = eventType.split('.')[0];
    const wildcardType = `${eventPrefix}.*`;
    
    if (this.handlers.has(wildcardType)) {
      const handlers = this.handlers.get(wildcardType);
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          logger.error('Error in wildcard event handler:', { 
            eventType, 
            wildcardType,
            error: error.message 
          });
        }
      });
    }

    // Global handlers ('*')
    if (this.handlers.has('*')) {
      const handlers = this.handlers.get('*');
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          logger.error('Error in global event handler:', { eventType, error: error.message });
        }
      });
    }

    logger.debug('Event emitted to in-memory handlers', { eventType });
  }
}

// Export singleton instance
export default new EventBusService();