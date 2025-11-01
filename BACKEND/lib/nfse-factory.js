// lib/nfse-factory.js
function onlyDigits(s) { return (s || '').replace(/\D/g, ''); }

function buildFromInvoice(invoice, customer) {
  const cfg = {
    prestador: {
      cnpj: process.env.PRESTADOR_CNPJ,
      im: process.env.PRESTADOR_IM,
      codMun: process.env.PRESTADOR_COD_MUNICIPIO,
    },
    servico: {
      item: process.env.SERVICO_ITEM_LISTA || '0107',
      cnae: process.env.SERVICO_CNAE,
      codTribMun: process.env.SERVICO_COD_TRIB_MUN,
      aliquota: Number(process.env.SERVICO_ALIQUOTA || '3'),
    },
    fiscal: {
      natureza: process.env.NATUREZA_OPERACAO || '1',
      simples: String(process.env.OPTANTE_SIMPLES || 'true') === 'true',
    },
  };

  const total = (invoice.total ?? 0) / 100;

  const taxId =
    (customer.tax_ids && customer.tax_ids.data && customer.tax_ids.data[0]?.value) ||
    customer.metadata?.cpf || customer.metadata?.cnpj || null;

  const addr = customer.address || {};
  const isCnpj = taxId && onlyDigits(taxId).length === 14;

  return {
    data_emissao: new Date(
      invoice.status_transitions?.paid_at ? invoice.status_transitions.paid_at * 1000 : Date.now()
    ).toISOString(),
    natureza_operacao: cfg.fiscal.natureza,
    optante_simples_nacional: cfg.fiscal.simples,
    prestador: {
      cnpj: cfg.prestador.cnpj,
      inscricao_municipal: cfg.prestador.im,
      codigo_municipio: cfg.prestador.codMun,
    },
    tomador: {
      ...(isCnpj ? { cnpj: onlyDigits(taxId) } : { cpf: onlyDigits(taxId || '') }),
      razao_social: customer.name || undefined,
      email: customer.email || undefined,
      endereco: {
        logradouro: addr.line1 || undefined,
        numero: addr.line2 || undefined, // ajuste conforme sua origem do “número”
        bairro: undefined,
        complemento: undefined,
        codigo_municipio: undefined, // preencha se tiver tabela IBGE pelo par cidade/UF
        uf: addr.state || undefined,
        cep: onlyDigits(addr.postal_code || ''),
      },
    },
    servico: {
      valor_servicos: total,
      aliquota: cfg.servico.aliquota,
      iss_retido: false,
      item_lista_servico: cfg.servico.item,
      codigo_cnae: cfg.servico.cnae,
      codigo_tributario_municipio: cfg.servico.codTribMun,
      discriminacao: `Serviços prestados – fatura ${invoice.number || invoice.id}`,
      // opcional: codigo_municipio de prestação, se aplicável
    },
  };
}

module.exports = { buildFromInvoice };
