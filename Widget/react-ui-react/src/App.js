/* global ZOHO */
import './App.css';
import { useEffect, useRef, useState } from 'react';

function App() {
  const [formData, setFormData] = useState({
    dealName: "",
    contact: "",
    email: "",
    areaOfInterest: [],
    clgOffice: ""
  });
  const [errors, setErrors] = useState({});

  const areas = [
    "Setting Up A Living Trust",
    "Review of My Existing Trust",
    "Estate Tax Planning",
    "Gifting Strategies",
    "Asset Protection",
    "Saving for a Beneficiary’s College Education",
    "Life Insurance / Annuity Review",
    "Disability / Long-Term Nursing Care / Medi-Cal Planning",
    "Guardianship of Minor Children",
    "Veterans Long-Term Care Planning",
    "Retirement Planning"
  ];

  const CustomMultiSelect = ({ formData, setFormData, errors }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleSelect = (option) => {
      if (!formData.areaOfInterest.includes(option)) {
        setFormData({
          ...formData,
          areaOfInterest: [...formData.areaOfInterest, option],
        });
      }
    };

    const removeOption = (optionToRemove) => {
      setFormData({
        ...formData,
        areaOfInterest: formData.areaOfInterest.filter(opt => opt !== optionToRemove),
      });
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="multi-select-container" ref={dropdownRef}>
        <label>Areas of Interest:</label>
        <div className="selected-options" onClick={toggleDropdown}>
          {formData.areaOfInterest.length === 0 && <span className="placeholder">-- Select an option --</span>}
          {formData.areaOfInterest.map(option => (
            <div key={option} className="tag">
              {option}
              <button type="button" onClick={() => removeOption(option)}>×</button>
            </div>
          ))}
          <div className="arrow">&#9662;</div>
        </div>
        {isOpen && (
          <div className="dropdown">
            {areas.map(option => (
              <div
                key={option}
                className={`dropdown-option ${formData.areaOfInterest.includes(option) ? 'selected' : ''}`}
                onClick={() => handleSelect(option)}
              >
                {option}
              </div>
            ))}
          </div>
        )}
        {errors.areaOfInterest && (
          <div className="error">{errors.areaOfInterest}</div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (ZOHO) {
      ZOHO.embeddedApp.on("PageLoad", function (data) {
        console.log("Page loaded", data);
      });
      ZOHO.embeddedApp.init();
    } else {
      console.error("ZOHO SDK not loaded.");
    }
  }, []);

  const validate = () => {
    const newErrors = {};

    if (!formData.dealName.trim()) {
      newErrors.dealName = "Deal name is required.";
    }
    if (formData.contact.trim() && !formData.email.trim()) {
      newErrors.email = "Email is required.";
    }
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format.";
    }
    // if (!formData.areaOfInterest) {
    //   newErrors.areaOfInterest = "Please select an area of interest.";
    // }
    // if (!formData.clgOffice) {
    //   newErrors.clgOffice = "Please select a CLG office.";
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, multiple, options } = e.target;

    if (multiple) {
      const selectedValues = Array.from(options)
        .filter(option => option.selected)
        .map(option => option.value);

      setFormData(prev => ({
        ...prev,
        [name]: selectedValues
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const script = () => {
    let contactId = "";
    if (formData.email) {
      ZOHO.CRM.API.searchRecord({ Entity: "Contacts", Type: "email", Query: formData.email })
        .then(function (res) {
          console.log("Search Data=>", res);
          if (res.data) {
            contactId = res.data[0].id;
          }
          else {
            let contactName = formData.contact.split(" ");
            let firstName = "";
            for (let i = 0; i < contactName.length - 1; i++) {
              firstName += contactName[i];
            }
            // CREATE CONTACT FIRST
            let contactData = [{
              "Email": formData.email,
              "Last_Name": contactName[contactName.length - 1],
              "First_Name": firstName
            }];

            ZOHO.CRM.API.upsertRecord({
              Entity: "Contacts",
              APIData: contactData,
              duplicate_check_fields: ["Email"], Trigger: ["workflow"]
            }).then(function (data) {
              console.log("Contact created successfully =>", data);
              contactId = data[0]?.id;
            }).catch(function (err) {
              console.error("Error creating contact", err);
            });

          }
        })
    }
    let Areas_of_Interest = [];
    Areas_of_Interest.push(formData.areaOfInterest);

    let dealData = [{
      "Deal_Name": formData.dealName,
      "Stage": "Start",
      "Deal_Email": formData.email,
      "Contact_Name": contactId,
      "Quick_Contact": formData.contact,
      "CLG_Office": formData.clgOffice,
      "Areas_of_Interest": Areas_of_Interest
    }];

    ZOHO.CRM.API.upsertRecord({
      Entity: "Deals",
      APIData: dealData,
      duplicate_check_fields: ["Deal_Name"], Trigger: ["workflow"]
    }).then(function (data) {
      console.log("Record added successfully =>", data);
      ZOHO.CRM.UI.Popup.closeReload();
    }).catch(function (err) {
      console.error("Error adding record", err);
    });
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validate()) {
      console.log('Form submitted successfully:', formData);
      script();
    }
  };

  return (
    <div className="App">
      <form className="App-header" onSubmit={handleSubmit}>
        <div>
          <label>
            Deal Name:
            <input
              type="text"
              name="dealName"
              value={formData.dealName}
              onChange={handleChange}
            />
            {errors.dealName && (
              <div className='error'>{errors.dealName}</div>
            )}
          </label>
        </div>

        <div>
          <label>
            Contact Name:
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
            />
            {errors.contact && (
              <div className='error'>{errors.contact}</div>
            )}
          </label>
        </div>

        <div>
          <label>
            Contact Email:
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && (
              <div className='error'>{errors.email}</div>
            )}
          </label>
        </div>

        {/* <div>
          <label>
            Areas of Interest:
            <select
              name="areaOfInterest"
              value={formData.areaOfInterest || ""}
              onChange={handleChange}
            >
              <option value="">-- Select an option --</option>
              <option value="Setting Up A Living Trust">Setting Up A Living Trust</option>
              <option value="Review of My Existing Trust">Review of My Existing Trust</option>
              <option value="Estate Tax Planning">Estate Tax Planning</option>
              <option value="Gifting Strategies">Gifting Strategies</option>
              <option value="Asset Protection">Asset Protection</option>
              <option value="Saving for a Beneficiary’s College Education">Saving for a Beneficiary’s College Education</option>
              <option value="Life Insurance / Annuity Review">Life Insurance / Annuity Review</option>
              <option value="Disability / Long-Term Nursing Care / Medi-Cal Planning">Disability / Long-Term Nursing Care / Medi-Cal Planning</option>
              <option value="Guardianship of Minor Children">Guardianship of Minor Children</option>
              <option value="Veterans Long-Term Care Planning">Veterans Long-Term Care Planning</option>
              <option value="Retirement Planning">Retirement Planning</option>
            </select>
            {errors.areaOfInterest && (
              <div className='error'>{errors.areaOfInterest}</div>
            )}
          </label>
        </div> */}

        <CustomMultiSelect
          formData={formData}
          setFormData={setFormData}
          errors={errors}
        />

        <div>
          <label>
            CLG Office:
            <select
              name="clgOffice"
              value={formData.clgOffice || ""}
              onChange={handleChange}
            >
              <option value="">-- Select an office --</option>
              <option value="Davis Office">Davis Office</option>
              <option value="Roseville Office">Roseville Office</option>
              <option value="Sacramento Office">Sacramento Office</option>
              <option value="San Antonio">San Antonio</option>
            </select>
            {errors.clgOffice && (
              <div className='error'>{errors.clgOffice}</div>
            )}
          </label>
        </div>

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default App;
