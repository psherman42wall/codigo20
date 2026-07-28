const BANCO_DE_CARTAS = [
  // --- CARTAS INICIAIS (1 a 20) ---
  { id: 1, nome: "Maçã Coração", url: "cartas/carta_01.png", tags: ["comida", "fruta", "coração", "amor", "órgão"] },
  { id: 2, nome: "Cerejas Anilhas", url: "cartas/carta_02.png", tags: ["fruta", "esporte", "peso", "academia", "força"] },
  { id: 3, nome: "Limão Foguete", url: "cartas/carta_03.png", tags: ["fruta", "espaço", "voar", "azedo", "viagem"] },
  { id: 4, nome: "Moto Queijo", url: "cartas/carta_04.png", tags: ["veículo", "comida", "queijo", "roda", "velocidade"] },
  { id: 5, nome: "Escavadeira Mão", url: "cartas/carta_05.png", tags: ["máquina", "construção", "mão", "corpo", "terra"] },
  { id: 6, nome: "Fusca Capô", url: "cartas/carta_06.png", tags: ["carro", "veículo", "motor", "estrada", "antigo"] },
  { id: 7, nome: "Abacaxi Granada", url: "cartas/carta_07.png", tags: ["fruta", "arma", "perigo", "tropical", "explosão"] },
  { id: 8, nome: "Bicicleta Galho", url: "cartas/carta_08.png", tags: ["veículo", "natureza", "planta", "árvore", "esporte"] },
  { id: 9, nome: "Morango Vulcão", url: "cartas/carta_09.png", tags: ["fruta", "fogo", "fumaça", "natureza", "quente"] },
  { id: 10, nome: "Foguete Lápis", url: "cartas/carta_10.png", tags: ["escola", "espaço", "lua", "voar", "escrever"] },
  { id: 11, nome: "Tartaruga Skate", url: "cartas/carta_11.png", tags: ["animal", "esporte", "roda", "devagar", "casco"] },
  { id: 12, nome: "Melancia Relógio", url: "cartas/carta_12.png", tags: ["fruta", "tempo", "horas", "verão", "doce"] },
  { id: 13, nome: "Astronauta Capacetinho", url: "cartas/carta_13.png", tags: ["espaço", "pessoa", "lua", "capacete", "futuro"] },
  { id: 14, nome: "Trem Trilho", url: "cartas/carta_14.png", tags: ["veículo", "fumaça", "viagem", "trilho", "transporte"] },
  { id: 15, nome: "Panela Mágica", url: "cartas/carta_15.png", tags: ["cozinha", "comida", "mágia", "sopa", "quente"] },
  { id: 16, nome: "Cactus Luva", url: "cartas/carta_16.png", tags: ["planta", "deserto", "mão", "espinho", "verde"] },
  { id: 17, nome: "Televisão Aquário", url: "cartas/carta_17.png", tags: ["casa", "tecnologia", "peixe", "água", "mar"] },
  { id: 18, nome: "Lâmpada Moinho", url: "cartas/carta_18.png", tags: ["luz", "ideia", "vento", "energia", "vidro"] },
  { id: 19, nome: "Barco Garrafa", url: "cartas/carta_19.png", tags: ["mar", "oceano", "vidro", "viagem", "miniature"] },
  { id: 20, nome: "Chave Castelo", url: "cartas/carta_20.png", tags: ["metal", "segredo", "porta", "história", "construção"] },

  // --- CARTAS CONCEITUAIS (21 a 30) ---
  { id: 21, nome: "Bule Pássaro", url: "cartas/carta_21.png", tags: ["chá", "voar", "asa", "pássaro", "casa"] },
  { id: 22, nome: "Ampulheta Gato", url: "cartas/carta_22.png", tags: ["tempo", "gato", "vidro", "areia", "animal"] },
  { id: 23, nome: "Balão Lâmpada", url: "cartas/carta_23.png", tags: ["luz", "voar", "céu", "ideia", "viagem"] },
  { id: 24, nome: "Árvore Cérebro", url: "cartas/carta_24.png", tags: ["natureza", "mente", "pensamento", "planta", "corpo"] },
  { id: 25, nome: "Girassol Olho", url: "cartas/carta_25.png", tags: ["visão", "flor", "olhar", "sol", "planta"] },
  { id: 26, nome: "Piano Escada", url: "cartas/carta_26.png", tags: ["música", "lua", "noite", "subir", "instrumento"] },
  { id: 27, nome: "Guarda-chuva Nuvem", url: "cartas/carta_27.png", tags: ["chuva", "água", "tempo", "tempestade", "proteção"] },
  { id: 28, nome: "Baleia Dirigível", url: "cartas/carta_28.png", tags: ["oceano", "voar", "máquina", "grande", "animal"] },
  { id: 29, nome: "Anzol Lua", url: "cartas/carta_29.png", tags: ["pesca", "espaço", "noite", "estrela", "mar"] },
  { id: 30, nome: "Cacto Lápis", url: "cartas/carta_30.png", tags: ["escrever", "desenhar", "deserto", "planta", "escola"] },

  // --- LUGARES (31 a 40) ---
  { id: 31, nome: "Pirâmide Ampulheta", url: "cartas/carta_31.png", tags: ["lugar", "tempo", "história", "areia", "deserto"] },
  { id: 32, nome: "Ponte de Teclas de Piano", url: "cartas/carta_32.png", tags: ["lugar", "música", "travessia", "arquitetura", "rio"] },
  { id: 33, nome: "Castelo de Cartas", url: "cartas/carta_33.png", tags: ["lugar", "jogo", "papel", "rei", "construção"] },
  { id: 34, nome: "Vulcão Chaleira", url: "cartas/carta_34.png", tags: ["lugar", "fogo", "bebida", "montanha", "quente"] },
  { id: 35, nome: "Faroeste na Garrafa", url: "cartas/carta_35.png", tags: ["lugar", "vidro", "miniatura", "história", "deserto"] },
  { id: 36, nome: "Ilha Prato de Comida", url: "cartas/carta_36.png", tags: ["lugar", "comida", "praia", "oceano", "natureza"] },
  { id: 37, nome: "Labirinto Impressão Digital", url: "cartas/carta_37.png", tags: ["lugar", "mistério", "corpo", "identidade", "caminho"] },
  { id: 38, nome: "Estádio Fruteira", url: "cartas/carta_38.png", tags: ["lugar", "esporte", "casa", "público", "fruteira"] },
  { id: 39, nome: "Caverna Boca de Dragão", url: "cartas/carta_39.png", tags: ["lugar", "animal", "pedra", "escuridão", "perigo"] },
  { id: 40, nome: "Cidade no Livro Aberto", url: "cartas/carta_40.png", tags: ["lugar", "conhecimento", "arquitetura", "papel", "leitura"] },

  // --- OBJETOS DE CASA (41 a 50) ---
  { id: 41, nome: "Chaleira Passarinho", url: "cartas/carta_41.png", tags: ["casa", "ave", "bebida", "som", "cozinha"] },
  { id: 42, nome: "Garfo Pente", url: "cartas/carta_42.png", tags: ["casa", "corpo", "comida", "aço", "beleza"] },
  { id: 43, nome: "Abajur Água-Viva", url: "cartas/carta_43.png", tags: ["casa", "mar", "luz", "vidro", "animal"] },
  { id: 44, nome: "Cadeira Centauro", url: "cartas/carta_44.png", tags: ["casa", "animal", "móvel", "madeira", "assento"] },
  { id: 45, nome: "Sofá Nuvens", url: "cartas/carta_45.png", tags: ["casa", "tempo", "descanso", "céu", "móvel"] },
  { id: 46, nome: "Relógio de Parede Olho", url: "cartas/carta_46.png", tags: ["casa", "tempo", "corpo", "redondo", "visão"] },
  { id: 47, nome: "Vassoura Rabo de Raposa", url: "cartas/carta_47.png", tags: ["casa", "animal", "limpeza", "madeira", "laranja"] },
  { id: 48, nome: "Espelho Poço de Água", url: "cartas/carta_48.png", tags: ["casa", "reflexo", "água", "mistério", "decoração"] },
  { id: 49, nome: "Xícara de Vulcão", url: "cartas/carta_49.png", tags: ["casa", "bebida", "fogo", "quente", "manhã"] },
  { id: 50, nome: "Tesoura Pernas de Bailarina", url: "cartas/carta_50.png", tags: ["casa", "dança", "corte", "esporte", "aço"] }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BANCO_DE_CARTAS;
}