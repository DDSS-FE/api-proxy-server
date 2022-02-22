import express from "express";
import axios from "axios";
// import finnhub from "finnhub";
const finnhub = require("finnhub");
const yahooFinance = require("yahoo-finance");

const api_key = finnhub.ApiClient.instance.authentications["api_key"];
api_key.apiKey = "c83630aad3ift3bm2d9g";
const finnhubClient = new finnhub.DefaultApi();

// Data
const stockSymbols = ["AAPL", "TSLA", "NVDA", "AMD", "MSFT", "AMZN", "FB"];
const indexSymbols = [
  "^AXJO",
  "XIN9.FGI",
  "^STOXX50E",
  "^FCHI",
  "^GDAXI",
  "^HSI",
  "^N225",
  "^NSEI",
  "^AEX",
  "^STI",
  "^FTSE",
  "^NDX",
  "^RUT",
  "^GSPC",
  "^DJI",
  "^VIX",
];
const cryptoSymbols = [
  "BINANCE:BTCUSDT",
  "BINANCE:BCNBTC",
  "BINANCE:FARMBUSD",
  "BINANCE:XRPETH",
  "BINANCE:AGIXBTC",
  "BINANCE:RENBTCBTC",
  "BINANCE:DENTETH",
  "BINANCE:EZBTC",
  "BINANCE:ARPABTC",
  "BINANCE:AXSETH",
  "BINANCE:MOVRUSDT",
];

const fn = (data) => {
  const LEN = data.h.length;
  const arr = Array.from({ length: LEN }, () => {});
  const origin = Object.values(data);
  const c = [...origin[0]];
  const h = [...origin[1]];
  const l = [...origin[2]];
  const o = [...origin[3]];
  const t = [...origin[5]];

  return {
    candleData: arr.map((obj, i) => {
      return { l: l[i], h: h[i], o: o[i], c: c[i] };
    }),
    timeLineData: t,
  };
};

// 15, 30, 60, 1D, 1M 다 따로?
// to ~ from 어떤식으로 결정하지
const getStockCandles = async () => {
  try {
    return await new Promise((resolve) => {
      finnhubClient.stockCandles(
        "AAPL",
        "60",
        1643691600, // 미국시간 : 2월 1일 0시
        1644379200, // 미국시간 : 2월 8일 23시
        (error, data, response) => {
          resolve(fn(data));
        }
      );
    });
  } catch (err) {
    console.err(err);
  }
};

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
          resolve(fn(data));
        }
      );
    });
  } catch (err) {
    console.error(err);
  }
}

function getMarketInfo(symbol) {
  try {
    return new Promise((resolve) => {
      yahooFinance.quote(
        {
          symbol,
          modules: ["summaryDetail"], // see the docs for the full list
        },
        (err, quotes) => {
          const {
            summaryDetail: {
              dayLow,
              dayHigh,
              fiftyTwoWeekLow,
              fiftyTwoWeekHigh,
              previousClose,
              open,
              volume,
              averageVolume,
            },
          } = quotes;

          resolve({
            dayLow: dayLow.toFixed(2),
            dayHigh: dayHigh.toFixed(2),
            fiftyTwoWeekLow: fiftyTwoWeekLow.toFixed(2),
            fiftyTwoWeekHigh: fiftyTwoWeekHigh.toFixed(2),
            previousClose: previousClose.toFixed(2),
            open: open.toFixed(2),
            volume: volume.toLocaleString(),
            averageVolume: averageVolume.toLocaleString(),
          });
        }
      );
    });
  } catch (err) {
    console.error(err);
  }
}

function getQuote(symbol) {
  try {
    return new Promise((resolve) => {
      finnhubClient.quote(symbol, (error, data) => {
        resolve(data);
      });
    });
  } catch (error) {
    console.error(error);
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

apiRouter.get("/stock/candle", async (req, res) => {
  const data = await getStockCandles();

  res.status(200).json(data);
});

apiRouter.get("/market/info", async (req, res) => {
  const {
    query: { symbol },
  } = req;

  const data = await getMarketInfo(symbol);

  res.status(200).json(data);
});

apiRouter.get("/quote", async (req, res) => {
  const {
    query: { symbol },
  } = req;

  const data = await getQuote(symbol);

  res.status(200).json(data);
});

export default apiRouter;
