//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import MessageBus from '../../../build/lib/messagebus/MessageBus.js';

describe('MessageBus', () => {

  let mb;

  beforeEach(() => {
    mb = new MessageBus();
  });

  afterEach(() => {
    mb.shutdown();
    mb = null;
  });

  describe('subscribe', () => {
    it('should subscribe the caller to a topic', done => {
      const sub = mb.subscribe('test_topic', payload => {
        assert(payload);
        assert(payload === 'foobar');
        done();
      });

      assert(sub);
      mb.publish('test_topic', 'foobar');
    });

    it('should allow multiple subscriptions to a topic', done => {
      let sub1_done = false;
      const sub1 = mb.subscribe('test_topic', payload => {
        assert(payload);
        assert(payload === 'foobar');
        sub1_done = true;
        if (sub2_done) {
          done();
        }
      });
      assert(sub1);

      let sub2_done = false;
      const sub2 = mb.subscribe('test_topic', payload => {
        assert(payload);
        assert(payload === 'foobar');
        sub2_done = true;
        if (sub1_done) {
          done();
        }
      });
      assert(sub2);

      mb.publish('test_topic', 'foobar');
    });

    it('should allow subscriptions to different topics', done => {
      let sub1_done = false;
      const sub1 = mb.subscribe('test_topic1', payload => {
        assert(payload);
        assert(payload === 'foobar');
        sub1_done = true;
        if (sub2_done) {
          done();
        }
      });
      assert(sub1);

      let sub2_done = false;
      const sub2 = mb.subscribe('test_topic2', payload => {
        assert(payload);
        assert(payload === 'barfoo');
        sub2_done = true;
        if (sub1_done) {
          done();
        }
      });
      assert(sub2);

      mb.publish('test_topic1', 'foobar');
      mb.publish('test_topic2', 'barfoo');
    });
  });

  describe('publish', () => {
    it('should publish messages in order', done => {
      let count = 0;
      const sub = mb.subscribe('test_topic', payload => {
        if (count == 0) {
          assert(payload === 'foo');
        } else if (count == 1) {
          assert(payload === 'bar');
        } else {
          assert(payload === 'foobar');
          done();
        }
        count += 1;
      });
      assert(sub);

      mb.publish('test_topic', 'foo');
      mb.publish('test_topic', 'bar');
      mb.publish('test_topic', 'foobar');
    });
  });

  describe('unsubscribe', () => {
    it('should handle a null handle', () => {
      mb.unsubscribe(null);
      assert(true);
    });

    it('should handle two unsubscribes', () => {
      const sub = mb.subscribe('test_topic', null);
      assert(sub);

      mb.unsubscribe(sub);
      mb.unsubscribe(sub);
      assert(true);
    });

    it('should unsubscribe in order of messages received', done => {
      let count = 0;
      const sub = mb.subscribe('test_topic', payload => {
        if (count == 0) {
          assert(payload === 'foo');
        } else if (count == 1) {
          assert(payload === 'bar');
        } else {
          assert.fail('Received more messages than expected');
        }
        count += 1;
      });
      assert(sub);

      mb.publish('test_topic', 'foo');
      mb.publish('test_topic', 'bar');
      mb.unsubscribe(sub);
      mb.publish('test_topic', 'foobar');
      setTimeout(done, 20);
    });
  });
});