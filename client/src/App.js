import React, { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-balham.css'
import axios from "axios";
import { Container, Modal, Spinner, Nav, Navbar, Col, Row, Form, Button, InputGroup } from "react-bootstrap";
import SelectOptions from "./Components/SelectOptions";
import './App.css';

const App = () => {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [targetValue, setTargetValue] = useState(50);
  const [selectedSymbols, setselectedSymbols] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const symbols = ["AAP", "AAPL", "ABBV", "ABT", "ACN", "ADBE", "ADI", "ADM", "ADP", "ADSK", "AEP", "AES", "AFL", "AGNC", "AIG", "AKAM", "ALK", "ALL", "AMAT", "AMD", "AMGN", "AMRN", "AMZN", "ANTM", "APA", "APH", "APTV", "ATVI", "AVGO", "AXP", "BABA", "BAC", "BAX", "BBY", "BEN", "BIDU", "BIIB", "BK", "BKR", "BMY", "BP", "BSX", "BX", "BYND", "C", "CAH", "CAT", "CB", "CCI", "CCL", "CF", "CFG", "CHWY", "CI", "CL", "CLF", "CLX", "CMCSA", "CME", "CNC", "CNP", "COF", "COP", "COST", "CPB", "CPRI", "CRM", "CRON", "CRWD", "CSCO", "CSX", "CTVA", "CVS", "CVX", "CZR", "D", "DAL", "DD", "DE", "DHI", "DHR", "DIS", "DISCA", "DISCK", "DISH", "DKNG", "DLR", "DOCU", "DOW", "DRI", "DVN", "DXC", "EA", "EBAY", "ED", "EIX", "EMR", "EOG", "EQR", "EVRG", "EW", "EXC", "EXPE", "F", "FANG", "FAST", "FCX", "FDX", "FE", "FISV", "FITB", "FOXA", "FSLR", "FTI", "FTV", "GD", "GE", "GILD", "GLW", "GM", "GOLD", "GOOG", "GOOGL", "GPRO", "GPS", "GS", "HAL", "HBAN", "HBI", "HCA", "HD", "HFC", "HIG", "HLT", "HOG", "HOLX", "HON", "HPE", "HPQ", "IBM", "ICE", "INTC", "IP", "IPG", "IRM", "IVZ", "JCI", "JD", "JNJ", "JNPR", "JPM", "K", "KHC", "KMI", "KO", "KR", "KSS", "LEN", "LKQ", "LLY", "LNC", "LOW", "LUMN", "LUV", "LVS", "LYB", "LYFT", "MA", "MAR", "MARA", "MAS", "MCD", "MCHP", "MDLZ", "MDT", "MET", "META", "MGM", "MMM", "MO", "MOS", "MPC", "MRK", "MRNA", "MRO", "MRVL", "MS", "MSFT", "MTB", "MU", "NCLH", "NEE", "NEM", "NET", "NFLX", "NKE", "NLOK", "NOW", "NRG", "NTAP", "NTES", "NVAX", "NVDA", "NWL", "NWSA", "O", "OKE", "OMC", "ORCL", "OXY", "PBCT", "PBR", "PEAK", "PEP", "PFE", "PFG", "PG", "PGR", "PNC", "PPL", "PRU", "PSX", "PXD", "PYPL", "QCOM", "RCL", "RF", "RIG", "ROKU", "ROST", "RTX", "SBUX", "SCHW", "SHOP", "SIRI", "SLB", "SO", "SPG", "SQ", "STX", "SWKS", "SYF", "SYY", "T", "TAP", "TCOM", "TGT", "TJX", "TMO", "TMUS", "TPR", "TRIP", "TRV", "TSLA", "TSM", "TSN", "TT", "TTD", "TTWO", "TXN", "UA", "UAL", "UBER", "ULTA", "UNH", "UNM", "UNP", "UPS", "URBN", "USB", "V", "VFC", "VTR", "VZ", "WAB", "WBA", "WDC", "WFC", "WM", "WMB", "WMT", "WRK", "WU", "WY", "WYNN", "X", "XEL", "XOM", "XRX", "YELP", "ZION", "ZM", "ARKK", "DIA", "EEM", "EFA", "EWJ", "EWW", "EWY", "EWZ", "FXE", "FXI", "GDX", "GLD", "HYG", "IBB", "IWM", "IYR", "KRE", "LQD", "OIH", "QQQ", "SCHD", "SLV", "SMH", "SPXL", "SPXS", "SPY", "SQQQ", "TBT", "TLT", "TQQQ", "UNG", "USO", "UVXY", "VGK", "VXX", "XBI", "XHB", "XLB", "XLC", "XLE", "XLF", "XLI", "XLK", "XLP", "XLRE", "XLU", "XLV", "XLY", "XOP", "XRT"].sort()

  const dollarUS = Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  })

  const handleOptionsSelect = (options) => {
    setselectedSymbols(options);
  };

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
      console.log(response.data)
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
    if (window.innerWidth > 768) { // assuming that 768 is the breakpoint for mobile view
      params.api.sizeColumnsToFit();
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  return (
    <>
      <Container fluid>
        <Navbar bg="dark" sticky="top" className="justify-content-between">
          <Navbar.Brand>
            <div className="d-inline-flex align-items-center">
              <img
                src={process.env.PUBLIC_URL + "/OptionsAnalyzerS.png"}
                alt="Options Analyzer"
                width="35"
                height="35"
                className="d-inline-block align-top m-3"
              />
              <h2 className="m-1">OPEN OPTIONS</h2>
            </div>
          </Navbar.Brand>
          <Form className="m-3" inline="true" onSubmit={handleSubmit}>
            <InputGroup>
              <InputGroup.Text className="bg-dark text-white">Target ($)</InputGroup.Text>
              <Form.Control
                className="bg-dark text-white"
                type="number"
                placeholder="Enter target value"
                value={targetValue}
                onChange={handleInputChange}
              />
              <SelectOptions className="outline-secondary"
                options={symbols}
                buttonText="Select Symbols"
                onSelect={handleOptionsSelect}
              />
              <Button variant="outline-secondary" type="submit">
                Submit
              </Button>
            </InputGroup>
              <div className="text-center m-2">
                {selectedSymbols.map((symbol) => (
                  <Button variant="secondary" key={symbol} style={{ marginRight: "10px" }} disabled>
                    {symbol}
                  </Button>
                ))}
              </div>
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
        {!loading && (
          <div className="ag-theme-balham-dark" style={{ height: isMobile ? "72vh" : "80vh", width: "98%", margin: "0 auto" }}>
              <p className="text-left d-inline-block align-middle m-2"><strong>Multisort:</strong> After sorting first column, hold shift while sorting another.</p>
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
        <div className="mt-5 text-white text-center" style={{ display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <span>Powered by</span>
          <a href='https://tradier.com'>
            <img src={process.env.PUBLIC_URL + "/tradier_logo.svg"} alt="Options Analyzer" width="45" style={{ marginLeft: "5px", marginBottom: "3px" }} />
          </a>
        </div>

      </Container>
    </>
  );
}

export default App;
