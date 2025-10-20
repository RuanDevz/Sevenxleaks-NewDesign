# Configuração de Múltiplas Contas Stripe

Este documento explica como o sistema agora suporta duas contas Stripe simultaneamente.

## Visão Geral

O sistema foi configurado para trabalhar com duas contas Stripe:
- **Conta V1 (antiga)**: Gerencia todas as assinaturas existentes
- **Conta V2 (PJ/nova)**: Gerencia todas as novas assinaturas criadas a partir de agora

## Arquitetura

### 1. StripeService (`Services/StripeService.js`)
Serviço centralizado que gerencia múltiplas instâncias do Stripe. Ele:
- Mantém clientes separados para cada conta Stripe
- Identifica automaticamente qual conta usar baseado no contexto
- Fornece métodos para recuperar clientes, price IDs e webhook secrets

### 2. Modelo User (`models/user.js`)
Adicionado novo campo:
- `stripeAccountVersion`: Identifica qual conta Stripe gerencia a assinatura do usuário ('v1' ou 'v2')

### 3. Migration
Criada migration em `migrations/20250120000000-add-stripe-account-version.js` que adiciona o campo `stripeAccountVersion` à tabela Users.

## Variáveis de Ambiente

Configure as seguintes variáveis no seu arquivo `.env`:

### Conta V1 (Antiga)
```
STRIPE_SECRET_KEY=sk_test_sua_chave_v1
STRIPE_PRICEID_MONTHLY=price_id_mensal_v1
STRIPE_PRICEID_ANNUAL=price_id_anual_v1
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_v1
```

### Conta V2 (Nova - PJ)
```
STRIPE_SECRET_KEY_V2=sk_test_sua_chave_v2
STRIPE_PRICEID_MONTHLY_V2=price_id_mensal_v2
STRIPE_PRICEID_ANNUAL_V2=price_id_anual_v2
STRIPE_WEBHOOK_SECRET_V2=whsec_seu_webhook_v2
```

## Como Funciona

### Novas Assinaturas
1. Quando um usuário cria uma nova assinatura (`routes/payment.js`):
   - O sistema usa automaticamente a Conta V2 (PJ)
   - O campo `stripeAccountVersion` é definido como 'v2'

### Assinaturas Existentes
1. Usuários com assinaturas antigas:
   - Mantêm `stripeAccountVersion` como 'v1' (ou null, tratado como 'v1')
   - Todas as operações (renovação, cancelamento, portal) usam a Conta V1

### Webhooks
1. O webhook (`routes/stripewebhook.js`) agora:
   - Tenta validar a assinatura com ambas as contas
   - Identifica automaticamente de qual conta o evento veio
   - Processa o evento usando a conta correta

### Operações do Usuário
Todas as rotas foram atualizadas para identificar a conta correta:

- **Customer Portal** (`routes/stripeCustomerPortal.js`)
- **Cancelamento** (`routes/Cancelsubscription.js`)
- **Renovações** (via webhook `invoice.paid`)

## Configuração no Stripe

### Para Conta V2 (Nova)
1. Acesse o Dashboard da sua conta PJ no Stripe
2. Vá em **Developers > API Keys** e copie a Secret Key
3. Crie os produtos e preços para planos mensal e anual
4. Vá em **Developers > Webhooks** e configure um novo endpoint
5. Configure os eventos necessários:
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.deleted`
6. Copie o Webhook Secret

### Configuração dos Webhooks
Você precisará configurar **dois webhooks separados** no Stripe:

1. **Webhook V1**: Aponta para sua URL usando o endpoint secret V1
2. **Webhook V2**: Aponta para a mesma URL usando o endpoint secret V2

Ambos apontam para a mesma rota, mas o sistema identifica automaticamente qual conta enviou o evento.

## Executando a Migration

Quando seu banco de dados estiver disponível, execute:

```bash
cd BACKEND
npx sequelize-cli db:migrate
```

Isso adicionará o campo `stripeAccountVersion` à tabela Users.

## Testes

Após a configuração:

1. Teste criar uma nova assinatura - deve usar Conta V2
2. Verifique que usuários antigos ainda conseguem acessar o portal - usa Conta V1
3. Teste cancelamento para ambos os tipos de conta
4. Teste webhooks de renovação para ambas as contas

## Comportamento Padrão

- **Novas assinaturas**: Sempre usa Conta V2 (PJ)
- **Assinaturas sem versão definida**: Tratadas como V1 (retrocompatibilidade)
- **Fallback**: Se não houver versão, assume V1 para segurança

## Escalabilidade

Esta arquitetura permite adicionar facilmente mais contas Stripe no futuro:
1. Adicione as credenciais no StripeService
2. Defina quando usar a nova conta
3. Não requer mudanças nas rotas existentes
