import React, { useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import "../App.css"

const SelectOptions = ({ options, buttonText, onSelect }) => {
  const [show, setShow] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);
  const handleSave = () => {
    onSelect(selectedOptions);
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

  const handleOptionKeyDown = (e) => {
    if (e.key === " ") {
      e.preventDefault();
      const { value } = e.target;
      const updatedSelectedOptions = selectedOptions.includes(value)
        ? selectedOptions.filter((option) => option !== value)
        : [...selectedOptions, value];
      setSelectedOptions(updatedSelectedOptions);
    }
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
        <div className="text-start text-white bg-dark p-3">Select up to five symbols ...</div>
        <Modal.Body className="bg-dark">
          <Form className="bg-dark">
            <Form.Group className="bg-dark" controlId="options">
              <Form.Control className="bg-dark text-white" as="select" multiple>
                {options.map((option) => (
                  <option
                    key={option}
                    value={option}
                    onMouseDown={handleOptionMouseDown}
                    onKeyDown={handleOptionKeyDown}
                    onTouchStart={handleOptionTouchStart}
                    style={{
                      backgroundColor: selectedOptions.includes(option)
                        ? "#696969"
                        : null,
                      color: selectedOptions.includes(option)
                        ? "#fff"
                        : null,
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
