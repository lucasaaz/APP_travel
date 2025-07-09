import React, { useState, useEffect } from "react";
import "./App.css";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "70%", // Tamanho do mapa
  height: "400px",
};

const center = {
  lat: -34.6037, // Latitude inicial (Buenos Aires)
  lng: -58.3816, // Longitude inicial (Buenos Aires)
};

const App = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [wantToGo, setWantToGo] = useState(() =>
    JSON.parse(localStorage.getItem("wantToGo")) || []
  );
  const [visited, setVisited] = useState(() =>
    JSON.parse(localStorage.getItem("visited")) || []
  );

  // Atualiza listas no localStorage
  useEffect(() => {
    localStorage.setItem("wantToGo", JSON.stringify(wantToGo));
  }, [wantToGo]);

  useEffect(() => {
    localStorage.setItem("visited", JSON.stringify(visited));
  }, [visited]);

  // Busca sugestões no backend
  const fetchSuggestions = (inputValue) => {
    if (inputValue.length < 3) {
      setSuggestions([]);
      return;
    }

    fetch(
      `http://127.0.0.1:5000/search_places?query=${encodeURIComponent(
        inputValue
      )}&location=Buenos+Aires`
    )
      .then((response) => response.json())
      .then((data) => setSuggestions(data))
      .catch((error) => console.error("Erro ao buscar lugares:", error));
  };

  const handleQueryChange = (e) => {
    const inputValue = e.target.value;
    setQuery(inputValue);
    fetchSuggestions(inputValue);
  };

  const addToWantToGo = (place) => {
    setWantToGo([...wantToGo, place]);
    setSuggestions([]);
    setQuery("");
  };

  const addToVisited = (place) => {
    setVisited([...visited, place]);
    setSuggestions([]);
    setQuery("");
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Travel Planner</h1>

        <input
          type="text"
          placeholder="Digite algo para buscar..."
          value={query}
          onChange={handleQueryChange}
        />

        {suggestions.length > 0 && (
          <ul className="autocomplete-results">
            {suggestions.map((place, index) => (
              <li key={index}>
                <span>
                  {place.name} - {place.address}
                </span>
                <div className="add-buttons">
                  <button onClick={() => addToWantToGo(place)}>Quero Visitar</button>
                  <button onClick={() => addToVisited(place)}>Já Visitei</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Mapa */}
        <div className="map-and-lists">
          <LoadScript googleMapsApiKey="AIzaSyCymXsTmYyT3JdhBHQd4eK0a3mzWxiZws0"> {/* Adicione sua chave aqui */}
            <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={13}>
              {/* Marcadores para lugares da lista "Quero Visitar" */}
              {wantToGo.map((place, index) => (
                <Marker
                  key={index}
                  position={{ lat: place.lat, lng: place.lng }}
                  icon={{
                    url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                  }}
                  title={place.name}
                />
              ))}

              {/* Marcadores para lugares da lista "Já Visitei" */}
              {visited.map((place, index) => (
                <Marker
                  key={index}
                  position={{ lat: place.lat, lng: place.lng }}
                  icon={{
                    url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                  }}
                  title={place.name}
                />
              ))}
            </GoogleMap>
          </LoadScript>

          {/* Listas */}
          <div className="lists-container">
            <div className="list">
              <h2>Quero Visitar</h2>
              <ul>
                {wantToGo.map((place, index) => (
                  <li key={index}>
                    <strong>{place.name}</strong> - {place.address}
                  </li>
                ))}
              </ul>
            </div>

            <div className="list">
              <h2>Já Visitei</h2>
              <ul>
                {visited.map((place, index) => (
                  <li key={index}>
                    <strong>{place.name}</strong> - {place.address}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};

export default App;