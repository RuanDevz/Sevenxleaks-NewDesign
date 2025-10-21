const express = require('express');
const router = express.Router();
const { User } = require('../models');
const bcrypt = require('bcrypt');
const { sign } = require('jsonwebtoken');
const Authmiddleware = require('../Middleware/Auth');
const isAdmin = require('../Middleware/isAdmin'); 
const dotenv = require('dotenv');
const { Op } = require("sequelize");

dotenv.config();

router.get('/', Authmiddleware, isAdmin, async (req, res) => {
    try {
        const getallusers = await User.findAll();
        res.status(200).json(getallusers);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar usuários." });
    }
});

router.get('/dashboard', Authmiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findByPk(userId);

         const now = new Date();
         if (!user.vipExpirationDate || new Date(user.vipExpirationDate) < now) {
             if (user.isVip) {
                 await user.update({ isVip: false });
             }
         }
        return res.json({
            name: user.name,
            email: user.email,
            isVip: user.isVip,
            isAdmin: user.isAdmin,
            favorites: user.favorites,
            vipExpirationDate: user.vipExpirationDate,
            createdAt: user.createdAt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

router.post('/cancel-subscription', async (req, res) => {
    const { userId } = req.body;
  
    try {
      const user = await User.findByPk(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: 'No subscription found to cancel.' });
      }
  
      const subscription = await stripe.subscriptions.del(user.stripeSubscriptionId);
  
      await user.update({
        isVip: false,
        stripeSubscriptionId: null,
      });
  
      res.status(200).json({
        message: 'Subscription canceled successfully. You will retain VIP access until the end of the current billing period.',
        vipExpirationDate: user.vipExpirationDate,
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

router.get('/status', Authmiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found!' });
        }

        const status = {
            isAdmin: user.isAdmin,
            isVip: user.isVip
        };

        res.status(200).json(status);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao verificar status do usuário" });
    }
});
  
  

router.put('/disable-user/:email', Authmiddleware, isAdmin, async (req, res) => {
    const { email } = req.params;
  
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado!" });
      }
  
      await user.update({ isVip: false, isDisabled: true });
  
      res.status(200).json({ message: "VIP desativado com sucesso!" });
    } catch (error) {
      console.error("Erro ao desabilitar VIP:", error);
      res.status(500).json({ error: "Erro ao desabilitar o VIP." });
    }
  });

  router.get('/vip-disabled-users', Authmiddleware, isAdmin, async (req, res) => {
    try {
      const vipDisabledUsers = await User.findAll({
        where: { isDisabled: true }, 
        attributes: ['id', 'name', 'email', 'vipExpirationDate', 'isDisabled'] 
      });
  
      const formattedUsers = vipDisabledUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        vipExpirationDate: user.vipExpirationDate 
          ? user.vipExpirationDate.toISOString() 
          : "Não definida",
        isDisabled: user.isDisabled 
      }));
  
      res.status(200).json(formattedUsers);
    } catch (error) {
      console.error("Erro ao buscar usuários VIP desabilitados:", error);
      res.status(500).json({ error: "Erro ao buscar usuários VIP desabilitados." });
    }
  });
  
  

router.get('/is-admin/:email', async (req, res) => {
    const { email } = req.params;
  
    try {
      const user = await User.findOne({ where: { email } });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found!' });
      }
  
      res.status(200).json({ isAdmin: user.isAdmin });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao verificar status de admin' });
    }
  });
  

router.get('/is-vip/:email', async (req, res) => {
    const { email } = req.params;

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: 'User not found!' });
        }

        res.status(200).json({ isVip: user.isVip });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error checking VIP status' });
    }
});

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    console.log('[REGISTER] Body recebido:', { name, email });

    try {
        const hashpassword = await bcrypt.hash(password, 10);
        console.log('[REGISTER] Hash gerado com sucesso');

        const existingemail = await User.findOne({ where: { email } });
        console.log('[REGISTER] Verificação de email existente:', existingemail ? 'Encontrado' : 'Não encontrado');

        if (existingemail) {
            console.warn('[REGISTER] Email já cadastrado:', email);
            return res.status(409).json({ error: 'Email already registered!' });
        }

        const createnewuser = await User.create({
            name,
            email,
            password: hashpassword,
            isVip: false,
            isAdmin: false
        });
        console.log('[REGISTER] Usuário criado com ID:', createnewuser.id);

        res.status(201).json({
            name: createnewuser.name,
            email: createnewuser.email,
        });

    } catch (error) {
        console.error('[REGISTER] Erro ao registrar usuário:', error);
        res.status(500).json({ error: 'Erro ao registrar usuário.' });
    }
});



