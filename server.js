const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

if (!MONGO_URI) {
  console.error("Erro: MONGO_URI não encontrada no arquivo .env");
  process.exit(1);
}

async function conectarMongoDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB conectado com sucesso");
  } catch (erro) {
    console.error("Erro ao conectar MongoDB:");
    console.error(erro.message);
  }
}

conectarMongoDB();

const capturaSchema = new mongoose.Schema({
  dados: Object,
  criadoEm: {
    type: Date,
    default: Date.now
  }
});

const Captura = mongoose.model("Captura", capturaSchema);

app.get("/", (req, res) => {
  res.json({
    mensagem: "API do honeypot rodando",
    mongoStatus: mongoose.connection.readyState
  });
});

app.post("/capturas", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        mensagem: "MongoDB ainda não está conectado",
        status: mongoose.connection.readyState
      });
    }

    const novaCaptura = await Captura.create({
      dados: req.body
    });

    res.status(201).json({
      mensagem: "Captura salva com sucesso",
      id: novaCaptura._id
    });

  } catch (erro) {
    res.status(500).json({
      mensagem: "Erro ao salvar captura",
      erro: erro.message
    });
  }
});

app.get("/capturas", async (req, res) => {
  try {
    const capturas = await Captura.find()
      .sort({ criadoEm: -1 })
      .limit(100);

    res.json(capturas);
  } catch (erro) {
    res.status(500).json({
      mensagem: "Erro ao buscar capturas",
      erro: erro.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});