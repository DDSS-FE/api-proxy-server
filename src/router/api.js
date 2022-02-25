import express, { query } from 'express';
import axios from 'axios';

// import finnhub from "finnhub";
const finnhub = require('finnhub');
const yahooFinance = require('yahoo-finance');

const api_key = finnhub.ApiClient.instance.authentications['api_key'];
api_key.apiKey = 'c83630aad3ift3bm2d9g';
const finnhubClient = new finnhub.DefaultApi();

// Data
const symbols = {
  stock: ['AAPL', 'TSLA', 'NVDA', 'AMD', 'MSFT', 'AMZN', 'FB', 'BABA'],
  crypto: [
    'BINANCE:BTCUSDT',
    'BINANCE:ETHUSDT',
    'BINANCE:BNBUSDT',
    'BINANCE:XRPUSDT',
    'BINANCE:ADAUSDT',
    'BINANCE:LUNAUSDT',
    'BINANCE:AVAXUSDT',
    'BINANCE:DOGEUSDT',
  ],
};

const name = {
  AAPL: '애플',
  TSLA: '테슬라',
  NVDA: '엔비디아',
  AMD: 'AMD',
  MSFT: '마이크로소프트',
  AMZN: '아마존닷컴',
  FB: '메타',
  BABA: '알리바바 ADR',
  'BINANCE:BTCUSDT': '비트코인',
  'BINANCE:ETHUSDT': '이더리움',
  'BINANCE:BNBUSDT': '바이낸스코인',
  'BINANCE:XRPUSDT': '리플',
  'BINANCE:ADAUSDT': '에이다',
  'BINANCE:LUNAUSDT': '루나',
  'BINANCE:AVAXUSDT': '아발란체',
  'BINANCE:DOGEUSDT': '도지코인',
};

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

const periodToSeconds = {
  15: 60 * 15 * 100 * 4,
  30: 60 * 30 * 100 * 2,
  60: 60 * 60 * 100,
  D: 60 * 60 * 24 * 80,
  W: 60 * 60 * 24 * 7 * 80,
  M: 60 * 60 * 24 * 30 * 80,
};

const getStockCandles = async (symbol, period) => {
  const start = Math.floor(Date.now() / 1000) - periodToSeconds[period];
  const end = Math.floor(Date.now() / 1000);

  try {
    return await new Promise((resolve) => {
      finnhubClient.stockCandles(
        symbol,
        period,
        start,
        end,
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
        'BINANCE:BTCUSDT',
        '1',
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
        'BINANCE:BTCUSDT',
        '1',
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
          modules: ['summaryDetail'], // see the docs for the full list
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

function getQuoteBySymbol(symbol) {
  function formatQuote(symbol, { c, d, dp }) {
    return { name: name[symbol], symbol, c, d, dp };
  }
  try {
    return new Promise((resolve) => {
      finnhubClient.quote(symbol, (_, data) => {
        resolve(formatQuote(symbol, data));
      });
    });
  } catch (error) {
    console.error(error);
  }
}

async function getQuoteByCategory(category) {
  try {
    const res = await Promise.all(
      symbols[category].map(async (symbol, idx) => ({
        id: idx + 1,
        ...(await getQuoteBySymbol(symbol)),
      }))
    );
    return res;
  } catch (error) {
    console.error(error);
  }
}

const newsFormat = (newsObj) => {
  const emptyImageUrl =
    'https://ppss.kr/wp-content/uploads/2020/07/01-4-540x304.png';

  const result = newsObj.value.map((detailNews) => {
    let { name, url, image, description, provider, datePublished } = detailNews;

    image = {
      width: !!image ? image.thumbnail.width : 100,
      height: !!image ? image.thumbnail.height : 100,
      contentURL: !!image ? image.contentUrl : emptyImageUrl,
    };
    provider = provider[0].name;
    datePublished = `${datePublished.slice(0, 10)} ${datePublished.slice(
      11,
      19
    )}`;
    return { name, url, image, description, provider, datePublished };
  });

  return result;
};

function getNews(queryString) {
  try {
    let options = {
      method: 'GET',
      url: 'https://bing-news-search1.p.rapidapi.com/news/search',
      params: {
        q: queryString,
        count: '15',
        freshness: 'Day',
        originalImg: 'true',
        textFormat: 'Raw',
        safeSearch: 'Off',
      },
      headers: {
        'x-bingapis-sdk': 'true',
        'x-rapidapi-host': 'bing-news-search1.p.rapidapi.com',
        'x-rapidapi-key': 'a8e49c7bb1msh57d1dde3d79217bp1651fbjsn079f1071f121',
      },
    };

    return new Promise((resolve) =>
      axios
        .request(true)
        .then(function () {
          resolve(newsFormat(response.data));
        })
        .catch(function (error) {
          console.error(error);
        })
    );
  } catch (error) {
    console.error(error);
  }
}

const apiRouter = express.Router();

apiRouter.get('/', (req, res) => res.send('Hello'));

apiRouter.get('/crypto/line', async (req, res) => {
  const data = await getLineData();
  res.status(200).json(data);
});

apiRouter.get('/crypto/candle', async (req, res) => {
  const data = await getCandleData();
  res.status(200).json(data);
});

apiRouter.get('/stock/candle', async (req, res) => {
  const {
    query: { symbol, period },
  } = req;

  const data = await getStockCandles(symbol, period);

  res.status(200).json(data);
});

apiRouter.get('/market/info', async (req, res) => {
  const {
    query: { symbol },
  } = req;

  if (!!symbol) {
    const data = await getMarketInfo(symbol);

    res.status(200).json(data);
  }
});

apiRouter.get('/quote', async (req, res) => {
  const {
    query: { symbol, category },
  } = req;

  if (!!category) {
    const data = await getQuoteByCategory(category);
    res.status(200).json(data);
  }
  if (!!symbol) {
    const data = await getQuoteBySymbol(symbol);
    res.status(200).json(data);
  }
});

apiRouter.get('/crypto/symbols', async (req, res) => {
  const data = await getCryptoSymbols();

  res.status(200).json(data);
});

apiRouter.get('/news', async (req, res) => {
  const {
    query: { queryString },
  } = req;

  const data = await getNews(queryString);
  res.status(200).json(data);
});

export default apiRouter;
