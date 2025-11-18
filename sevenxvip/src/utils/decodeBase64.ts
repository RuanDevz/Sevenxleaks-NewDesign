export const decodeBase64 = (base64: string) => {
  try {
    // remove o 3º caractere que foi inserido propositalmente
    const cleanBase64 = base64.slice(0, 2) + base64.slice(3);

    const decoded = atob(cleanBase64);
    return JSON.parse(decoded);
  } catch (err) {
    console.error("Erro ao decodificar:", err);
    return null;
  }
};
