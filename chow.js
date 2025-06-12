import React, { useRef } from 'react';
import { GoogleMap, useJsApiLoader, StandaloneSearchBox, Marker } from '@react-google-maps/api';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import AddressList from './List';

const containerStyle = {
  width: '100vw',
  height: '100vh',
};

const center = {
  lat: -3.745,
  lng: -38.523,
};

const test_data = [
  {"name": "chow", "address": "528 S Alexandria Ave, Los Angeles, CA 90020", "lat": 34.0644661, "lng": -118.2975625},
  {"name": "low", "address": "3465 W 6th St #C-130, Los Angeles, CA 90020", "lat": 34.064016, "lng": -118.297709},
  {"name": "mow", "address": "333 S Catalina St, Los Angeles, CA 90020", "lat": 34.0679067, "lng": -118.2956938},
  {"name": "row", "address": "400 S Catalina St, Los Angeles, CA 90020", "lat": 34.0671826, "lng": -118.2949399},
  {"name": "fow", "address": "3377 Wilshire Blvd, Los Angeles, CA 90010", "lat": 34.0622771, "lng": -118.2975168},
  {"name": "ben", "address": "4255 W 3rd St, Los Angeles, CA 90004", "lat": 34.0693338, "lng": -118.3071538},
  {"name": "ten", "address": "4301 W 3rd St, Los Angeles, CA 90020", "lat": 34.0693455, "lng": -118.3082948},
  {"name": "ren", "address": "128 S Western Ave, Los Angeles, CA 90004", "lat": 34.0727035, "lng": -118.3087962},
  {"name": "zen", "address": "223 S Western Ave, Los Angeles, CA, 90004", "lat": 34.0703764, "lng": -118.3094927}
]


function Maps() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyB_jjfUnz1keIUkZm_D2sk8OMK1rLA9IWY",
    libraries: ['places'],
  });

  const inputRef     = useRef(null);        // StandaloneSearchBox instance
  const [map, setMap] = React.useState(null);     // keep the map around
  const [selectedPlace, setSelectedPlace] = React.useState(null);  // temp marker
  const [markers, setMarkers] = React.useState([]);                // final markers
  const [inputValue, setInputValue] = React.useState("");          // search box text
  const [name, setName] = React.useState("");   


  const onLoad = React.useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds();
    // Extending bounds to include a broader area
    bounds.extend({ lat: -3.745, lng: -38.523 });  // Center point
    bounds.extend({ lat: -3.535, lng: -38.223 });  // Additional coordinates for a larger view

    map.fitBounds(bounds);

    // Adjust zoom if the map is still too focused
    const listener = window.google.maps.event.addListenerOnce(map, 'idle', () => {
      const currentZoom = map.getZoom();
      if (currentZoom > 12) map.setZoom(12); // Cap zoom to ensure a wider view
    });

    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback(map) {
    setMap(null);
  }, []);

  const handleSearchBoxChanged = () => {
    const places = inputRef.current?.getPlaces();
    if (!places?.length || !places[0].geometry) return;
  
    const place = places[0];
    const lat   = place.geometry.location.lat();
    const lng   = place.geometry.location.lng();
  
    // ① centre / zoom the map
    map?.setCenter({ lat, lng });
    map?.setZoom(16);
  
    // ② stash this location so we can show a *temporary* marker
    setSelectedPlace({
      address: place.formatted_address,
      lat,
      lng,
    });
  };

  const handleAddAddress = () => {
    if (!selectedPlace) return;             // nothing chosen yet
    if (!name.trim())   return;             // or require a name
  
    // check for duplicate lat/lng
    const dup = markers.some(
      m => m.lat === selectedPlace.lat && m.lng === selectedPlace.lng
    );
    if (dup) return;                        // optionally warn the user
  
    setMarkers(prev => [
      ...prev,
      { ...selectedPlace, name }            // name comes from the textbox
    ]);
  
    // reset UI
    setSelectedPlace(null);
    setInputValue("");
    setName("");
  };
  

  const handleInputChange = (e) => {
    setInputValue(e.target.value); // Update input value as user types
  };
  const handleNameChange = (e) => {
    setName(e.target.value);
  }
  const handleClearInput = () => {
    setInputValue(""); // Clear the input field when the 'X' is clicked
  };

  const handleMakeGroups = async () => {
    const response = await fetch(' http://127.0.0.1:5000/cluster-group', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(markers)
    });

    const data = await response.json();
    console.log(data);
  }

  return isLoaded ? (
    <div style={styles.container}>
      <div style={styles.inputWrapper}>
        <StandaloneSearchBox
          onLoad={(ref) => (inputRef.current = ref)}
          onPlacesChanged={handleSearchBoxChanged}
        >
          <TextField
            variant="outlined"
            placeholder="Search for a place..."
            value={inputValue}
            onChange={handleInputChange}
            style={styles.input}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    {inputValue && (
                      <IconButton onClick={handleClearInput} edge="end">
                        <ClearIcon />
                      </IconButton>
                    )}
                  </InputAdornment>
                ),
              },
            }}
          />
        </StandaloneSearchBox>
        <TextField
          variant="outlined"
          placeholder="Enter name..."
          value={name}
          onChange={handleNameChange}
          style={styles.nameInput}
        />
        <div>
        <button style={styles.addButton} onClick={handleAddAddress}>
          Add Address
        </button>

        <button style={styles.addButton} onClick={handleMakeGroups}>
          Make Groups
        </button>
        </div>
        
      </div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}  // Ensure a starting zoom level
        onLoad={onLoad}
        onUnmount={onUnmount}
      >

        {markers.map((m, i) => (
          <Marker
            key={`marker-${i}`}
            position={{ lat: m.lat, lng: m.lng }}
            title={m.address}
            draggable={false}
          />
        ))}
        {selectedPlace && (
          <Marker
            position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
            title={selectedPlace.address}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" // diff colour
            }}
          />
        )}
      </GoogleMap>
    </div>
  ) : (
    <></>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  inputWrapper: {
    position: 'absolute',
    top: '10%',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    width: '80%',
    maxWidth: '500px',
  },
  input: {
    width: '130%',
    padding: '2px',
    // fontSize: '16px',
    borderRadius: '5px',
    // border: '1px solid #ccc',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    backgroundColor: "white",
  },
  addButton: {
    marginLeft: '80px',
    padding: '20px 10px',
    fontSize: '16px',
    backgroundColor: '#4A90E2',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  nameInput: {
    marginRight: '10px',
    width: '200px',
    backgroundColor: 'white',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
  },
};

export default Maps;
