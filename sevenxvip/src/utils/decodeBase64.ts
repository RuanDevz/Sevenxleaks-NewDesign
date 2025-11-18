export const decodeBase64 = (base64: string) => {
  try {
    const decoded = atob(base64);
    return JSON.parse(decoded);
  } catch (err) {
    console.error("Erro ao decodificar:", err);
    return null;
  }
};
