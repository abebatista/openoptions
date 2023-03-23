import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import moment from 'moment';
import limit from 'p-limit';
import { fileURLToPath } from 'url';
import path from 'path';

const app = express();

const PORT = process.env.PORT || 3000; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the client directory
app.use(express.static(path.join(path.dirname(new URL(import.meta.url).pathname), 'client')));

// Serve the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(path.dirname(new URL(import.meta.url).pathname), 'client', 'index.html'));
});

dotenv.config();
const limitPromise = limit(120, 60);
const token = process.env.API_TOKEN;

app.use(express.json());

app.get('/strategies', async (req, res) => {
  try {
    const optionSymbols = req.query.symbols?.split(',') || [];
    const target = parseFloat(req.query.target) || 0;

    const allStrategies = [];
    for (const optionSymbol of optionSymbols) {
      const expirations = await getExpirations(optionSymbol, token);
      const validExpirations = expirations.filter(
        (date) => moment(date).isSameOrAfter(moment(), 'day') && moment(date).isSameOrBefore(moment().add(90, 'days'))
      );
      const underlyingPrice = await getUnderlyingPrice(optionSymbol, token);
      const strategies = [];

      for (const expiration of validExpirations) {
        const optionData = await getOptionData(optionSymbol, expiration, token);
        const dte = calculateDTE(moment(expiration));
        const ironCondors = constructIronCondors(optionData, optionSymbol, underlyingPrice, expiration, dte, target);
        const shortCallSpreads = constructshortCallSpreads(optionData, optionSymbol, underlyingPrice, expiration, dte, target);
        const shortCreditSpreads = constructshortCreditSpreads(optionData, optionSymbol, underlyingPrice, expiration, dte, target);
        strategies.push(...ironCondors, ...shortCallSpreads, ...shortCreditSpreads);
      }
      const filteredStrategies = strategies.filter((strategy) => strategy.dte !== null && strategy.expectancy > 0 && strategy.bid > 0 && strategy.openInterest >= 0 && strategy.volume >= 0)
      allStrategies.push(...filteredStrategies);
    }

    const sortedStrategies = allStrategies.sort((a, b) => b.expectancy - a.expectancy)
    res.status(200).json(sortedStrategies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching strategies' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const getExpirations = async (optionSymbol, token) => {
  try {
    const response = await limitPromise(() => {
      return fetch(
        `https://api.tradier.com/v1/markets/options/expirations?symbol=${optionSymbol}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
    });
    const responseText = await response.text();
    const data = JSON.parse(responseText);
    if (!data.expirations || !data.expirations.date) {
      throw new Error('Expiration data not found');
    }
    return data.expirations.date;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getUnderlyingPrice = async (optionSymbol, token) => {
  try {
    const response = await limitPromise(() => {
      return fetch(
        `https://api.tradier.com/v1/markets/quotes?symbols=${optionSymbol}&greeks=false`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
    });
    const data = await response.json();
    const underlyingPrice = data.quotes.quote.last || underlyingPrice
    return underlyingPrice;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getOptionData = async (optionSymbol, expiration, token) => {
  try {
    const response = await limitPromise(() => {
      return fetch(
        `https://api.tradier.com/v1/markets/options/chains?symbol=${optionSymbol}&expiration=${expiration}&greeks=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
    });
    const responseText = await response.text();
    // Check if response contains an error message
    if (responseText.indexOf('error') !== -1) {
      throw new Error(responseText);
    }

    const data = JSON.parse(responseText);
    const options = data.options.option;
    const updatedOptions = options.map((option) => ({ ...option }));
    return updatedOptions;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const constructIronCondors = (options, optionSymbol, underlyingPrice, expiration, dte, target) => {
  const ironCondors = [];

  // Separate calls and puts
  const calls = options.filter((option) => option.option_type === "call");
  const puts = options.filter((option) => option.option_type === "put");

  for (let shortCallIndex = 0; shortCallIndex < calls.length; shortCallIndex++) {
    const shortCall = calls[shortCallIndex];

    for (let longPutIndex = 0; longPutIndex < puts.length; longPutIndex++) {
      const longPut = puts[longPutIndex];

      let longCallIndex = -1;
      for (let i = 0; i < calls.length; i++) {
        if (calls[i].strike > shortCall.strike) {
          longCallIndex = i;
          break;
        }
      }

      let shortPutIndex = -1;
      for (let i = 0; i < puts.length; i++) {
        if (puts[i].strike > longPut.strike) {
          shortPutIndex = i;
          break;
        }
      }

      if (longCallIndex < 0 || shortPutIndex < 0) {
        continue;
      }

      const longCall = calls[longCallIndex];
      const shortPut = puts[shortPutIndex];

      // Check that the short call and short put are out-of-the-money
      if (shortCall.strike <= underlyingPrice || shortPut.strike >= underlyingPrice) {
        continue;
      }

      // Check that the long call and long put are sufficiently far from the short options
      const callSpreadWidth = longCall.strike - shortCall.strike;
      const putSpreadWidth = shortPut.strike - longPut.strike;

      if (callSpreadWidth < 0.01) {
        continue;
      }

      const minSpreadWidth = callSpreadWidth;

      if (putSpreadWidth < minSpreadWidth) {
        continue;
      }

      // get strike IV
      const shortPutIV = shortPut.greeks.smv_vol
      const longPutIV = longPut.greeks.smv_vol
      const shortCallIV = shortCall.greeks.smv_vol
      const longCallIV = longCall.greeks.smv_vol

      // Calculate the credit, max profit, and max loss of the Iron Condor
      const callCredit = ((shortCall.bid + shortCall.ask) / 2) - ((longCall.bid + longCall.ask) / 2);
      const putCredit = ((shortPut.bid + shortPut.ask) / 2) - ((longPut.bid + longPut.ask) / 2);
      const credit = (callCredit + putCredit) * 100 <= 0 ? 1 : (callCredit + putCredit) * 100;
      const maxLoss = Math.abs((Math.max(callSpreadWidth, putSpreadWidth) * 100) - credit);

      // Calculate probabilities and expectancy
      const maxWinProb = 100 - Math.abs((getProbs(underlyingPrice, shortPut.strike, dte, shortPutIV)[1]) - (getProbs(underlyingPrice, shortCall.strike, dte, shortCallIV)[0]));
      const maxLossProb = 100 - Math.min(getProbs(underlyingPrice, longPut.strike, dte, longPutIV)[0], getProbs(underlyingPrice, longCall.strike, dte, longCallIV)[1]
      );
      const expectancy = Math.floor((credit * (maxWinProb / 100)) - (maxLoss * (maxLossProb / 100)));
      const expectancyYield = Math.floor(((expectancy / (underlyingPrice * 100)) / dte) * (252 / 12))*100
      const earlyProfit = Math.ceil((((target + (maxLoss * (maxLossProb / 100))) / (maxWinProb / 100)) / credit) * 100) > 100 ? 100 : Math.ceil((((target + (maxLoss * (maxLossProb / 100))) / (maxWinProb / 100)) / credit) * 100)

      // Add the Iron Condor to the list of strategies
      ironCondors.push({
        bid: Math.min(shortPut.bid,longPut.bid, shortCall.bid,longCall.bid),
        openInterest: Math.min(shortPut.open_interest,longPut.open_interest,shortCall.open_interest,longCall.open_interest),
        volume: Math.min(shortPut.volume,longPut.volume, shortCall.volume,longCall.volume),
        strategy: "Iron Condor",
        optionSymbol: `${optionSymbol}`,
        dte: dte,
        strikes: `+${longPut.strike}P / -${shortPut.strike}P / -${shortCall.strike}C / +${longCall.strike}C`,
        expectancy: expectancy,
        expectancyYield: expectancyYield,
        earlyProfit: earlyProfit,
        credit: credit,
        maxLoss: maxLoss,
        maxWinProb: maxWinProb,
        maxLossProb: maxLossProb,
      });
    }
  }

  return ironCondors;
};

// Construct Short Call Spreads
const constructshortCallSpreads = (options, optionSymbol, underlyingPrice, expiration, dte, target) => {
  const shortCallSpreads = [];

  const calls = options.filter((option) => option.option_type === "call");

  for (let shortIndex = 0; shortIndex < calls.length; shortIndex++) {
    const shortCall = calls[shortIndex];

    for (let longIndex = shortIndex + 1; longIndex < calls.length; longIndex++) {
      const longCall = calls[longIndex];

      if (shortCall.strike >= longCall.strike) {
        continue;
      }

      const spreadWidth = longCall.strike - shortCall.strike;
      const credit = (((shortCall.bid + shortCall.ask) / 2) - ((longCall.bid + longCall.ask) / 2)) * 100 <= 0 ? 1 : (((shortCall.bid + shortCall.ask) / 2) - ((longCall.bid + longCall.ask) / 2)) * 100;
      const maxLoss = Math.abs((spreadWidth * 100) - credit);

      // Calculate probabilities and expectancy
      const shortCallIV = shortCall.greeks.smv_vol;
      const longCallIV = longCall.greeks.smv_vol;
      const maxWinProb = 100 - getProbs(underlyingPrice, shortCall.strike, dte, shortCallIV)[0];
      const maxLossProb = 100 - getProbs(underlyingPrice, longCall.strike, dte, longCallIV)[1];
      const expectancy = Math.floor((credit * (maxWinProb / 100)) - (maxLoss * (maxWinProb / 100)));
      const expectancyYield = Math.ceil((((expectancy / (underlyingPrice * 100)) / dte) * (252 / 12) * 100))
      const earlyProfit = Math.ceil((((target + (maxLoss * (maxLossProb / 100))) / (maxWinProb / 100)) / credit) * 100) > 100 ? 100 : Math.ceil((((target + (maxLoss * (maxLossProb / 100))) / (maxWinProb / 100)) / credit) * 100)

      shortCallSpreads.push({
        bid: Math.min(shortCall.bid,longCall.bid),
        openInterest: Math.min(shortCall.open_interest,longCall.open_interest),
        volume: Math.min(shortCall.volume,longCall.volume),
        strategy: "Short Call Spread",
        optionSymbol: `${optionSymbol}`,
        dte: dte,
        strikes: `-${shortCall.strike}C / +${longCall.strike}C`,
        expectancy: expectancy,
        expectancyYield: expectancyYield,
        earlyProfit: earlyProfit,
        credit: credit,
        maxLoss: maxLoss,
        maxWinProb: maxWinProb,
        maxLossProb: maxLossProb,
      });
    }
  }
  return shortCallSpreads
}

// Construct Short Credit Spreads
const constructshortCreditSpreads = (options, optionSymbol, underlyingPrice, expiration, dte, target) => {
  const shortCreditSpreads = [];

  // Filter puts
  const puts = options.filter((option) => option.option_type === "put");

  for (let shortPutIndex = 0; shortPutIndex < puts.length; shortPutIndex++) {
    for (
      let longPutIndex = shortPutIndex + 1;
      longPutIndex < puts.length;
      longPutIndex++
    ) {
      const shortPut = puts[shortPutIndex];
      const longPut = puts[longPutIndex];

      // Skip if the short put is lower than the long put
      if (shortPut.strike > longPut.strike) {
        continue;
      }

      // get strike iv
      const shortPutIV = shortPut.greeks.smv_vol;
      const longPutIV = longPut.greeks.smv_vol;

      const spreadWidth = shortPut.strike - longPut.strike;
      const credit = (((shortPut.bid + shortPut.ask) / 2) - ((longPut.bid + longPut.ask) / 2)) * 100 <= 0 ? 1 : (((shortPut.bid + shortPut.ask) / 2) - ((longPut.bid + longPut.ask) / 2)) * 100;
      const maxLoss = Math.abs((spreadWidth * 100) - credit);

      // Calculate probabilities and expectancy
      const maxWinProb = getProbs(underlyingPrice, shortPut.strike, dte, shortPutIV)[1];
      const maxLossProb = getProbs(underlyingPrice, longPut.strike, dte, longPutIV)[0];

      const expectancy = Math.floor((credit * (maxWinProb / 100)) - (maxLoss * (maxWinProb / 100)));
      const expectancyYield = Math.ceil((((expectancy / (underlyingPrice * 100)) / dte) * (252 / 12) * 100))
      const earlyProfit = Math.ceil((((target + (maxLoss * (maxLossProb / 100))) / (maxWinProb / 100)) / credit) * 100) > 100 ? 100 : Math.ceil((((target + (maxLoss * (maxLossProb / 100))) / (maxWinProb / 100)) / credit) * 100)

      shortCreditSpreads.push({
        bid: Math.min(shortPut.bid,longPut.bid),
        openInterest: Math.min(shortPut.open_interest,longPut.open_interest),
        volume: Math.min(shortPut.volume,longPut.volume),
        strategy: "Short Credit Spread",
        optionSymbol: `${optionSymbol}`,
        dte: dte,
        strikes: `+${shortPut.strike}P / -${longPut.strike}P`,
        expectancy: expectancy,
        expectancyYield: expectancyYield,
        earlyProfit: earlyProfit,
        credit: credit,
        maxLoss: maxLoss,
        maxWinProb: maxWinProb,
        maxLossProb: maxLossProb,
      });
    }
  }

  return shortCreditSpreads;
};

const calculateDTE = (expirationDate) => {
  // Check if expirationDate is valid
  if (!moment(expirationDate).isValid()) {
    return null;
  }

  const currentDate = moment();
  const expDate = moment(expirationDate);

  // Check if expDate is at least one day after currentDate
  if (!expDate.isSameOrAfter(currentDate, 'day')) {
    return null;
  }

  const daysDifference = expDate.diff(currentDate, 'days') + 1;
  return daysDifference;
};

const getProbs = (underlyingPrice, strike, dte, iv) => {
  let p = parseFloat(underlyingPrice);
  let q = parseFloat(strike);
  let t = parseFloat(dte) / 252;
  let v = parseFloat(iv);

  let vt = v * Math.sqrt(t);
  let lnpq = Math.log(q / p);
  let d1 = lnpq / vt;

  let y =
    Math.floor((1 / (1 + 0.2316419 * Math.abs(d1))) * 100000) / 100000;
  let z =
    Math.floor(0.3989423 * Math.exp(-((d1 * d1) / 2)) * 100000) /
    100000;
  let y5 = 1.330274 * Math.pow(y, 5);
  let y4 = 1.821256 * Math.pow(y, 4);
  let y3 = 1.781478 * Math.pow(y, 3);
  let y2 = 0.356538 * Math.pow(y, 2);
  let y1 = 0.3193815 * y;
  let x = 1 - z * (y5 - y4 + y3 - y2 + y1);
  x = Math.floor(x * 100000) / 100000;

  if (d1 < 0) {
    x = 1 - x;
  }

  let pabove = Math.floor(Math.floor(x * 1000) / 10);
  let pbelow = Math.ceil(Math.floor((1 - x) * 1000) / 10);

  //return probabilities for underlying price ending up above or below strike
  return [pbelow, pabove];
}