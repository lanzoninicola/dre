// Função para formatar data de forma segura
export default function formatDate(
  date: string | Date | null | undefined
): string {
  if (!date) return "Data inválida";

  try {
    let dateObj: Date;

    if (typeof date === "string") {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }

    if (isNaN(dateObj.getTime())) {
      return "Data inválida";
    }

    return dateObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return "Data inválida";
  }
}
