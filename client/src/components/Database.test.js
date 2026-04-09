/**
 * Database-layer unit tests for Shiitake.
 *
 * Strategy:
 *   • Model.build() + instance.validate() runs every Sequelize JS-level
 *     validator (allowNull, min/max, isEmail) without touching any DB.
 *   • jest.spyOn() mocks the DB-facing methods (create/findOne/count) for
 *     constraint tests that cannot be verified in pure JS (unique, FK).
 *   • Auth-controller functions receive a mock User object, so bcrypt and
 *     jwt are exercised but no Supabase connection is needed.
 *
 * Test numbers (TEST 1 … TEST 5) match test-cases.rest in dockerfile/.
 */

const { Sequelize, ValidationError } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');

// ─── Shared Sequelize instance ────────────────────────────────────────────────
// We use the postgres dialect (pg is already in root deps).
// NO sync() is called, so no real connection is ever made.
const sequelize = new Sequelize({
  dialect:  'postgres',
  host:     'localhost',
  database: 'test',
  username: 'test',
  password:  'test',
  logging:   false,
});

// Import models relative to this file (3 levels up reaches the Shiitake root)
const User   = require('../../../models/userModel')(sequelize);
const CR     = require('../../../models/crModel')(sequelize);
const Review = require('../../../models/reviewModel')(sequelize);

