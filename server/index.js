import express from 'express';
import fetch from 'node-fetch';
import moment from 'moment';
import limit from 'p-limit';

const limitPromise = limit(120, 60);


const app = express();
const token = 'FpfmEcjHesmmeshqU5QHDpeZKASJ';
let optionSymbol = '';
let iv;

app.use(express.json());

app.get('/strategies', async (req, res) => {
  try {
    optionSymbol = req.query.symbol;
    const expirations = await getExpirations(optionSymbol, token);
    const validExpirations = expirations.filter(
      (date) => moment(date).isSameOrAfter(moment(), 'day') && moment(date).isSameOrBefore(moment().add(90, 'days'))
    );

    const underlyingPrice = await getUnderlyingPrice(optionSymbol, token);

    const strategies = [];
    for (const expiration of validExpirations) {
      const optionData = await getOptionData(optionSymbol, expiration, token);
      const dte = calculateDTE(moment(expiration));
      iv = optionData[0].greeks.smv_vol;

      const ironCondors = constructIronCondors(optionData, underlyingPrice, expiration, iv, dte);
      const bearCallSpreads = constructBearCallSpreads(optionData, underlyingPrice, expiration, iv, dte);
      const bullPutSpreads = constructBullPutSpreads(optionData, underlyingPrice, expiration, iv, dte);

      strategies.push(...ironCondors, ...bearCallSpreads, ...bullPutSpreads);
    }

    const filteredStrategies = strategies.filter((strategy) => strategy.dte !== null);

    res.status(200).json(filteredStrategies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching strategies' });
  }
});


app.listen(3001, () => {
  console.log('Server is running on port 3001');
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

const constructIronCondors = (options, underlyingPrice, expiration, iv, dte) => {
  const ironCondors = [];

  // Separate calls and puts
  const calls = options.filter((option) => option.option_type === "call");
  const puts = options.filter((option) => option.option_type === "put");

  for (let shortCallIndex = 0; shortCallIndex < calls.length; shortCallIndex++) {
    const shortCall = calls[shortCallIndex];

    for (let longPutIndex = 0; longPutIndex < puts.length; longPutIndex++) {
      const longPut = puts[longPutIndex];

      // Find the long calls and puts that correspond to the short options
      const longCallIndex = calls.findIndex((call) => call.strike > shortCall.strike);
      const shortPutIndex = puts.findIndex((put) => put.strike > longPut.strike);

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

      // Calculate the credit, max profit, and max loss of the Iron Condor
      const callCredit = ((shortCall.bid + shortCall.ask)/2) - ((longCall.bid + longCall.ask)/2);
      const putCredit = ((shortPut.bid + shortPut.ask)/2) - ((longPut.bid + longPut.ask)/2);
      const credit = (callCredit + putCredit) * 100;
      const maxLoss = Math.abs((Math.max(callSpreadWidth, putSpreadWidth) * 100) - credit);

      // Calculate probabilities and expectancy
      const maxWinProb = Math.abs(getProbs(underlyingPrice, shortPut.strike, dte, iv)[1] - getProbs(underlyingPrice, shortCall.strike, dte, iv)[0]);
      const maxLossProb = Math.max(getProbs(underlyingPrice, longPut.strike, dte, iv)[0], getProbs(underlyingPrice, longPut.strike, dte, iv)[1]);
      const expectancy = (credit * (maxWinProb/100)) - (maxLoss * (maxLossProb/100));

      // Add the Iron Condor to the list of strategies
      ironCondors.push({
        strategy: "Iron Condor",
        optionSymbol: `${optionSymbol}`,
        dte: dte,
        strikes: `+${longPut.strike}P / -${shortPut.strike}P / -${shortCall.strike}C / +${longCall.strike}C`,
        credit,
        maxLoss,
        maxWinProb: maxWinProb,
        maxLossProb: maxLossProb,
        expectancy,
      });
    }
  }

  return ironCondors;
};

// Construct Bear Call Spreads
const constructBearCallSpreads = (options, underlyingPrice, expiration, iv, dte) => {
  const bearCallSpreads = [];

  // Filter calls
  const calls = options.filter((option) => option.option_type === "call");

  for (let shortCallIndex = 0; shortCallIndex < calls.length; shortCallIndex++) {
    for (
      let longCallIndex = shortCallIndex + 1;
      longCallIndex < calls.length;
      longCallIndex++
    ) {
      const shortCall = calls[shortCallIndex];
      const longCall = calls[longCallIndex];
      // Skip if the short call is higher than the long call
      if (shortCall.strike > longCall.strike) {
        continue;
      }

      const spreadWidth = longCall.strike - shortCall.strike;
      const credit = (((shortCall.bid + shortCall.ask)/2) - ((longCall.bid + longCall.ask)/2)) * 100;
      const maxLoss = Math.abs((spreadWidth * 100) - credit);

      // Calculate probabilities and expectancy
      const maxWinProb = getProbs(underlyingPrice, shortCall.strike, dte, iv)[0];
      const maxLossProb = getProbs(underlyingPrice, longCall.strike, dte, iv)[1];

      const expectancy = (credit * (maxWinProb / 100)) - (maxLoss * (maxWinProb / 100));

      bearCallSpreads.push({
        strategy: "Bear Call Spread",
        optionSymbol: `${optionSymbol}`,
        dte: dte,
        strikes: `-${shortCall.strike}C / +${longCall.strike}C`,
        credit,
        maxLoss,
        maxWinProb: maxWinProb + " " + iv,
        maxLossProb: maxLossProb,
        expectancy,
      });
    }

  }

  return bearCallSpreads;
};

// Construct Bull Put Spreads
const constructBullPutSpreads = (options, underlyingPrice, expiration, iv, dte) => {
  const bullPutSpreads = [];

  // Filter puts
  const puts = options.filter((option) => option.option_type === "put");

  for (let longPutIndex = 0; longPutIndex < puts.length; longPutIndex++) {
    for (
      let shortPutIndex = longPutIndex + 1;
      shortPutIndex < puts.length;
      shortPutIndex++
    ) {
      const shortPut = puts[shortPutIndex];
      const longPut = puts[longPutIndex];
      // Skip if the short put is lower than the long put
      if (shortPut.strike < longPut.strike) {
        continue;
      }

      const spreadWidth = shortPut.strike - longPut.strike;
      const credit = (((shortPut.bid + shortPut.ask)/2) - ((longPut.bid + longPut.ask)/2)) * 100;
      const maxLoss = Math.abs((spreadWidth * 100) - credit);

      // Calculate probabilities and expectancy
      const maxWinProb = getProbs(underlyingPrice, shortPut.strike, dte, iv)[1];
      const maxLossProb = getProbs(underlyingPrice, longPut.strike, dte, iv)[0];

      const expectancy = (credit * (maxWinProb / 100)) - (maxLoss * (maxWinProb / 100));

      bullPutSpreads.push({
        strategy: "Bull Put Spread",
        optionSymbol: `${optionSymbol}`,
        dte: dte,
        strikes: `+${longPut.strike}P / -${shortPut.strike}P`,
        credit,
        maxLoss,
        maxWinProb: maxWinProb,
        maxLossProb: maxLossProb,
        expectancy,
      });
    }
  }

  return bullPutSpreads;
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

  const daysDifference = expDate.diff(currentDate, 'days')+1;
  return daysDifference;
};

const getProbs = (underlyingPrice, strike, dte, iv) => {
  const t = dte / 365; // convert days to years
  const sigma = iv; // convert percentage to decimal
  const rf = .035; // use 1-year rate for t <= 1, 10-year rate otherwise
  const d1 = (Math.log(underlyingPrice / strike) + (rf + sigma**2/2)*t) / (sigma * Math.sqrt(t));
  const d2 = d1 - sigma * Math.sqrt(t);
  const n1 = cdf(d1);
  const n2 = cdf(d2);
  const pAbove = Math.max(0, Math.min(100, n1 * 100)); // cap at 0 and 100
  const pBelow = Math.max(0, Math.min(100, (1 - n1 + n2) * 100)); // cap at 0 and 100
  return [ pBelow, pAbove ];
};

// Helper function to calculate the CDF of the standard normal distribution using a polynomial approximation
const cdf = (x) => {
  const a1 = 0.31938153;
  const a2 = -0.356563782;
  const a3 = 1.781477937;
  const a4 = -1.821255978;
  const a5 = 1.330274429;
  const L = Math.abs(x);
  const K = 1 / (1 + 0.2316419 * L);
  const w = 1 - 1 / (Math.sqrt(2 * Math.PI) * Math.exp(-0.5 * L * L) * (a1*K + a2*K*K + a3*K*K*K + a4*K*K*K*K + a5*K*K*K*K*K));
  return x < 0 ? 1 - w : w;
};

