export interface ContrastTheme {
  isLight: boolean;
  headingColor: string;
  textColor: string;
  mutedColor: string;
  cardBg: string;
  cardBorder: string;
  cardText: string;
  cardSubtext: string;
}

export function getContrastColors(bgColor?: string): ContrastTheme {
  if (!bgColor) {
    return {
      isLight: false,
      headingColor: "#FFFFFF",
      textColor: "#E5E7EB",
      mutedColor: "#9CA3AF",
      cardBg: "bg-black/60",
      cardBorder: "border-gray-800",
      cardText: "text-white",
      cardSubtext: "text-gray-400"
    };
  }

  const cleanHex = bgColor.trim().toLowerCase();
  if (cleanHex === "white" || cleanHex === "#fff" || cleanHex === "#ffffff") {
    return {
      isLight: true,
      headingColor: "#0A0A0A",
      textColor: "#374151",
      mutedColor: "#6B7280",
      cardBg: "bg-gray-50",
      cardBorder: "border-gray-200",
      cardText: "text-gray-900",
      cardSubtext: "text-gray-600"
    };
  }

  let hex = cleanHex.replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }

  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    const isLight = yiq >= 135;

    return {
      isLight,
      headingColor: isLight ? "#0A0A0A" : "#FFFFFF",
      textColor: isLight ? "#374151" : "#E5E7EB",
      mutedColor: isLight ? "#6B7280" : "#9CA3AF",
      cardBg: isLight ? "bg-gray-50" : "bg-[#111111]",
      cardBorder: isLight ? "border-gray-200" : "border-gray-800",
      cardText: isLight ? "text-gray-900" : "text-white",
      cardSubtext: isLight ? "text-gray-600" : "text-gray-400"
    };
  }

  return {
    isLight: false,
    headingColor: "#FFFFFF",
    textColor: "#E5E7EB",
    mutedColor: "#9CA3AF",
    cardBg: "bg-black/60",
    cardBorder: "border-gray-800",
    cardText: "text-white",
    cardSubtext: "text-gray-400"
  };
}
