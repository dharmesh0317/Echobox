const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const UserNotification = require('../models/UserNotification');
const Post = require('../models/Post');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { createAccessToken } = require('../security');
const { validatePassword, validateCampusDetails } = require('../validation');

const router = express.Router();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PROFILE_PHOTO_LENGTH = 1_000_000;

const toPublicUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email || '',
  isAdmin: user.isAdmin,
  profilePhoto: user.profilePhoto || '',
  campusRole: user.campusRole || 'student',
  department: user.department || '',
  studyYear: user.studyYear || '',
  followedPosts: user.followedPosts || [],
  savedPosts: user.savedPosts || [],
  followedTopics: user.followedTopics || [],
  notificationPreferences: user.notificationPreferences || { status: true, reply: true, comment: true, topic: true }
});

const createSession = (user) => ({
  user: toPublicUser(user),
  token: createAccessToken(user)
});

router.post('/register', async (req, res) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const confirmPassword = typeof req.body.confirmPassword === 'string' ? req.body.confirmPassword : '';
    const campusRole = typeof req.body.campusRole === 'string' ? req.body.campusRole : '';
    const department = typeof req.body.department === 'string' ? req.body.department.trim() : '';
    const studyYear = typeof req.body.studyYear === 'string' ? req.body.studyYear : '';

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters.' });
    }
    if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ error: passwordError });
    if (password !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match.' });
    const campusDetailsError = validateCampusDetails(campusRole, department, studyYear);
    if (campusDetailsError) return res.status(400).json({ error: campusDetailsError });

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) return res.status(409).json({ error: 'Username or email is already in use.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, password: passwordHash, campusRole, department, studyYear });
    res.status(201).json(createSession(user));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Username or email is already in use.' });
    res.status(500).json({ error: 'Could not create your account.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = await User.findOne({ username }).select('+password');
    if (!user || !password) return res.status(401).json({ error: 'Invalid username or password.' });

    const hasPasswordHash = /^\$2[aby]\$/.test(user.password);
    const passwordMatches = hasPasswordHash
      ? await bcrypt.compare(password, user.password)
      : password === user.password;
    if (!passwordMatches) return res.status(401).json({ error: 'Invalid username or password.' });

    if (!hasPasswordHash) {
      user.password = await bcrypt.hash(password, 12);
      await user.save();
    }

    res.json(createSession(user));
  } catch (err) {
    res.status(500).json({ error: 'Could not sign in. Please try again.' });
  }
});

router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '_id username email isAdmin campusRole department studyYear').sort({ username: 1 });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Could not load users.' });
  }
});

router.get('/notifications', authenticate, async (req, res) => {
  try {
    const notifications = await UserNotification.find({ userId: req.user._id.toString() }).sort({ createdAt: -1 }).limit(50).lean();
    const postIds = [...new Set(notifications.map(item => item.postId))];
    const posts = await Post.find({ _id: { $in: postIds } }, '_id content tag');
    const postMap = new Map(posts.map(post => [post._id.toString(), { id: post._id, content: post.content, tag: post.tag }]));
    res.json(notifications.map(item => ({ ...item, post: postMap.get(item.postId) || null })));
  } catch {
    res.status(500).json({ error: 'Could not load your notifications.' });
  }
});

router.patch('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await UserNotification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id.toString() },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: 'Notification not found.' });
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: 'Could not mark notification as read.' });
  }
});

router.get('/profile', authenticate, (req, res) => {
  res.json(toPublicUser(req.user));
});

router.patch('/profile', authenticate, async (req, res) => {
  const { profilePhoto, email, currentPassword, newPassword, notificationPreferences } = req.body;
  const updates = Object.keys(req.body);
  if (!updates.length || updates.some(key => !['profilePhoto', 'email', 'currentPassword', 'newPassword', 'notificationPreferences'].includes(key))) {
    return res.status(400).json({ error: 'Invalid profile update.' });
  }
  if ((currentPassword || newPassword) && (!currentPassword || !newPassword)) {
    return res.status(400).json({ error: 'Enter your current password and a new password.' });
  }
  if (newPassword && validatePassword(newPassword)) return res.status(400).json({ error: 'New password must be between 8 and 128 characters.' });
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (email !== undefined && !EMAIL_PATTERN.test(normalizedEmail)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (profilePhoto !== undefined && profilePhoto !== null && profilePhoto !== '' && typeof profilePhoto !== 'string') {
    return res.status(400).json({ error: 'Invalid profile photo.' });
  }
  if (typeof profilePhoto === 'string' && profilePhoto.length > MAX_PROFILE_PHOTO_LENGTH) {
    return res.status(413).json({ error: 'Profile photo is too large.' });
  }
  if (typeof profilePhoto === 'string' && profilePhoto && !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(profilePhoto)) {
    return res.status(400).json({ error: 'Profile photo must be a JPEG image.' });
  }
  if (notificationPreferences !== undefined && (!notificationPreferences || typeof notificationPreferences !== 'object' || Array.isArray(notificationPreferences) || Object.keys(notificationPreferences).some(key => !['status', 'reply', 'comment', 'topic'].includes(key)) || Object.values(notificationPreferences).some(value => typeof value !== 'boolean'))) {
    return res.status(400).json({ error: 'Choose valid notification preferences.' });
  }

  try {
    if (email !== undefined) {
      const duplicate = await User.findOne({ email: normalizedEmail, _id: { $ne: req.user._id } });
      if (duplicate) return res.status(409).json({ error: 'That email address is already in use.' });
      req.user.email = normalizedEmail;
    }
    if (currentPassword && newPassword) {
      const account = await User.findById(req.user._id).select('+password');
      if (!account || !await bcrypt.compare(currentPassword, account.password)) {
        return res.status(401).json({ error: 'Your current password is incorrect.' });
      }
      account.password = await bcrypt.hash(newPassword, 12);
      await account.save();
    }
    if (profilePhoto !== undefined) req.user.profilePhoto = profilePhoto || '';
    if (notificationPreferences) {
      const current = req.user.notificationPreferences || {};
      req.user.notificationPreferences = {
        status: current.status !== false, reply: current.reply !== false,
        comment: current.comment !== false, topic: current.topic !== false,
        ...notificationPreferences
      };
    }
    await req.user.save();
    res.json(toPublicUser(req.user));
  } catch {
    res.status(500).json({ error: 'Could not save your profile changes.' });
  }
});

module.exports = router;
