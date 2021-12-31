import { v4 as uuid } from 'uuid';

import log from '../log.js';

/**
 * A token placed into a TopicSubscription to mark where an unsubscribe was requested
 * @private
 */
class UnsubscribeToken {

  /**
   * @param {MessageBus}        messageBus        - The message bus that owns the subscription
   * @param {TopicSubscription} topicSubscription - The subscription to remove
   */
  constructor(messageBus, topicSubscription) {
    this.messageBus = messageBus;
    this.topicSubscription = topicSubscription;
  }

  /**
   * Finish unsubscribing from the topic
   */
  completeUnsubscribe() {
    const subscriptions = this.messageBus.subscriptions;
    const index = subscriptions[this.topicSubscription.topic].indexOf(this.topicSubscription);
    if (index > -1) {
      subscriptions[this.topicSubscription.topic].splice(index, 1);
    }
    log.debug({
      topicSubscription: this.topicSubscription.id,
      topic: this.topicSubscription.topic,
    }, 'Unsubscribed');
  }
}

/**
 * A subscription to a topic
 * @private
 */
class TopicSubscription {

  /**
   * Create a TopicSubscription
   * @param {String} topic - Unique identifier for the topic
   * @param {cb}     cb    - Callback to be invoked
   */
  constructor(topic, cb) {
    this.topic = topic;
    this.cb = cb;
    this.messages = [];
    this.id = `sub-${this.topic}-${uuid()}`;
    this._seqNo = 0;
  }

  /**
   * Queue a message to be delivered to the topic
   * @param {Object} message - The message to deliver
   */
  queueMessage(message) {
    const packet = {
      message,
      timestamp: Date.now(),
      seqNo: this._seqNo,
    };
    this._seqNo += 1;

    this.messages.push(packet);
  }

  /**
   * Deliver messages to the recipients
   */
  deliver() {
    let unsubscribed = false;

    while(this.messages.length > 0) {
      const packet = this.messages.shift();

      if (packet.message instanceof UnsubscribeToken) {
        unsubscribed = true;
        packet.message.completeUnsubscribe();
      }

      if (!unsubscribed) {
        if (this.cb) {
          log.debug({
            topicSubscription: this.id,
            packet,
          }, 'Delivering message');
          this.cb(packet.message);
        }
      } else if (!(packet.message instanceof UnsubscribeToken)) {
        log.debug({
          topicSubscription: this.id,
          packet,
        }, 'Dropping message due to unsubscription');
      }
    }
  }
}

/**
 * A message bus
 */
class MessageBus {

  /**
   * Get a singleton instance of the MessageBus
   * @param {Integer} interval - How often the message bus polls. Default is
   *                             10 ms.
   * @static
   */
  static getInstance(interval = 10) {
    if (!MessageBus._singleton) {
      MessageBus._singleton = new MessageBus(interval);
    }
    return MessageBus._singleton;
  }

  /**
   * Create an instance of the MessageBus
   * @param {Integer} interval - How often the message bus polls. Default is
   *                             10 ms.
   * @private
   */
  constructor(interval = 10) {
    this.subscriptions = {};
    this.timerHandle = setInterval(() => {
      this._processSubscriptions();
    }, interval);
    this.id = `mb-${uuid()}`;
  }

  /**
   * Process through the subscriptions
   * @private
   */
  _processSubscriptions() {
    if (!this.subscriptions) {
      return;
    }
    Object.keys(this.subscriptions).forEach(topic => {
      this.subscriptions[topic].forEach(topicSubscription => {
        topicSubscription.deliver();
      });
    });
  }

  /**
   * Subscribe to a topic
   * @param {String}   topic - The topic to subscribe to
   * @param {function} cb    - The callback to invoke.
   */
  subscribe(topic, cb) {
    const topicSubscription = new TopicSubscription(topic, cb);

    log.debug({
      topicSubscription: topicSubscription.id,
      topic,
    }, 'Subscribing to topic');
    if (!this.subscriptions[topic]) {
      this.subscriptions[topic] = [];
    }
    this.subscriptions[topic].push(topicSubscription);

    return topicSubscription;
  }

  /**
   * Unsubscribe to a topic
   * @param {TopicSubscription} topicSubscription - The topic object to unsubscribe
   */
  unsubscribe(topicSubscription) {
    if (!topicSubscription || !topicSubscription.topic) {
      return;
    }

    topicSubscription.queueMessage(new UnsubscribeToken(this, topicSubscription));
  }

  /**
   * Publish to a topic
   * @param {String} topic   - The topic to publish to
   * @param {Object} message - The message to send
   */
  publish(topic, message) {
    if (!this.subscriptions[topic]) {
      return;
    }
    this.subscriptions[topic].forEach(topicSubscription => {
      topicSubscription.queueMessage(message);
    });
  }

  /**
   * Shutdown the message bus
   *
   * This will stop the poller and explicitly unsubscribe every topic to prevent
   * any further message delivery globally
   */
  shutdown() {
    log.debug({ messageBus: this.id }, 'Shutting down message bus');
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }

    /* Unsubscribe and flush */
    Object.keys(this.subscriptions).forEach(topic => {
      this.subscriptions[topic].forEach(topicSubscription => {
        this.unsubscribe(topicSubscription);
      });
    });
    this._processSubscriptions();
  }
}

MessageBus._singleton = null;

export default MessageBus;