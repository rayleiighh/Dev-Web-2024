require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connecté !"))
  .catch((err) => console.error("❌ Erreur MongoDB :", err));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
global.io = io;

io.on("connection", (socket) => {
  console.log("🟢 Nouveau client connecté :", socket.id);
});

app.use("/api/utilisateurs", require("./routes/utilisateurRoutes"));
app.use("/api/appareils", require("./routes/appareilRoutes"));
app.use("/api/consommations", require("./routes/consommationRoutes"));
app.use("/api/multiprises", require("./routes/multiprisesRoutes"));
app.use("/api/device-auth", require("./routes/deviceAuthRoutes"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur + WebSocket actif sur http://localhost:${PORT}`);
});
