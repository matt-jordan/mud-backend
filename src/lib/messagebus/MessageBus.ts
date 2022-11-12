//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import { v4 as uuid } from 'uuid';

import log from '../log.js';

/**
 * @module lib/messagebus/MessageBus
 */

/**
 * A token placed into a TopicSubscription to mark where an unsubscribe was requested
 * @private
 */
class UnsubscribeToken {
  messageBus: MessageBus;
  topicSubscription: TopicSubscription;

  /**
   * @param {MessageBus}        messageBus        - The message bus that owns the subscription
   * @param {TopicSubscription} topicSubscription - The subscription to remove
   */
  constructor(messageBus: MessageBus, topicSubscription: TopicSubscription) {
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
  }
}

type MessageCallback = (message: any) => void;

export interface IPacket {
  message: any;
  timestamp: number;
  seqNo: number;
};

/**
 * A subscription to a topic
 * @private
 */
class TopicSubscription {
  topic: string;
  cb: MessageCallback;
  messages: IPacket[];
  readonly id: string;
  #seqNo: number;

  /**
   * Create a TopicSubscription
   * @param {string}          topic - Unique identifier for the topic
   * @param {MessageCallback} cb    - Callback to be invoked
   */
  constructor(topic: string, cb: MessageCallback) {
    this.topic = topic;
    this.cb = cb;
    this.messages = [];
    this.id = `sub-${this.topic}-${uuid()}`;
    this.#seqNo = 0;
  }

  /**
   * Queue a message to be delivered to the topic
   * @param {Object} message - The message to deliver
   */
  queueMessage(message: any) {
    const packet = {
      message,
      timestamp: Date.now(),
      seqNo: this.#seqNo,
    };
    this.#seqNo += 1;

    this.messages.push(packet);
  }

  /**
   * Deliver messages to the recipients
   */
  deliver() {
    let unsubscribed = false;

    while(this.messages.length > 0) {
      const packet = this.messages.shift();

      if (!packet) {
        continue;
      }

      if (packet.message instanceof UnsubscribeToken) {
        unsubscribed = true;
        packet.message.completeUnsubscribe();
      }

      if (!unsubscribed && this.cb) {
        this.cb(packet.message);
      }
    }
  }
}

/**
 * A message bus
 */
class MessageBus {
  static _singleton: MessageBus;
  timerHandle: NodeJS.Timer;
  readonly id: string;
  subscriptions: Record<string, TopicSubscription[]>;

  /**
   * Get a singleton instance of the MessageBus
   * @param {number} interval - How often the message bus polls. Default is
   *                            10 ms.
   * @static
   */
  static getInstance(interval: number = 10) {
    if (!MessageBus._singleton) {
      MessageBus._singleton = new MessageBus(interval);
    }
    return MessageBus._singleton;
  }

  /**
   * Create an instance of the MessageBus
   * @param {number} interval - How often the message bus polls. Default is
   *                            10 ms.
   */
  constructor(interval: number = 10) {
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
   * @param {String}          topic - The topic to subscribe to
   * @param {MessageCallback} cb    - The callback to invoke.
   */
  subscribe(topic: string, cb: MessageCallback) {
    const topicSubscription = new TopicSubscription(topic, cb);

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
  unsubscribe(topicSubscription: TopicSubscription) {
    if (!topicSubscription || !topicSubscription.topic) {
      return;
    }

    topicSubscription.queueMessage(new UnsubscribeToken(this, topicSubscription));
  }

  /**
   * Publish to a topic
   * @param {string} topic   - The topic to publish to
   * @param {Object} message - The message to send
   */
  publish(topic: string, message: any) {
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
    log.info({ messageBus: this.id }, 'Shutting down message bus');
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
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

export default MessageBus;