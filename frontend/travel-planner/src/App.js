import React, { useState, useEffect } from "react";
import "./App.css";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "1150px", // Tamanho do mapa
  height: "1000px",
};

const center = {
  lat: -34.6037, // Latitude inicial (Buenos Aires)
  lng: -58.3816, // Longitude inicial (Buenos Aires)
};

const getIconForCategory = (category) => {
  switch (category) {
    case "restaurante":
      return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
    case "estadio":
      return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
    case "ponto":
      return "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
    case "shopping":
      return "http://maps.google.com/mapfiles/ms/icons/orange-dot.png";
    default:
      return "http://maps.google.com/mapfiles/ms/icons/purple-dot.png";
  }
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
      `https://app-travel-l7ns.onrender.com/search_places?query=${encodeURIComponent(
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
    const placeWithVisitedFalse = { ...place, visited: false };
  
    // Envia para o backend
    fetch("https://app-travel-l7ns.onrender.com/add_place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(placeWithVisitedFalse),
    })
      .then((res) => res.json())
      .then((data) => console.log("Lugar 'Quero Visitar' salvo no backend:", data))
      .catch((err) => console.error("Erro ao salvar lugar 'Quero Visitar':", err));
  
    setWantToGo([...wantToGo, placeWithVisitedFalse]);
    setSuggestions([]);
    setQuery("");
  };
  
  const addToVisited = (place, category) => {
    const placeWithCategory = { ...place, category: category.toLowerCase(), visited: true };
  
    // Envia para o backend
    fetch("https://app-travel-l7ns.onrender.com/add_place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(placeWithCategory),
    })
      .then((res) => res.json())
      .then((data) => console.log("Salvo no backend:", data))
      .catch((err) => console.error("Erro ao salvar:", err));
  
    setVisited([...visited, placeWithCategory]);
    setSuggestions([]);
    setQuery("");
  };

  const markPlaceAsVisited = (place) => {
    // Atualiza no backend
    fetch("https://app-travel-l7ns.onrender.com/mark_place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: place.id, visited: true }),
    })
      .then((res) => res.json())
      .then(() => {
        // Atualiza no frontend só após sucesso
        setVisited([...visited, { ...place, visited: true }]);
        setWantToGo(wantToGo.filter((p) => p.id !== place.id))
      })
      .catch((err) => console.error("Erro ao marcar visitado:", err));
  };

  const markPlaceAsWantToGo = (place) => {
    fetch("https://app-travel-l7ns.onrender.com/mark_place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: place.id, visited: false }),
    })
      .then((res) => res.json())
      .then(() => {
        setWantToGo([...wantToGo, { ...place, visited: false }]);
        setVisited(visited.filter((p) => p.id !== place.id));
      })
      .catch((err) => console.error("Erro ao voltar para Quero Visitar:", err));
  };

  const deletePlace = (place, fromVisited) => {
    fetch("https://app-travel-l7ns.onrender.com/delete_place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: place.id }),
    })
      .then((res) => res.json())
      .then(() => {
        if (fromVisited) {
          setVisited(visited.filter((p) => p.id !== place.id));
        } else {
          setWantToGo(wantToGo.filter((p) => p.id !== place.id));
        }
      })
      .catch((err) => console.error("Erro ao deletar lugar:", err));
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
                  <select
                    className="category-select"
                    value={place.category || ""}
                    onChange={(e) => {
                      const category = e.target.value;
                      if (category) addToVisited(place, category);
                    }}
                  >
                    <option value="">Categoria...</option>
                    <option value="estadio">Estádio</option>
                    <option value="restaurante">Restaurante</option>
                    <option value="ponto">PontoTurístico</option>
                    <option value="shopping">Shopping</option>
                    <option value="outro">Outro</option>
                  </select>

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
              {wantToGo.map((place) => (
                <Marker
                  key={place.id}
                  position={{ lat: place.lat, lng: place.lng }}
                  icon={{
                    url: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
                  }}
                  title={place.name}
                />
              ))}

              {/* Marcadores para lugares da lista "Já Visitei" */}
              {visited.map((place) => (
                <Marker
                  key={place.id}
                  position={{ lat: place.lat, lng: place.lng }}
                  icon={{
                    url: getIconForCategory(place.category),
                  }}
                  title={`${place.name} - ${place.category || "sem categoria"}`}
                />
              ))}
            </GoogleMap>
          </LoadScript>

          <div className="lists-container">
            <div className="list">
              <h2>Quero Visitar</h2>
              <ul>
                {wantToGo.map((place) => (
                  <li key={place.id}>
                    <strong>{place.name}</strong> - {place.address}
                    <div className="add-buttons">
                      <button onClick={() => markPlaceAsVisited(place)}>
                        Marcar como Visitado
                      </button>
                      <button onClick={() => deletePlace(place, false)}>
                        Remover
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="list">
              <h2>Já Visitei</h2>
              <ul>
                {visited.map((place) => (
                  <li key={place.id}>
                    <strong>{place.name}</strong> - {place.address}
                    <div className="add-buttons">
                      <button onClick={() => markPlaceAsWantToGo(place)}>
                        Voltar para Quero Visitar
                      </button>
                      <button onClick={() => deletePlace(place, true)}>
                        Remover
                      </button>
                    </div>
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
