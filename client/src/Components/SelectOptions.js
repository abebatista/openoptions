import React, { useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";

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
      <Button variant="secondary" onClick={handleShow}>
        {buttonText}
      </Button>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Select Options</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="options">
              <Form.Control as="select" multiple>
                {options.map((option) => (
                  <option
                    key={option}
                    value={option}
                    onMouseDown={handleOptionMouseDown}
                    onKeyDown={handleOptionKeyDown}
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
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SelectOptions;
