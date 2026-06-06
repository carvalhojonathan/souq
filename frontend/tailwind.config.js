/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // <-- ESSENCIAL: Ativa o modo escuro manual via classe
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // As suas Novas Cores Base Oficiais
        jaipur: {
          green: "#0F6F6D",
          gold: "#D8A03A",
          red: "#B73556",
        },

        // Mapeamento automático para aplicar no código que já existe:
        emerald: "#0F6F6D", // Substitui o verde antigo pelo Novo Verde
        ruby: "#B73556", // Substitui o vermelho escuro pelo Novo Vermelho
        desert: {
          light: "#fdf6e3",
          base: "#ebd5b3",
          dark: "#D8A03A", // Substitui os botões secundários pelo Novo Dourado
        },

        // Cores das mercadorias (mantidas do design original)
        goods: {
          diamond: "#e0f7fa",
          gold: "#ffd700",
          silver: "#e2e8f0",
          cloth: "#d53f8c",
          spice: "#dd6b20",
          leather: "#7b341e",
          camel: "#d69e2e",
        },
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