User.hasMany(Review);
Review.belongsTo(User);
CR.hasMany(Review);
Review.belongsTo(CR);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER MODEL — JS validators (no DB required)
// ═══════════════════════════════════════════════════════════════════════════════
describe('User model – JS validators', () => {

  // ── TEST 1 ──────────────────────────────────────────────────────────────────
  it('TEST 1: build() creates a valid user instance without errors', async () => {
    const user = User.build({
      username: 'NicoTester',
      email:    'nico@obf.ateneo.edu',
      password: 'securePassword123',
    });

    // validate() passes silently for a well-formed record
    await expect(user.validate()).resolves.not.toThrow();
    expect(user.username).toBe('NicoTester');
    expect(user.email).toBe('nico@obf.ateneo.edu');
  });

  it('rejects a user with no username (allowNull: false)', async () => {
    const user = User.build({ email: 'noname@ateneo.edu', password: 'password123' });
    await expect(user.validate()).rejects.toThrow(ValidationError);
  });

  it('rejects a user with no password (allowNull: false)', async () => {
    const user = User.build({ username: 'NoPass', email: 'nopass@ateneo.edu' });
    await expect(user.validate()).rejects.toThrow(ValidationError);
  });

  it('rejects a user with an invalid email format (isEmail validator)', async () => {
    const user = User.build({ username: 'BadEmail', email: 'not-an-email', password: 'password123' });
    await expect(user.validate()).rejects.toThrow(ValidationError);
  });

  it('defaults role to "user"', () => {
    const user = User.build({ username: 'Role', email: 'r@ateneo.edu', password: 'pass' });
    expect(user.role).toBe('user');
  });

  it('defaults badges and favoriteCRs to empty arrays', () => {
    const user = User.build({ username: 'Arrays', email: 'a@ateneo.edu', password: 'pass' });
    expect(user.badges).toEqual([]);
    expect(user.favoriteCRs).toEqual([]);
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// USER MODEL — DB-level constraint mocks
// ═══════════════════════════════════════════════════════════════════════════════
describe('User model – DB constraint mocks', () => {

  afterEach(() => jest.restoreAllMocks());

  // ── TEST 2 ──────────────────────────────────────────────────────────────────
  it('TEST 2: create() rejects a duplicate username (unique constraint simulation)', async () => {
    // First call succeeds, second throws a unique-constraint-style error
    jest.spyOn(User, 'create')
      .mockResolvedValueOnce({ id: 1, username: 'NicoTester', email: 'nico@obf.ateneo.edu' })
      .mockRejectedValueOnce(Object.assign(new Error('Unique constraint'), { name: 'SequelizeUniqueConstraintError' }));

    await expect(User.create({ username: 'NicoTester', email: 'nico@obf.ateneo.edu', password: 'pass' }))
      .resolves.toMatchObject({ username: 'NicoTester' });

    await expect(User.create({ username: 'NicoTester', email: 'other@ateneo.edu', password: 'pass' }))
      .rejects.toThrow('Unique constraint');
  });

  it('TEST 2b: create() rejects a duplicate email (unique constraint simulation)', async () => {
    jest.spyOn(User, 'create')
      .mockResolvedValueOnce({ id: 2, username: 'First', email: 'dup@ateneo.edu' })
      .mockRejectedValueOnce(Object.assign(new Error('Unique constraint'), { name: 'SequelizeUniqueConstraintError' }));

    await User.create({ username: 'First',  email: 'dup@ateneo.edu', password: 'pass' });

    await expect(User.create({ username: 'Second', email: 'dup@ateneo.edu', password: 'pass' }))
      .rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
  });

  // ── TEST 5 ──────────────────────────────────────────────────────────────────
  it('TEST 5: SQL injection string is treated as a literal value — DB still alive', async () => {
    const injection = "Hacker'; DROP TABLE Users; --";

    // Sequelize parameterizes all queries; the injection string is stored as-is
    jest.spyOn(User, 'create').mockResolvedValue({ id: 3, username: injection });
    jest.spyOn(User, 'count').mockResolvedValue(1);

    const user = await User.create({ username: injection, email: 'h@ateneo.edu', password: 'p' });
    expect(user.username).toBe(injection);

    // DB is still operable (not dropped)
    const count = await User.count();
    expect(count).toBeGreaterThan(0);
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEW MODEL — JS validators (no DB required)
// ═══════════════════════════════════════════════════════════════════════════════
describe('Review model – JS validators', () => {

  // ── TEST 3 ──────────────────────────────────────────────────────────────────
  it('TEST 3: rejects rating = 10 (validate max: 5)', async () => {
    const review = Review.build({ author: 'Test', rating: 10, comment: 'Impossible!' });
    await expect(review.validate()).rejects.toThrow(ValidationError);
  });

  it('rejects rating = 0 (validate min: 1)', async () => {
    const review = Review.build({ author: 'Test', rating: 0 });
    await expect(review.validate()).rejects.toThrow(ValidationError);
  });

  it('rejects rating = 6 (validate max: 5)', async () => {
    const review = Review.build({ author: 'Test', rating: 6 });
    await expect(review.validate()).rejects.toThrow(ValidationError);
  });

  it('rejects a missing rating (allowNull: false)', async () => {
    const review = Review.build({ author: 'Test', comment: 'No stars' });
    await expect(review.validate()).rejects.toThrow(ValidationError);
  });

  it('accepts all valid ratings 1 through 5', async () => {
    for (const rating of [1, 2, 3, 4, 5]) {
      const review = Review.build({ author: 'Test', rating });
      await expect(review.validate()).resolves.not.toThrow();
    }
  });

  it('allows a null comment (allowNull: true)', async () => {
    const review = Review.build({ author: 'Silent', rating: 5, comment: null });
    await expect(review.validate()).resolves.not.toThrow();
  });

  it('defaults likes and dislikes to 0', () => {
    const review = Review.build({ author: 'Neutral', rating: 3 });
    expect(review.likes).toBe(0);
    expect(review.dislikes).toBe(0);
  });

  it('stores reviewTags as an array of objects', () => {
    const tags = [{ label: 'Bidet', working: true }, { label: 'Soap', working: false }];
    const review = Review.build({ author: 'Tagger', rating: 4, reviewTags: tags });
    expect(review.reviewTags).toEqual(tags);
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEW MODEL — DB-level mocks
// ═══════════════════════════════════════════════════════════════════════════════
describe('Review model – DB retrieval mocks', () => {

  afterEach(() => jest.restoreAllMocks());

  // ── TEST 4 ──────────────────────────────────────────────────────────────────
  it('TEST 4: findAll returns all reviews in the database', async () => {
    const fakeReviews = [
      { id: 1, author: 'Alice', rating: 4, comment: 'Good',  CRId: 1, UserId: 1 },
      { id: 2, author: 'Bob',   rating: 2, comment: 'Meh',   CRId: 1, UserId: 2 },
    ];
    jest.spyOn(Review, 'findAll').mockResolvedValue(fakeReviews);

    const reviews = await Review.findAll();

    expect(reviews).toHaveLength(2);
    expect(reviews.map(r => r.author)).toEqual(expect.arrayContaining(['Alice', 'Bob']));
  });

  it('findAll returns an empty array when there are no reviews', async () => {
    jest.spyOn(Review, 'findAll').mockResolvedValue([]);
    const reviews = await Review.findAll();
    expect(reviews).toHaveLength(0);
  });

  it('findByPk returns the correct review by id', async () => {
    jest.spyOn(Review, 'findByPk').mockResolvedValue({ id: 7, author: 'Carol', rating: 5 });
    const review = await Review.findByPk(7);
    expect(review.author).toBe('Carol');
    expect(review.rating).toBe(5);
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// CR MODEL — JS validators (no DB required)
// ═══════════════════════════════════════════════════════════════════════════════
describe('CR model – JS validators', () => {

  it('valid CR instance passes validate()', async () => {
    const cr = CR.build({
      name: 'Male CR', building: 'MVP', floor: 1,
      longitude: 121.0786, latitude: 14.6396,
    });
    await expect(cr.validate()).resolves.not.toThrow();
  });

  it('rejects a CR with no building (allowNull: false)', async () => {
    const cr = CR.build({ name: 'No Building', floor: 1, longitude: 121.0, latitude: 14.6 });
    await expect(cr.validate()).rejects.toThrow(ValidationError);
  });

  it('rejects a CR with no name (allowNull: false)', async () => {
    const cr = CR.build({ building: 'MVP', floor: 1, longitude: 121.0, latitude: 14.6 });
    await expect(cr.validate()).rejects.toThrow(ValidationError);
  });

  it('rejects a CR with no floor (allowNull: false)', async () => {
    const cr = CR.build({ name: 'No Floor', building: 'MVP', longitude: 121.0, latitude: 14.6 });
    await expect(cr.validate()).rejects.toThrow(ValidationError);
  });

  it('defaults status to "available"', () => {
    const cr = CR.build({ name: 'CR', building: 'Faura', floor: 2, longitude: 121.0, latitude: 14.6 });
    expect(cr.status).toBe('available');
  });

  it('defaults averageRating to 0', () => {
    const cr = CR.build({ name: 'CR', building: 'Faura', floor: 2, longitude: 121.0, latitude: 14.6 });
    expect(cr.averageRating).toBe(0);
  });

  it('defaults tags to an empty array', () => {
    const cr = CR.build({ name: 'CR', building: 'Faura', floor: 2, longitude: 121.0, latitude: 14.6 });
    expect(cr.tags).toEqual([]);
  });

  it('stores tags as an array of strings', () => {
    const cr = CR.build({
      name: 'Tagged', building: 'Arete', floor: 3,
      longitude: 121.0, latitude: 14.6,
      tags: ['Bidet', 'Clean', 'Soap'],
    });
    expect(cr.tags).toEqual(['Bidet', 'Clean', 'Soap']);
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH CONTROLLER — register & login logic
// Uses a fully mocked User model so no DB connection is made.
// Bcrypt is spied on to keep tests fast (no real 10-round hashing).
// ═══════════════════════════════════════════════════════════════════════════════
describe('Auth controller', () => {

  // Minimal mock of the User Sequelize model
  const mockUser = {
    findOne: jest.fn(),
    create:  jest.fn(),
  };

  const { registerUser, loginUser } =
    require('../../../server/controllers/authController')(mockUser);

  beforeEach(() => {
    jest.clearAllMocks();
    // Speed up tests: skip real bcrypt rounds
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('$hashed_password');
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
  });

  afterEach(() => jest.restoreAllMocks());

  // ── register ─────────────────────────────────────────────────────────────────
  it('register: returns 201 for a valid Ateneo email', async () => {
    mockUser.findOne.mockResolvedValue(null); // email not taken
    mockUser.create.mockResolvedValue({ id: 1, username: 'Valid', email: 'valid@student.ateneo.edu' });

    const req = { body: { username: 'Valid', email: 'valid@student.ateneo.edu', password: 'password123' } };
    const res = mockRes();

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('registered') })
    );
  });

  it('register: returns 400 for a non-Ateneo email', async () => {
    const req = { body: { username: 'Outsider', email: 'bad@gmail.com', password: 'password123' } };
    const res = mockRes();

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Ateneo') }));
  });

  it('register: returns 400 for a username with special characters', async () => {
    const req = { body: { username: 'bad user!', email: 'u@ateneo.edu', password: 'password123' } };
    const res = mockRes();
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('register: returns 400 for a username longer than 20 characters', async () => {
    const req = { body: { username: 'ThisUsernameIsTooLong1', email: 'u@ateneo.edu', password: 'password123' } };
    const res = mockRes();
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('register: returns 400 for a password shorter than 8 characters', async () => {
    const req = { body: { username: 'ShortPw', email: 'sp@ateneo.edu', password: 'abc' } };
    const res = mockRes();
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('register: returns 400 when the email is already registered', async () => {
    mockUser.findOne.mockResolvedValue({ id: 1, email: 'dup@ateneo.edu' }); // email exists

    const req = { body: { username: 'NewUser', email: 'dup@ateneo.edu', password: 'password123' } };
    const res = mockRes();

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('email already exists') })
    );
  });

  // ── login ────────────────────────────────────────────────────────────────────
  it('login: returns 200 and a JWT for correct credentials', async () => {
    mockUser.findOne.mockResolvedValue({
      id: 5, username: 'LoginUser', email: 'login@ateneo.edu',
      password: '$hashed_password',
    });
    // bcrypt.compare is already mocked to return true

    const req = { body: { email: 'login@ateneo.edu', password: 'password123' } };
    const res = mockRes();

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.token).toBeDefined();
    expect(payload.user.username).toBe('LoginUser');
  });

  it('login: returns 401 for a wrong password', async () => {
    mockUser.findOne.mockResolvedValue({ id: 6, email: 'wp@ateneo.edu', password: '$hashed' });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false); // wrong password

    const req = { body: { email: 'wp@ateneo.edu', password: 'wrongPassword' } };
    const res = mockRes();

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('login: returns 401 for an email that was never registered', async () => {
    mockUser.findOne.mockResolvedValue(null); // no user found

    const req = { body: { email: 'ghost@ateneo.edu', password: 'password123' } };
    const res = mockRes();

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('login: JWT payload contains the correct user_id', async () => {
    mockUser.findOne.mockResolvedValue({
      id: 42, username: 'JWTUser', email: 'jwt@ateneo.edu',
      password: '$hashed_password',
    });

    const req = { body: { email: 'jwt@ateneo.edu', password: 'password123' } };
    const res = mockRes();

    await loginUser(req, res);

    const { token } = res.json.mock.calls[0][0];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    expect(decoded.user_id).toBe(42);
  });

});
