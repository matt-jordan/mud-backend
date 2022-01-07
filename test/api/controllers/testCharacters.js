import assert from 'power-assert';
import request from 'supertest';
import { v4 as uuid } from 'uuid';

import CharacterModel from '../../../src/db/models/Character.js';
import AccountModel from '../../../src/db/models/Account.js';
import SessionModel from '../../../src/db/models/Session.js';

describe('characters', () => {

  let token;
  let existingCharacterId;
  let accountId;

  beforeEach(async () => {
    const account = new AccountModel();
    account.email = 'foo@bar.com';
    account.accountName = 'foo';
    account.password = 'test';
    await account.save();
    accountId = account._id;

    const session = new SessionModel();
    session.accountId = accountId;
    session.sessionId = uuid();
    await session.save();
    token = session.sessionId;

    const character = new CharacterModel();
    character.name = 'TestChar1';
    character.accountId = accountId;
    await character.save();
    existingCharacterId = character._id;
  });


  afterEach(async () => {
    token = null;
    existingCharacterId = null;

    await AccountModel.deleteMany();
    await SessionModel.deleteMany();
    await CharacterModel.deleteMany();
  });

  describe('get', () => {
    it('returns a 400 if the character ID is invalid', (done) => {
      request(server)
        .get('/characters/notvalid')
        .auth(token, { type: 'bearer' })
        .expect(400, done);
    });

    it('returns a 404 if the character does not exist', (done) => {
      request(server)
        .get('/characters/61cf939481a7d9cc986cdf27')
        .auth(token, { type: 'bearer' })
        .expect(404, done);
    });

    it('returns the character if it exists', (done) => {
      const id = existingCharacterId.toString();
      request(server)
        .get(`/characters/${id}`)
        .auth(token, { type: 'bearer' })
        .expect(200)
        .then((response) => {
          assert(response);
          assert(response.body);
          assert(response.body.name === 'TestChar1');
          assert(response.body.accountId);
          done();
        });
    });
  });

  describe('create', () => {
    it('rejects if no accountName is provided', (done) => {
      request(server)
        .post('/characters')
        .auth(token, { type: 'bearer' })
        .send({
          name: 'TestChar2'
        })
        .expect(400, done);
    });

    it('rejects if no character name is provided', (done) => {
      request(server)
        .post('/characters')
        .auth(token, { type: 'bearer' })
        .send({
          accountName: 'foo',
        })
        .expect(400, done);
    });

    it('rejects if the account ID is unknown', (done) => {
      request(server)
        .post('/characters')
        .auth(token, { type: 'bearer' })
        .send({
          name: 'TestChar2',
          accountName: 'bar',
        })
        .expect(400, done);
    });

    it('rejects if the gender is invalid', (done) => {
      request(server)
        .post('/characters')
        .auth(token, { type: 'bearer' })
        .send({
          name: 'TestChar2',
          accountName: 'foo',
          gender: 'wat',
        })
        .expect(400, done);
    });

    it('rejects if the class is invalid', (done) => {
      request(server)
        .post('/characters')
        .auth(token, { type: 'bearer' })
        .send({
          name: 'TestChar2',
          accountName: 'foo',
          class: 'wat',
        })
        .expect(400, done);
    });

    it('creates the character with default values if the minimum is presented', async () => {
      await request(server)
        .post('/characters')
        .auth(token, { type: 'bearer' })
        .send({
          name: 'TestChar2',
          accountName: 'foo',
        })
        .expect(201)
        .then((response) => {
          assert(response);
          assert(response.body.name === 'TestChar2');
          assert(response.body.accountId === accountId.toString());
          assert(response.body.description === '');
          assert(response.body.age !== 0);
          assert(response.body.gender === 'male');
          assert(response.body.classes.length === 1);
          assert(response.body.classes[0].type === 'fighter');
          assert(response.body.classes[0].level === 1);
          assert(response.body.race === 'human');
          assert(response.body.attributes.strength === 10);
          assert(response.body.attributes.dexterity === 10);
          assert(response.body.attributes.intelligence === 10);
          assert(response.body.attributes.wisdom === 10);
          assert(response.body.attributes.constitution === 10);
          assert(response.body.attributes.charisma === 10);
          assert(response.body.attributes.hitpoints);
          assert(response.body.attributes.manapoints);
          assert(response.body.attributes.energypoints);
        });
    });
  });
});