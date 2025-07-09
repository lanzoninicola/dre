export function validateOFXFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Validar extensão
  if (!file.name.toLowerCase().endsWith(".ofx")) {
    return { valid: false, error: "Arquivo deve ter extensão .ofx" };
  }

  // Validar tamanho (máximo 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: "Arquivo muito grande (máximo 10MB)" };
  }

  return { valid: true };
}
