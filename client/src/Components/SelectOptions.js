import React, { useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import "../App.css";

const SelectOptions = ({ options, buttonText, onSelect }) => {
  const [show, setShow] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);
const handleSave = () => {
  onSelect(selectedOptions);
  setSelectedOptions([]); // clear the selected options
  handleClose();
};

  const handleOptionMouseDown = (e) => {
    e.preventDefault();
    const { value } = e.target;
    const updatedSelectedOptions = selectedOptions.includes(value)
      ? selectedOptions.filter((option) => option !== value)
      : [...selectedOptions, value];
    setSelectedOptions(updatedSelectedOptions);
  };

  const handleOptionTouchStart = (e) => {
    e.preventDefault();
    const { value } = e.target;
    const updatedSelectedOptions = selectedOptions.includes(value)
      ? selectedOptions.filter((option) => option !== value)
      : [...selectedOptions, value];
    setSelectedOptions(updatedSelectedOptions);
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
          <Form className="bg-dark">
            <Form.Group className="bg-dark" controlId="options">
              <Form.Control className="bg-dark text-white" as="select" multiple>
                {options.map((option) => (
                  <option
                    key={option}
                    value={option}
                    onMouseDown={handleOptionMouseDown}
                    onTouchStart={handleOptionTouchStart}
                    style={{
                      backgroundColor: selectedOptions.includes(option)
                        ? "#696969"
                        : null,
                      color: selectedOptions.includes(option)
                        ? "#fff"
                        : null,

                        userSelect: 'none', // disable text selection
                    }}
                  >
                    {option}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
          </Form>
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