const express = require('express');
const { Op } = require('sequelize'); 
const { User } = require('../models'); 
const bcrypt = require('bcrypt'); 
const router = express.Router();
const jwt  = require('jsonwebtoken')
router.post('/', async (req, res) => {
  const { token, password } = req.body;

  try {
  
    const user = await User.findOne({ 
      where: { 
        resetPasswordToken: token, 
        resetPasswordExpires: { [Op.gt]: Date.now() } 
      } 
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

  
    user.password = hashedPassword; 
    user.resetPasswordToken = null; 
    user.resetPasswordExpires = null; 
    await user.save();

    res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password." });
  }
});


router.post('/account', async (req, res) => {
  const { token, password } = req.body;

  try {
    // 1. Verifica e decodifica o token JWT
    const decoded = jwt.verify(token, process.env.TOKEN_VERIFY_ACCESS);

    // 2. Pega o id ou email do usuário do token decodificado
    const { id, email } = decoded;

    // 3. Procura o usuário pelo ID ou email
    const user = await User.findOne({ where: { id, email } });

    if (!user) {
      return res.status(400).json({ message: "Invalid token." });
    }

    // 4. Gera o hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Atualiza a senha e remove o token de redefinição, se estiver usando
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Error resetting password:", error);

    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: "Token expired." });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: "Invalid token." });
    }

    res.status(500).json({ message: "Error resetting password." });
  }
});



router.post('/', async (req, res) => {
  const { token, password } = req.body || {};

  if (!token || !password) {
    return res.status(400).json({ message: "Token e senha são obrigatórios." });
  }

  try {
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: Date.now() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ message: "Error resetting password." });
  }
});
module.exports = router;


module.exports = router;
