import React, { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import 'ag-grid-community/styles/ag-grid.css'; // Core grid CSS, always needed
import 'ag-grid-community/styles/ag-theme-alpine.css'; // Optional theme CSS
import axios from "axios";
import Modal from "react-bootstrap/Modal";
import Spinner from "react-bootstrap/Spinner";

const App = () => {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const symbol = "XOM"; // Replace with your desired symbol
        const response = await axios.get(`/strategies?symbol=${symbol}`);
        setStrategies(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    console.log(strategies)
    fetchData();
  }, []);

  const columnDefs = [
    { headerName: "Strategy", field: "strategy" },
    { headerName: "Symbol", field: "optionSymbol" },
    { headerName: "DTE", field: "dte" },
    {
      headerName: "Strikes",
      field: "strikes",
      valueFormatter: (params) =>
        JSON.stringify(
            params.data.strikes
        ),
    },
    { headerName: "Credit", field: "credit", valueFormatter: (params) => params.value.toFixed(2) },
    { headerName: "Max Loss", field: "maxLoss", valueFormatter: (params) => params.value.toFixed(2) },
    {
      headerName: "Max Win Probability",
      field: "maxWinProb",
      valueFormatter: (params) => (params.value) + "%",
    },
    {
      headerName: "Max Loss Probability",
      field: "maxLossProb",
      valueFormatter: (params) => (params.value) + "%",
    },
    { headerName: "Expectancy", field: "expectancy", valueFormatter: (params) => (params.value) },
  ];

  const defaultColDef = {
    resizable: true,
  };

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <Modal show={loading} backdrop="static" keyboard={false}>
        <Modal.Body>
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
        <AgGridReact
          columnDefs={columnDefs}
          rowData={strategies}
          defaultColDef={defaultColDef}
          rowHeight={50}
          headerHeight={50}
        />
      )}
    </div>
  );
};

export default App;
