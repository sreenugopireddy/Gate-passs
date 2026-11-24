const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let app;
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
  // require server after setting MONGO_URI
  app = require('../src/server');
});

afterAll(async () => {
  if (app && app.close) app.close();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test('registers seed users and can login me route', async () => {
  // create a test user directly
  const User = require('../src/models/User');
  const user = await User.create({ name: 'Test Student', email: 'teststudent@example.com', password: 'password123', role: 'student' });

  const resLogin = await request('http://localhost:5000').post('/api/auth/login').send({ email: 'teststudent@example.com', password: 'password123' });
  expect(resLogin.status).toBe(200);
  expect(resLogin.body.token).toBeDefined();

  const token = resLogin.body.token;
  const resMe = await request('http://localhost:5000').get('/api/auth/me').set('Authorization', `Bearer ${token}`);
  expect(resMe.status).toBe(200);
  expect(resMe.body.user.email).toBe('teststudent@example.com');
});
