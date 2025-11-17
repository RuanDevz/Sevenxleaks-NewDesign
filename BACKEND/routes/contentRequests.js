const express = require('express');
const router = express.Router();
const { User, ContentRequest } = require('../models');
const verifyToken = require('../Middleware/verifyToken');
const isAdmin = require('../Middleware/isAdmin');
const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'mail.sevenxleaks.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
  });
};

const sendCompletionEmail = async (userEmail, userName, requestNumber, completedLink) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: `Your Content Request ${requestNumber} is Complete!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Content Request Completed!</h1>
        </div>

        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Hi <strong>${userName}</strong>,
          </p>

          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Great news! Your content request <strong>${requestNumber}</strong> has been completed and is now available.
          </p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666; margin-bottom: 10px;">Your content is ready:</p>
            <a href="${completedLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; font-size: 16px;">
              VIEW CONTENT
            </a>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Thank you for being a valued VIP member!
          </p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

          <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
            This is an automated email from Sevenxleaks VIP Content Request System
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Completion email sent to ${userEmail}`);
  } catch (error) {
    console.error('Error sending completion email:', error);
  }
};

const generateRequestNumber = (tier) => {
  const prefix = tier.toUpperCase();
  const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `${prefix} #${random}`;
};

router.post('/create', verifyToken, async (req, res) => {
  try {
    const { creatorName, profileLink, contentType, additionalDetails } = req.body;
    const userId = req.user.id;

    if (!creatorName || !profileLink || !contentType) {
      return res.status(400).json({
        error: 'Creator name, profile link, and content type are required'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isVip || !user.vipTier) {
      return res.status(403).json({ error: 'VIP membership required' });
    }

    if (user.requestTickets <= 0) {
      return res.status(403).json({ error: 'No request tickets available' });
    }

    const requestNumber = generateRequestNumber(user.vipTier);

    const newRequest = await ContentRequest.create({
      requestNumber,
      userId: user.id,
      userName: user.name,
      vipTier: user.vipTier,
      creatorName,
      profileLink,
      contentType,
      additionalDetails: additionalDetails || null,
      status: 'pending'
    });

    user.requestTickets -= 1;
    await user.save();

    return res.status(201).json({
      message: 'Request submitted successfully',
      request: newRequest,
      remainingTickets: user.requestTickets
    });

  } catch (error) {
    console.error('Error creating content request:', error);
    return res.status(500).json({ error: 'Failed to create request' });
  }
});

router.get('/my-requests', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await ContentRequest.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ requests });

  } catch (error) {
    console.error('Error fetching user requests:', error);
    return res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

router.get('/all', verifyToken, isAdmin, async (req, res) => {
  try {
    const requests = await ContentRequest.findAll({
      order: [
        ['vipTier', 'DESC'],
        ['createdAt', 'ASC']
      ]
    });

    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      inProgress: requests.filter(r => r.status === 'in_progress').length,
      completed: requests.filter(r => {
        if (r.status !== 'completed') return false;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return r.completedAt >= thirtyDaysAgo;
      }).length,
      titaniumPending: requests.filter(r => r.vipTier === 'titanium' && (r.status === 'pending' || r.status === 'in_progress')).length,
      diamondPending: requests.filter(r => r.vipTier === 'diamond' && (r.status === 'pending' || r.status === 'in_progress')).length
    };

    return res.status(200).json({ requests, stats });

  } catch (error) {
    console.error('Error fetching all requests:', error);
    return res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

router.patch('/update-status/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, completedLink, rejectionReason } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const request = await ContentRequest.findByPk(id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const user = await User.findByPk(request.userId);

    request.status = status;

    if (status === 'completed') {
      if (!completedLink) {
        return res.status(400).json({ error: 'Completed link is required for completed status' });
      }
      request.completedLink = completedLink;
      request.completedAt = new Date();

      if (user && user.email) {
        await sendCompletionEmail(user.email, user.name, request.requestNumber, completedLink);
      }
    }

    if (status === 'rejected' && rejectionReason) {
      request.rejectionReason = rejectionReason;
    }

    await request.save();

    return res.status(200).json({
      message: 'Request status updated successfully',
      request
    });

  } catch (error) {
    console.error('Error updating request status:', error);
    return res.status(500).json({ error: 'Failed to update request status' });
  }
});

router.delete('/delete/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ContentRequest.findByPk(id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    await request.destroy();

    return res.status(200).json({ message: 'Request deleted successfully' });

  } catch (error) {
    console.error('Error deleting request:', error);
    return res.status(500).json({ error: 'Failed to delete request' });
  }
});

module.exports = router;
