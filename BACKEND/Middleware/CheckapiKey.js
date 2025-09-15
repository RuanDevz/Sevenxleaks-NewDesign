module.exports = function checkApiKey(req, res, next) {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const apiKey = req.headers['x-api-key'];
  const adminKey = req.headers['x-admin-key'];

  const allowedApiKey = process.env.VITE_FRONTEND_API_KEY;
  const allowedAdminKey = process.env.ADMIN_API_KEY;

  const allowedOrigins = [
    'https://sevenxleaks.com',
    'http://localhost:5173',
    'https://newdesign-livid.vercel.app',
    /.*\.vercel\.app$/
  ];

  const isAllowedOrigin = () => {
    if (!origin && !referer) return true; // Permite requisições sem origin
    
    // Verifica origins exatos
    if (origin && allowedOrigins.some(o => 
      typeof o === 'string' ? o === origin : o.test(origin)
    )) {
      return true;
    }
    
    // Verifica referer
    if (referer && allowedOrigins.some(o => 
      typeof o === 'string' ? referer.startsWith(o) : o.test(referer)
    )) {
      return true;
    }
    
    return false;
  };

  // ✅ Se for admin com chave correta → libera tudo
  if (adminKey && adminKey === allowedAdminKey) {
    return next();
  }

  // ✅ Se for GET com chave do frontend → libera (origem verificada separadamente)
  if (req.method === 'GET' && apiKey === allowedApiKey) {
    return next();
  }

  // ✅ Para desenvolvimento, permite requisições locais
  if (process.env.NODE_ENV === 'development' && 
      (origin?.includes('localhost') || referer?.includes('localhost'))) {
    return next();
  }

  // Log para debug na Vercel
  console.log('API Key Check Failed:', {
    method: req.method,
    origin,
    referer,
    hasApiKey: !!apiKey,
    hasAdminKey: !!adminKey,
    path: req.path
  });

  // ❌ Bloqueia o resto
  return res.status(403).json({ error: 'Unauthorized access' });
};
