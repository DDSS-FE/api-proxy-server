import express from "express";
import apiRouter from "./router/api";
import cors from "cors";

const PORT = 4000;

const app = express();

app.use(cors());

app.use("/", apiRouter);

app.listen(PORT, () => console.log(`Listening on: http://localhost:${PORT}`));
