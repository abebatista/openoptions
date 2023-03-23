import React, { useState } from "react";
import { AgGridReact } from "ag-grid-react";
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-balham.css'
import axios from "axios";
import { Container, Modal, Spinner, Nav, Navbar, Form, Button, InputGroup } from "react-bootstrap";
import './App.css';

const App = () => {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [targetValue, setTargetValue] = useState(50);
  const [selectedSymbols, setSelectedSymbols] = useState([]);

  const symbols = ['A', 'AAL', 'AAP', 'AAPL', 'ABBV', 'ABT', 'ACN', 'ADBE', 'ADI', 'ADM', 'ADP', 'ADSK', 'AEP', 'AES', 'AFL', 'AGNC', 'AIG', 'AKAM', 'ALK', 'ALL', 'AMAT', 'AMD', 'AMGN', 'AMRN', 'AMZN', 'APA', 'APH', 'APTV', 'ARKK', 'ATVI', 'AVGO', 'AXP', 'BA', 'BABA', 'BAC', 'BAX', 'BBY', 'BEN', 'BIDU', 'BIIB', 'BK', 'BKR', 'BMY', 'BP', 'BSX', 'BX', 'BYND', 'C', 'CAH', 'CAT', 'CB', 'CCI', 'CCL', 'CF', 'CFG', 'CHWY', 'CI', 'CL', 'CLF', 'CLX', 'CMCSA', 'CME', 'CNC', 'CNP', 'COF', 'COP', 'COST', 'CPB', 'CPRI', 'CRM', 'CRON', 'CRWD', 'CSCO', 'CSX', 'CTVA', 'CVS', 'CVX', 'CZR', 'D', 'DAL', 'DD', 'DE', 'DHI', 'DHR', 'DIA', 'DIS', 'DISH', 'DKNG', 'DLR', 'DOCU', 'DOW', 'DRI', 'DVN', 'DXC', 'EA', 'EBAY', 'ED', 'EEM', 'EFA', 'EIX', 'EMR', 'EOG', 'EQR', 'EVRG', 'EW', 'EWJ', 'EWW', 'EWY', 'EXC', 'EXPE', 'F', 'FANG', 'FAST', 'FCX', 'FDX', 'FE', 'FISV', 'FITB', 'FOXA', 'FSLR', 'FTI', 'FTV', 'FXE', 'FXI', 'GD', 'GDX', 'GE', 'GILD', 'GLD', 'GLW', 'GM', 'GOLD', 'GOOG', 'GOOGL', 'GPRO', 'GPS', 'GS', 'HAL', 'HBAN', 'HBI', 'HCA', 'HD', 'HIG', 'HLT', 'HOG', 'HOLX', 'HON', 'HPE', 'HPQ', 'HYG', 'IBB', 'IBM', 'ICE', 'INTC', 'IP', 'IPG', 'IRM', 'IVZ', 'IWM', 'IYR', 'JCI', 'JD', 'JNJ', 'JNPR', 'JPM', 'K', 'KHC', 'KMI', 'KO', 'KR', 'KRE', 'KSS', 'LEN', 'LKQ', 'LLY', 'LNC', 'LOW', 'LQD', 'LUMN', 'LUV', 'LVS', 'LYB', 'LYFT', 'MA', 'MAR', 'MARA', 'MAS', 'MCD', 'MCHP', 'MDLZ', 'MDT', 'MET', 'META', 'MGM', 'MMM', 'MO', 'MOS', 'MPC', 'MRK', 'MRNA', 'MRO', 'MRVL', 'MS', 'MSFT', 'MTB', 'MU', 'NCLH', 'NEE', 'NEM', 'NET', 'NFLX', 'NKE', 'NOW', 'NRG', 'NTAP', 'NTES', 'NVAX', 'NVDA', 'NWL', 'NWSA', 'O', 'OIH', 'OKE', 'OMC', 'ORCL', 'OXY', 'PBR', 'PEAK', 'PEP', 'PFE', 'PFG', 'PG', 'PGR', 'PNC', 'PPL', 'PRU', 'PSX', 'PXD', 'PYPL', 'QCOM', 'QQQ', 'RCL', 'RF', 'RIG', 'ROKU', 'ROST', 'RTX', 'SBUX', 'SCHD', 'SCHW', 'SHOP', 'SIRI', 'SLB', 'SLV', 'SMH', 'SO', 'SPG', 'SPXL', 'SPXS', 'SPY', 'SQ', 'SQQQ', 'STX', 'SWKS', 'SYF', 'SYY', 'T', 'TAP', 'TBT', 'TCOM', 'TGT', 'TJX', 'TLT', 'TMO', 'TMUS', 'TPR', 'TQQQ', 'TRIP', 'TRV', 'TSLA', 'TSM', 'TSN', 'TT', 'TTD', 'TTWO', 'TXN', 'UA', 'UAA', 'UAL', 'UBER', 'ULTA', 'UNG', 'UNH', 'UNM', 'UNP', 'UPS', 'URBN', 'USB', 'USO', 'UVXY', 'V', 'VFC', 'VGK', 'VTR', 'VXX', 'VZ', 'WAB', 'WBA', 'WDC', 'WFC', 'WM', 'WMB', 'WMT', 'WRK', 'WU', 'WY', 'WYNN', 'X', 'XBI', 'XEL', 'XHB', 'XLB', 'XLC', 'XLE', 'XLF', 'XLI', 'XLK', 'XLP', 'XLU', 'XLV', 'XLY', 'XOM', 'XOP', 'XRT', 'XRX', 'YELP', 'ZION', 'ZM'];

  const dollarUS = Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  })

  const handleInputChange = (event) => {
    setTargetValue(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Check if more than 5 symbols are selected
    if (selectedSymbols.length > 5) {
      alert("You can select up to 5 symbols");
      return;
    }

    setLoading(true);
    try {
      const symbolsQueryParam = selectedSymbols.join(",");
      const response = await axios.get(`/strategies?symbols=${symbolsQueryParam}&target=${targetValue}`);
      setStrategies(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };


  const defaultColDef = {
    resizable: true,
  };

  const gridOptions = {
    autoSizePadding: true,
  };

  const columnDefs = [
    {
      headerName: "Position",
      pinned: "left",
      autoHeight: true,
      cellRenderer: (params) => {
        const { data } = params;
        const { optionSymbol, strategy, strikes } = data;
        return (
          <div style={{ whiteSpace: "normal", paddingRight: "20px", paddingBottom: "20px" }}>
            <div className="gold">{optionSymbol}</div>
            <div>{strategy}</div>
            <div className="grey">{strikes}</div>
          </div>
        );
      },
    },
    { headerName: "DTE", field: "dte", sortable: true, filter: 'agNumberColumnFilter' },
    { headerName: "Expectancy", field: "expectancy", sortable: true, filter: 'agNumberColumnFilter', valueFormatter: (params) => dollarUS.format(params.value) },
    { headerName: "Expectancy Yield", field: "expectancyYield", sortable: true, filter: 'agNumberColumnFilter', valueFormatter: (params) => params.value + '%' },
    { headerName: "Suggested Exit", field: "earlyProfit", sortable: true, filter: 'agNumberColumnFilter', valueFormatter: (params) => params.value + '%' },
    { headerName: "Credit", field: "credit", sortable: true, filter: 'agNumberColumnFilter', valueFormatter: (params) => dollarUS.format(params.value), cellStyle: { color: '#16F529' } },
    { headerName: "Max Loss", field: "maxLoss", sortable: true, filter: 'agNumberColumnFilter', valueFormatter: (params) => dollarUS.format(params.value), cellStyle: { color: '#FD1C03' } },
    { headerName: "Max Win Probability", field: "maxWinProb", sortable: true, filter: 'agNumberColumnFilter', valueFormatter: (params) => params.value + '%' },
    { headerName: "Max Loss Probability", field: "maxLossProb", sortable: true, filter: 'agNumberColumnFilter', valueFormatter: (params) => params.value + '%' },
  ];

  const onGridReady = (params) => {
    params.api.sizeColumnsToFit(); //
  };

  return (
    <>
      <Navbar bg="dark" sticky="top" className="justify-content-center">
        {/*<Navbar.Brand>
          <img src={process.env.PUBLIC_URL + "/OptionsAnalyzerS.png"} alt="Options Analyzer"
            width="35"
            height="35"
            className="d-inline-block align-top m-3"
          />
        </Navbar.Brand>*/}
        <Form inline="true" onSubmit={handleSubmit}>
          <InputGroup>
            <InputGroup.Text className="bg-dark text-white">Target ($)</InputGroup.Text>
            <Form.Control
              className="bg-dark text-white"
              type="number"
              placeholder="Enter target value"
              value={targetValue}
              onChange={handleInputChange}
            />
            <Form.Select
              className="bg-dark text-white p-0"
              aria-label="Select up to 5 symbols"
              multiple
              value={selectedSymbols}
              onChange={(e) =>
                setSelectedSymbols(
                  Array.from(e.target.selectedOptions, (option) => option.value)
                )
              }
              style={{ maxWidth: "300px" }}
            >
              {symbols.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </Form.Select>
            <Button variant="outline-secondary" type="submit">
              Submit
            </Button>
          </InputGroup>
        </Form>

        {/*<Nav className="m-3">
          <Nav.Item>
            <Button variant="success" className="mr-2" onClick={() => window.location.href = "https://www.example.com/donate"}>Donate</Button>
          </Nav.Item>
        </Nav>*/}
      </Navbar>

      <Modal show={loading} backdrop="static" keyboard={false}>
        <Modal.Body className="bg-dark text-white">
          <div className="d-flex justify-content-center align-items-center">
            <h5>FINDING TRADES</h5>
          </div>
          <div className="d-flex justify-content-center align-items-center">
            <Spinner animation="border" role="status">
              <span className="sr-only"></span>
            </Spinner>
          </div>
        </Modal.Body>
      </Modal>
      <Container fluid>
        {!loading && (
          <div className="ag-theme-balham-dark" style={{ height: "82vh", width: "98%", margin: "0 auto" }}>
            <p className="text-center"><strong>Multisort:</strong> After sorting first column, hold shift while sorting another.</p>
            <AgGridReact
              defaultColDef={defaultColDef}
              columnDefs={columnDefs}
              gridOptions={gridOptions}
              rowData={strategies}
              deltaRowDataMode={true}
              onGridReady={onGridReady}
            />
          </div>
        )}
        <div className="mt-5 text-white text-center">Powered by <a className="text-white" href='https://tradier.com' title='Powered by Tradier'>Tradier</a></div>
      </Container>
    </>
  );
}

export default App;
