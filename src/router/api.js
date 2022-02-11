import express from "express";
import axios from "axios";
// import finnhub from "finnhub";
const finnhub = require("finnhub");

const api_key = finnhub.ApiClient.instance.authentications["api_key"];
api_key.apiKey = "c80k2baad3id4r2t6650";
const finnhubClient = new finnhub.DefaultApi();

// TODO:
// crypto 24시간, stock 장시간이 아니라서 방법 찾아야 함
// 우리나라 시간과 미국 시간 변환?
function getLineData(hours = 1) {
  try {
    return new Promise((resolve) => {
      const seconds = hours * 60 * 60; // hours * 1시간(3600초)

      finnhubClient.cryptoCandles(
        "BINANCE:BTCUSDT",
        "1",
        Math.floor(Date.now() / 1000) - 3600,
        Math.floor(Date.now() / 1000),
        (error, data, response) => {
          resolve(
            [...data.c].map((close, idx) => ({
              close,
              time: data.t[idx],
            }))
          );
        }
      );
    });
  } catch (err) {
    console.error(err);
  }
}

function getCandleData(hours = 1) {
  try {
    return new Promise((resolve) => {
      const seconds = hours * 60 * 60; // hours * 1시간(3600초)

      finnhubClient.cryptoCandles(
        "BINANCE:BTCUSDT",
        "1",
        Math.floor(Date.now() / 1000) - 3600,
        Math.floor(Date.now() / 1000),
        (error, data, response) => {
          resolve(
            [...data.c].map((close, idx) => ({
              open: data.o[idx],
              close,
              high: data.h[idx],
              low: data.l[idx],
              time: data.t[idx],
            }))
          );
        }
      );
    });
  } catch (err) {
    console.error(err);
  }
}

const apiRouter = express.Router();

apiRouter.get("/", (req, res) => res.send("Hello"));

apiRouter.get("/crypto/line", async (req, res) => {
  const data = await getLineData();
  res.status(200).json(data);
});

apiRouter.get("/crypto/candle", async (req, res) => {
  const data = await getCandleData();
  res.status(200).json(data);
});

export default apiRouter;
