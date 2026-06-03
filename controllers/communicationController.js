const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { CommunicationRecord, User } = require('../models');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 生成一个极小的 WAV 文件（静音），用于 mock 录音播放
function writeSilentWav(filePath, durationSeconds = 1, sampleRate = 8000) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = Math.max(1, Math.floor(durationSeconds * sampleRate));
  const dataSize = numSamples * numChannels * bytesPerSample;

  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM
  buffer.writeUInt16LE(1, 20); // AudioFormat = PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // byteRate
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // blockAlign
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  // data 默认全 0 = 静音

  fs.writeFileSync(filePath, buffer);
}

exports.getCommunicationRecords = async (req, res, next) => {
  try {
    const { clientId, leadId, page = 1, limit = 50, search } = req.query;

    const where = {};
    if (clientId) where.clientId = clientId;
    if (leadId) where.leadId = leadId;

    if (search) {
      where[Op.or] = [
        { phoneNumber: { [Op.like]: `%${search}%` } },
        { emailSubject: { [Op.like]: `%${search}%` } },
        { smsContent: { [Op.like]: `%${search}%` } },
        { emailContent: { [Op.like]: `%${search}%` } },
        { wechatContent: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await CommunicationRecord.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        records: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

async function createMockRecord(req, record) {
  return await CommunicationRecord.create({
    ...record,
    userId: req.user.id
  });
}

exports.mockCall = async (req, res, next) => {
  try {
    const { clientId = null, leadId = null, phoneNumber, contactPerson, notes, content, duration } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'phoneNumber 必填' });
    }

    const callDuration = Math.max(1, parseInt(duration || 10));
    const startedAt = new Date();
    const endedAt = new Date(startedAt.getTime() + callDuration * 1000);

    // 生成 mock 录音文件
    const recordingDir = path.join(__dirname, '../uploads/recording');
    ensureDir(recordingDir);
    const fileName = `mock-call-${Date.now()}-${Math.round(Math.random() * 1e9)}.wav`;
    const filePath = path.join(recordingDir, fileName);
    writeSilentWav(filePath, Math.min(callDuration, 10)); // 最多生成 10s 静音，足够演示
    const recordingUrl = `/uploads/recording/${fileName}`;

    const created = await createMockRecord(req, {
      clientId,
      leadId,
      communicationType: 'phone',
      direction: 'outbound',
      status: 'completed',
      phoneNumber,
      callDuration,
      recordingUrl,
      content: content || null,
      notes: notes || null,
      startedAt,
      endedAt,
      attachments: [
        {
          fileName,
          fileUrl: recordingUrl,
          fileType: 'wav',
          category: 'recording'
        }
      ],
      metadata: {
        provider: 'mock',
        mockType: 'call'
      },
      result: 'success'
    });

    const record = await CommunicationRecord.findByPk(created.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'email'], required: false }]
    });

    res.status(201).json({
      success: true,
      message: '拨打成功（模拟）',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

exports.mockSms = async (req, res, next) => {
  try {
    const { clientId = null, leadId = null, phoneNumber, content, notes } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'phoneNumber 必填' });
    }
    if (!content) {
      return res.status(400).json({ success: false, message: 'content 必填' });
    }

    const created = await createMockRecord(req, {
      clientId,
      leadId,
      communicationType: 'sms',
      direction: 'outbound',
      status: 'completed',
      phoneNumber,
      smsContent: content,
      smsStatus: 'sent',
      notes: notes || null,
      metadata: { provider: 'mock', mockType: 'sms' },
      result: 'success'
    });

    const record = await CommunicationRecord.findByPk(created.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'email'], required: false }]
    });

    res.status(201).json({ success: true, message: '短信发送成功（模拟）', data: record });
  } catch (error) {
    next(error);
  }
};

exports.mockEmail = async (req, res, next) => {
  try {
    const { clientId = null, leadId = null, to, subject, content, cc, notes } = req.body;
    if (!to) return res.status(400).json({ success: false, message: 'to 必填' });
    if (!subject) return res.status(400).json({ success: false, message: 'subject 必填' });
    if (!content) return res.status(400).json({ success: false, message: 'content 必填' });

    const created = await createMockRecord(req, {
      clientId,
      leadId,
      communicationType: 'email',
      direction: 'outbound',
      status: 'completed',
      emailTo: to,
      emailCc: cc || null,
      emailSubject: subject,
      emailContent: content,
      emailStatus: 'sent',
      notes: notes || null,
      metadata: { provider: 'mock', mockType: 'email' },
      result: 'success'
    });

    const record = await CommunicationRecord.findByPk(created.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'email'], required: false }]
    });

    res.status(201).json({ success: true, message: '邮件发送成功（模拟）', data: record });
  } catch (error) {
    next(error);
  }
};

exports.mockWechat = async (req, res, next) => {
  try {
    const { clientId = null, leadId = null, wechatMsgType = 'text', content, notes } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'content 必填' });

    const created = await createMockRecord(req, {
      clientId,
      leadId,
      communicationType: 'wechat',
      direction: 'outbound',
      status: 'completed',
      wechatMsgType,
      wechatContent: content,
      notes: notes || null,
      metadata: { provider: 'mock', mockType: 'wechat' },
      result: 'success'
    });

    const record = await CommunicationRecord.findByPk(created.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'email'], required: false }]
    });

    res.status(201).json({ success: true, message: '微信发送成功（模拟）', data: record });
  } catch (error) {
    next(error);
  }
};

exports.mockChat = async (req, res, next) => {
  try {
    const { clientId = null, leadId = null, content, notes } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'content 必填' });

    const created = await createMockRecord(req, {
      clientId,
      leadId,
      communicationType: 'chat',
      direction: 'outbound',
      status: 'completed',
      content,
      notes: notes || null,
      metadata: { provider: 'mock', mockType: 'chat' },
      result: 'success'
    });

    const record = await CommunicationRecord.findByPk(created.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'email'], required: false }]
    });

    res.status(201).json({ success: true, message: '消息发送成功（模拟）', data: record });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;




