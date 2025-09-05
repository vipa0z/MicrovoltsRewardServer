const request = require('supertest');
const app = require('../server');
const UserService = require('../services/UserService');
const bcrypt = require('bcrypt');

// Mock the UserService and bcrypt
jest.mock('../services/UserService');
jest.mock('bcrypt');

describe('Authentication Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        AccountID: 1,
        Username: 'testuser',
        Password: 'hashedPassword',
      };

      UserService.findUserByUsername.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/login')
        .send({ Username: 'testuser', Password: 'Password123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.Username).toBe('testuser');
    });

    it('should fail with invalid Username', async () => {
      UserService.findUserByUsername.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/login')
        .send({ Username: 'nonexistent', Password: 'Password123' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail with invalid Password', async () => {
      const mockUser = {
        AccountID: 1,
        Username: 'testuser',
        Password: 'hashedPassword',
        Nickname: 'TestUser',
        grade: 1,
        level: 1
      };

      UserService.findUserByUsername.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/login')
        .send({ Username: 'testuser', Password: 'wrongPassword' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('POST /api/register', () => {
    it('should register successfully with valid data', async () => {
      const newUser = {
        AccountID: 1,
        Username: 'newuser',
        Nickname: 'NewUser',
        grade: 1,
        level: 1
      };

      UserService.findUserByUsername.mockResolvedValue(null);
      UserService.createUser.mockResolvedValue(newUser);
      bcrypt.hash.mockResolvedValue('hashedPassword');

      const response = await request(app)
        .post('/api/register')
        .send({
          Username: 'newuser',
          Password: 'Password123',
          Nickname: 'NewUser',
          grade: 1,
          level: 1
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.Username).toBe('newuser');
    });

    it('should fail with existing Username', async () => {
      const existingUser = {
        AccountID: 1,
        Username: 'existinguser',
        Password: 'hashedPassword',
        Nickname: 'ExistingUser',
        grade: 1,
        level: 1
      };

      UserService.findUserByUsername.mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/register')
        .send({
          Username: 'existinguser',
          Password: 'Password123',
          Nickname: 'ExistingUser'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Username already Taken');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({ Username: 'testuser' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Missing required fields');
    });
  });
});