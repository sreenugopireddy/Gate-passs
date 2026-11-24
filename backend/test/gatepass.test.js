const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let server;
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.JWT_SECRET = 'testsecret';
  process.env.JWT_QR_SECRET = 'qrsecret';
  server = require('../src/server');
});

afterAll(async () => {
  if (server && server.close) await server.close();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test('gatepass apply -> approve -> scan -> exit -> entry', async () => {
  const User = require('../src/models/User');
  const GatePassRequest = require('../src/models/GatePassRequest');

  // create users
  const student = await User.create({ name: 'Stu', email: 'stu@example.com', password: 'password', role: 'student', studentId: 'S1', department: 'CS' });
  const hod = await User.create({ name: 'Hod', email: 'hod@example.com', password: 'password', role: 'hod', department: 'CS' });
  const security = await User.create({ name: 'Sec', email: 'sec@example.com', password: 'password', role: 'security' });

  // login each
  const resLoginStudent = await request(server).post('/api/auth/login').send({ email: 'stu@example.com', password: 'password' });
  expect(resLoginStudent.status).toBe(200);
  const studentToken = resLoginStudent.body.token;

  const resLoginHod = await request(server).post('/api/auth/login').send({ email: 'hod@example.com', password: 'password' });
  expect(resLoginHod.status).toBe(200);
  const hodToken = resLoginHod.body.token;

  const resLoginSec = await request(server).post('/api/auth/login').send({ email: 'sec@example.com', password: 'password' });
  expect(resLoginSec.status).toBe(200);
  const secToken = resLoginSec.body.token;

  // student apply (multipart form fields)
  const applyRes = await request(server)
    .post('/api/gatepass/apply')
    .set('Authorization', `Bearer ${studentToken}`)
    .field('reason', 'Medical')
    .field('destination', 'City Hospital')
    .field('outTime', new Date().toISOString())
    .field('expectedReturnTime', new Date(Date.now() + 3600 * 1000).toISOString())
  expect(applyRes.status).toBe(200)
  expect(applyRes.body.passId).toBeDefined()
  const gpId = applyRes.body.id

  // HOD approve
  const approveRes = await request(server)
    .put(`/api/hod/request/${gpId}/approve`)
    .set('Authorization', `Bearer ${hodToken}`)
    .send({ remarks: 'Approved' })
  expect(approveRes.status).toBe(200)
  expect(approveRes.body.gatepass.status).toBe('approved')

  // Fetch gatepass from DB to get qrPayload
  const gp = await GatePassRequest.findById(gpId)
  expect(gp.qrPayload).toBeDefined()

  // security scan
  const scanRes = await request(server)
    .post('/api/security/scan')
    .set('Authorization', `Bearer ${secToken}`)
    .send({ token: gp.qrPayload })
  expect(scanRes.status).toBe(200)
  expect(scanRes.body.valid).toBe(true)

  // mark exit
  const exitRes = await request(server)
    .post('/api/security/mark-exit')
    .set('Authorization', `Bearer ${secToken}`)
    .send({ passId: gp.passId })
  expect(exitRes.status).toBe(200)

  // mark entry
  const entryRes = await request(server)
    .post('/api/security/mark-entry')
    .set('Authorization', `Bearer ${secToken}`)
    .send({ passId: gp.passId })
  expect(entryRes.status).toBe(200)
  expect(entryRes.body.durationMinutes).toBeGreaterThanOrEqual(0)
});
