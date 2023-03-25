import React, { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import Select from "react-select";
import "../App.css";

const SelectOptions = ({ options, buttonText, onSelect }) => {
  const [show, setShow] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);
  const handleSave = () => {
    onSelect(selectedOptions);
    handleClose();
    setSelectedOptions([]);
  };

  const handleSelectOption = (option) => {
    setSelectedOptions(option);
  };

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#696969" : null,
      color: state.isSelected ? "#fff" : null,
    }),
    control: (provided) => ({
      ...provided,
      backgroundColor: "#343a40",
      borderColor: "#343a40",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#fff",
    }),
    input: (provided) => ({
      ...provided,
      color: "#fff",
    }),
  };

  return (
    <>
      <Button variant="outline-secondary" onClick={handleShow}>
        {buttonText}
      </Button>

      <Modal show={show} onHide={handleClose} className="model-content">
        <Modal.Header className="bg-dark" closeButton>
          <Modal.Title className="text-white">Select Symbols</Modal.Title>
        </Modal.Header>
        <div className="text-start text-white bg-dark p-3">Select up to 10 symbols ...</div>
        <Modal.Body className="bg-dark">
          <Select
            options={options.map((option) => ({ value: option, label: option }))}
            isMulti
            styles={customStyles}
            value={selectedOptions}
            onChange={handleSelectOption}
          />
        </Modal.Body>
        <Modal.Footer className="bg-dark">
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="outline-secondary" onClick={handleSave}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SelectOptions;
