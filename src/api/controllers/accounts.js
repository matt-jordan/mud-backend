import { Router } from 'express';

import AccountModel from '../../db/models/Account.js';

const router = Router();

router.get('/:accountId', async (req, res) => {
  const accountName = req.params.accountId;

  const account = await AccountModel.findOne({ accountName }).exec();
  if (!account) {
    return res.status(404).send({ message: `Account '${accountName}' not found` });
  }

  return res.status(200).json(account.toObject());
});

// Handy regex for testing passwords:
//  - at least 8 characters, but shorter than 32
//  - At least one lower case letter
//  - At least one upper case letter
//  - At least one number
//  - At least one special character
const passwordRegex = /^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,32}$/;

router.post('/:accountId', async (req, res) => {
  const accountName = req.params.accountId;

  const existingAccount = await AccountModel.findOne({ accountName }).exec();
  if (existingAccount) {
    return res.status(409).send({ message: `Account '${accountName}' already exists` });
  }

  const { password, email } = req.body;
  if (!password) {
    return res.status(400).send({ message: 'Accounts must have a password' });
  }
  if (!email) {
    return res.status(400).send({ message: 'Accounts must have an email' });
  }

  if (!passwordRegex.test(password)) {
    return res.status(400).send({ message: 'Account password failed complexity check' });
  }

  const account = new AccountModel();
  account.password = password;
  account.email = email;
  account.accountName = accountName;
  await account.save();

  return res.status(201).json(account.toObject());
});

router.put('/:accountId', async (req, res) => {
  const accountName = req.params.accountId;

  const account = await AccountModel.findOne({ accountName }).exec();
  if (!account) {
    return res.status(404).send({ message: `Account '${accountName}' not found` });
  }

  const { password, email } = req.body;
  if (password && !passwordRegex.test(password)) {
    return res.status(400).send({ message: 'Account password failed complexity check' });
  }

  account.password = password || account.password;
  account.email = email || account.email;

  await account.save();

  return res.status(200).json(account.toObject());
});

router.put('/:accountId/characters/:characterId', async (req, res) => {
  const accountName = req.params.accountId;
  const characterId = req.params.characterId;

  const account = await AccountModel.findOne({ accountName }).exec();
  if (!account) {
    return res.status(404).send({ message: `Account '${accountName}' not found` });
  }

  if (!account.characterIds.includes(characterId)) {
    account.characterIds.push(characterId);
    await account.save();
  }

  return res.status(200).json(account.toObject());
});

router.delete('/:accountId/characters/:characterId', async (req, res) => {
  const accountName = req.params.accountId;
  const characterId = req.params.characterId;

  const account = await AccountModel.findOne({ accountName }).exec();
  if (!account) {
    return res.status(404).send({ message: `Account '${accountName}' not found` });
  }

  account.characterIds = account.characterIds.filter((id) => id !== characterId);
  await account.save();

  return res.status(200).json(account.toObject());
});

export default router;