router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('[LOGIN] Tentando login com:', email);

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            console.warn('[LOGIN] Usuário não encontrado:', email);
            return res.status(401).json({ error: "Credenciais incorretas!" });
        }

        const passwordMatch = bcrypt.compareSync(password, user.password);
        console.log('[LOGIN] Comparação de senha:', passwordMatch);

        if (!passwordMatch) {
            return res.status(401).json({ error: "Credenciais incorretas!" });
        }

        if (!process.env.TOKEN_VERIFY_ACCESS) {
            console.error('[LOGIN] TOKEN_VERIFY_ACCESS não configurado no ambiente!');
            return res.status(500).json({ error: 'Token inválido.' });
        }

        const accesstoken = sign({ email: user.email, id: user.id }, process.env.TOKEN_VERIFY_ACCESS);
        console.log('[LOGIN] Token gerado com sucesso');

        res.json({ token: accesstoken, name: user.name });
    } catch (error) {
        console.error('[LOGIN] Erro inesperado:', error);
        res.status(500).json({ error: "Erro interno no login" });
    }
});



//
router.get('/vip-users', Authmiddleware, isAdmin, async (req, res) => {
    try {
        const vipUsers = await User.findAll({
            where: {
                isVip: true
            },
            attributes: ['name', 'email', 'vipExpirationDate'] 
        });

        const formattedVipUsers = vipUsers.map(user => ({
            name: user.name,
            email: user.email,
            vipExpirationDate: user.vipExpirationDate ? user.vipExpirationDate.toISOString() : 'Não definida' 
        }));

        res.status(200).json(formattedVipUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar usuários VIP." });
    }
});

router.put('/remove-vip/:email', Authmiddleware, isAdmin, async (req, res) => {
    const { email } = req.params;

    try {
        const user = await User.findOne({ where: { email } }); 
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado!' });
        }

        await user.update({ isVip: false, vipExpirationDate: null });
        res.status(200).json({ message: 'VIP removido com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover VIP.' });
    }
});

router.put('/remove-all-expired-vip', Authmiddleware, isAdmin, async (req, res) => {
    try {
        const expiredUsers = await User.findAll({
            where: {
                isVip: true,
                vipExpirationDate: { [Op.lt]: new Date() } 
            }
        });

        for (const user of expiredUsers) {
            await user.update({ isVip: false, vipExpirationDate: null });
        }

        res.status(200).json({ message: 'VIPs vencidos removidos com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover VIPs vencidos.' });
    }
});


router.get('/user/:email', Authmiddleware, isAdmin, async (req, res) => {
    const { email } = req.params;

    try {
        const user = await User.findOne({
            where: { email },
            attributes: ['id', 'name', 'email', 'isVip', 'isAdmin', 'vipExpirationDate', 'createdAt', 'isDisabled']
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado!' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Erro ao buscar usuário por e-mail:", error);
        res.status(500).json({ error: 'Erro interno ao buscar usuário.' });
    }
});

router.put("/update-profile-image", Authmiddleware, async (req, res) => {
  try {
    const { profileImage } = req.body;
    const userId = req.user.id; // vem do token

    if (!profileImage) {
      return res.status(400).json({ error: "URL da imagem é obrigatória" });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    user.profileImage = profileImage;
    await user.save();

    return res.json({ message: "Imagem de perfil atualizada com sucesso", user });
  } catch (error) {
    console.error("Erro ao atualizar imagem:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/profile-image", Authmiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // vem do token

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    return res.json({ profileImage: user.profileImage });
  } catch (error) {
    console.error("Erro ao buscar imagem de perfil:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.delete('/delete-account/:email', Authmiddleware, async (req, res) => {
    const { email } = req.params;
    const loggedInUserId = req.user.id;

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado!' });
        }

        if (user.id !== loggedInUserId) {
            return res.status(403).json({ error: 'Você não tem permissão para excluir essa conta.' });
        }

        await user.destroy();

        res.status(200).json({ message: 'Conta deletada com sucesso!' });
    } catch (error) {
        console.error("Erro ao deletar conta:", error);
        res.status(500).json({ error: 'Erro interno ao deletar conta.' });
    }
});


router.get('/user-data', Authmiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado!' });
        }

        const benefits = user.isVip ? [
            "Access to 3 years of content with no ads.",
            "Access to all content before it's posted for free users.",
            "VIP badge on our Discord community.",
            "Early access to exclusive content and special newsletters.",
            "Priority support for viewing and accessing all content.",
            "Exclusive Q&A sessions, webinars, and personalized content."
        ] : [];

        res.status(200).json({
            name: user.name,
            email: user.email,
            isVip: user.isVip,
            benefits: benefits,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

module.exports = router;
