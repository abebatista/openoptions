import React, { useState, useEffect } from "react"
import { AgGridReact } from "ag-grid-react"
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-balham.css'
import axios from "axios"
import { Container, Modal, Spinner, Navbar, Form, Button, InputGroup } from "react-bootstrap"
import SelectOptions from "./Components/SelectOptions"
import './App.css'

const App = () => {
  const [strategies, setStrategies] = useState([])
  const [loading, setLoading] = useState(false)
  const [targetValue, setTargetValue] = useState(50)
  const [selectedSymbols, setselectedSymbols] = useState([])
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1500)
  const [defaultColWidth, setDefaultColWidth] = useState(undefined)
  const [gridHeight, setGridHeight] = useState('84vh')

  const symbols = ["AAP", "AAPL", "ABBV", "ABT", "ACN", "ADBE", "ADI", "ADM", "ADP", "ADSK", "AEP", "AES", "AFL", "AGNC", "AIG", "AKAM", "ALK", "ALL", "AMAT", "AMD", "AMGN", "AMRN", "AMZN", "ANTM", "APA", "APH", "APTV", "ATVI", "AVGO", "AXP", "BABA", "BAC", "BAX", "BBY", "BEN", "BIDU", "BIIB", "BK", "BKR", "BMY", "BP", "BSX", "BX", "BYND", "C", "CAH", "CAT", "CB", "CCI", "CCL", "CF", "CFG", "CHWY", "CI", "CL", "CLF", "CLX", "CMCSA", "CME", "CNC", "CNP", "COF", "COP", "COST", "CPB", "CPRI", "CRM", "CRON", "CRWD", "CSCO", "CSX", "CTVA", "CVS", "CVX", "CZR", "D", "DAL", "DD", "DE", "DHI", "DHR", "DIS", "DISCA", "DISCK", "DISH", "DKNG", "DLR", "DOCU", "DOW", "DRI", "DVN", "DXC", "EA", "EBAY", "ED", "EIX", "EMR", "EOG", "EQR", "EVRG", "EW", "EXC", "EXPE", "F", "FANG", "FAST", "FCX", "FDX", "FE", "FISV", "FITB", "FOXA", "FSLR", "FTI", "FTV", "GD", "GE", "GILD", "GLW", "GM", "GOLD", "GOOG", "GOOGL", "GPRO", "GPS", "GS", "HAL", "HBAN", "HBI", "HCA", "HD", "HFC", "HIG", "HLT", "HOG", "HOLX", "HON", "HPE", "HPQ", "IBM", "ICE", "INTC", "IP", "IPG", "IRM", "IVZ", "JCI", "JD", "JNJ", "JNPR", "JPM", "K", "KHC", "KMI", "KO", "KR", "KSS", "LEN", "LKQ", "LLY", "LNC", "LOW", "LUMN", "LUV", "LVS", "LYB", "LYFT", "MA", "MAR", "MARA", "MAS", "MCD", "MCHP", "MDLZ", "MDT", "MET", "META", "MGM", "MMM", "MO", "MOS", "MPC", "MRK", "MRNA", "MRO", "MRVL", "MS", "MSFT", "MTB", "MU", "NCLH", "NEE", "NEM", "NET", "NFLX", "NKE", "NLOK", "NOW", "NRG", "NTAP", "NTES", "NVAX", "NVDA", "NWL", "NWSA", "O", "OKE", "OMC", "ORCL", "OXY", "PBCT", "PBR", "PEAK", "PEP", "PFE", "PFG", "PG", "PGR", "PNC", "PPL", "PRU", "PSX", "PXD", "PYPL", "QCOM", "RCL", "RF", "RIG", "ROKU", "ROST", "RTX", "SBUX", "SCHW", "SHOP", "SIRI", "SLB", "SO", "SPG", "SQ", "STX", "SWKS", "SYF", "SYY", "T", "TAP", "TCOM", "TGT", "TJX", "TMO", "TMUS", "TPR", "TRIP", "TRV", "TSLA", "TSM", "TSN", "TT", "TTD", "TTWO", "TXN", "UA", "UAL", "UBER", "ULTA", "UNH", "UNM", "UNP", "UPS", "URBN", "USB", "V", "VFC", "VTR", "VZ", "WAB", "WBA", "WDC", "WFC", "WM", "WMB", "WMT", "WRK", "WU", "WY", "WYNN", "X", "XEL", "XOM", "XRX", "YELP", "ZION", "ZM", "ARKK", "DIA", "EEM", "EFA", "EWJ", "EWW", "EWY", "EWZ", "FXE", "FXI", "GDX", "GLD", "HYG", "IBB", "IWM", "IYR", "KRE", "LQD", "OIH", "QQQ", "SCHD", "SLV", "SMH", "SPXL", "SPXS", "SPY", "SQQQ", "TBT", "TLT", "TQQQ", "UNG", "USO", "UVXY", "VGK", "VXX", "XBI", "XHB", "XLB", "XLC", "XLE", "XLF", "XLI", "XLK", "XLP", "XLRE", "XLU", "XLV", "XLY", "XOP", "XRT"].sort()

  const dollarUS = Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  })

  const handleOptionsSelect = (options) => {
    setselectedSymbols(options)
  }

  const handleSymbolRemove = (symbol) => {
    // Remove the selected symbol from the selectedSymbols array
    const updatedSymbols = selectedSymbols.filter((s) => s !== symbol)
    setselectedSymbols(updatedSymbols)

    // Filter the table based on the remaining selected symbols
    const filteredStrategies = strategies.filter((strategy) => {
      const strategySymbols = strategy.optionSymbol.split(" ")
      return strategySymbols.every((s) => updatedSymbols.includes(s))
    })
    setStrategies(filteredStrategies)
  }

  const handleInputChange = (event) => {
    setTargetValue(event.target.value)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

  // Check if no symbols are selected
  if (selectedSymbols.length === 0) {
    alert("Please select at least one symbol")
    return
  }

    // Check if more than 5 symbols are selected
    if (selectedSymbols.length > 10) {
      alert("You can only select up to 10 symbols")
      return
    }

    setLoading(true)
    try {
      const symbolsQueryParam = selectedSymbols.join(",")
      const response = await axios.get(`/strategies?symbols=${symbolsQueryParam}&target=${targetValue}`)
      setStrategies(response.data)
      setLoading(false)
      console.log(response.data)
    } catch (error) {
      console.error("Error fetching data:", error)
      alert("One of the symbols you selected does not meet healthy trade criteria and data cannot be returned")
      setLoading(false)
    }
  }


  const defaultColDef = {
    resizable: true,
  }


  const columnDefs = [
    {
      headerName: "Position",
      pinned: "left",
      width: 135,
      autoHeight: true,
      field: "strategy", // add field property for sorting
      sortable: true, // enable sorting
      filter: "agSetColumnFilter", // use agSetColumnFilter for filtering
      filterParams: {
        values: (params) => {
          const allData = params.api.getRenderedNodes().map((node) => node.data); // get all the data
          const uniqueStrategies = new Set(allData.map((data) => data.strategy)); // get unique strategy names
          return Array.from(uniqueStrategies); // convert Set to Array
        },
        newRowsAction: "keep", // keep the rows when the filter is applied
      },
      cellRenderer: (params) => {
        const { data } = params
        const { optionSymbol, strategy, strikes } = data
        return (
          <div style={{ whiteSpace: "normal", paddingRight: "20px", paddingBottom: "20px" }}>
            <div className="gold">{optionSymbol}</div>
            <div>{strategy}</div>
            <div className="grey">{strikes}</div>
          </div>
        )
      },
    },    
    { headerName: "DTE", field: "dte", sortable: true, filter: 'agNumberColumnFilter' },
    { headerName: "Expectancy", field: "expectancy", sortable: true, headerTooltip: "The expectancy of the trade: pppt = (max profit * max profit probability) - (max loss * max loss probability)", filter: 'agNumberColumnFilter', valueFormatter: (params) => dollarUS.format(params.value) },
    { headerName: "Expectancy Yield", field: "expectancyYield", sortable: true, headerTooltip: "A comparison indicator based off of Underlying Value, Probable Profit Per Trade, and DTE", filter: 'agNumberColumnFilter', valueFormatter: (params) => params.value + '%' },
    { headerName: "Suggested Exit", field: "earlyProfit", sortable: true, headerTooltip: "A suggested early exit target(%) that will maintain you expectancy Target($)", filter: 'agNumberColumnFilter', valueFormatter: (params) => params.value + '%' },
    { headerName: "Credit", field: "credit", sortable: true, filter: 'agNumberColumnFilter', valueFormatter: (params) => dollarUS.format(params.value), cellStyle: { color: '#16F529' } },
    { headerName: "Max Loss", field: "maxLoss", sortable: true, filter: 'agNumberColumnFilter', valueFormatter: (params) => dollarUS.format(params.value), cellStyle: { color: '#FD1C03' } },
    { headerName: "Max Win Probability", field: "maxWinProb", sortable: true, filter: 'agNumberColumnFilter', valueFormatter: (params) => params.value < 1 ? '<' + 1 + '%' : Math.floor(params.value) + '%' },
    { headerName: "Max Loss Probability", field: "maxLossProb", sortable: true, filter: 'agNumberColumnFilter', valueFormatter: (params) => params.value < 1 ? '<' + 1 + '%' : Math.ceil(params.value) + '%' },
    { headerName: "Reward / Risk", field: "maxLossProb", sortable: true, filter: 'agNumberColumnFilter', valueFormatter: (params) => Math.ceil(params.value) + '%' },
  ]

  const onGridReady = (params) => {
    if (isMobile) {
      setGridHeight("68vh")
      setDefaultColWidth(30)
    } else {
      setGridHeight("84vh")
      setDefaultColWidth(undefined)
      params.api.sizeColumnsToFit()
    }
  }

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobile)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

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
                className="d-inline-block align-top m-4"
              />
              <h2 className="text-white m-1">OPEN OPTIONS</h2>
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
              <Button size="sm" variant="outline-secondary" style={{ marginRight: "10px" }} disabled >
                Selected Symbols :
              </Button>
              {selectedSymbols.map((symbol) => (
                <Button size="sm" variant="secondary" key={symbol} style={{ marginRight: "10px" }} onClick={() => handleSymbolRemove(symbol)}>
                  {symbol}
                </Button>
              ))}
            </div>
          </Form>
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
          <Modal.Footer className="bg-dark text-white">
          <div className="text-justify">The information provided by Open Options is for educational and informational purposes only and should not be considered as investment, financial, or legal advice. Open Options does not provide personalized investment advice or recommendations regarding the suitability of any investment or investment strategy. Past performance is not indicative of future results. Investment involves risk, including the possible loss of principal. Users of Open Options are solely responsible for their own investment decisions and should seek the advice of a professional advisor before making any investment decisions.</div>
            <div className="mt-5 text-white text-center" style={{ display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              <span>Powered by</span>
              <a href='https://tradier.com'>
                <img src={process.env.PUBLIC_URL + "/tradier_logo.svg"} alt="Options Analyzer" width="45" style={{ marginLeft: "5px", marginBottom: "3px" }} />
              </a>
            </div>

          </Modal.Footer>
        </Modal>
        {!loading && (
          <div className="ag-theme-balham-dark" style={{ height: gridHeight, width: "98%", margin: "0 auto" }}>
            <p className="text-left d-inline-block align-middle m-2"><strong>Multisort:</strong> After sorting first column, hold shift while sorting another.</p>
            <AgGridReact
              defaultColDef={defaultColDef}
              columnDefs={columnDefs}
              gridOptions={{ defaultColDef: { width: defaultColWidth }}} 
              rowData={strategies}
              deltaRowDataMode={true}
              onGridReady={onGridReady}
            />
          </div>
        )}
      </Container>
    </>
  )
}

export default App
