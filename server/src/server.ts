import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "API Endpoint Fusion Heart dapat beroperasi!" });
});

app.listen(PORT, () => {
  console.log(`Yeay, servernya bisa jalan di port: ${PORT}`);
});
