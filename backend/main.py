from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import googlemaps
import datetime
import os

# Configuração do app e banco de dados
app = Flask(__name__)
CORS(app)  # Adiciona permissão para o React acessar o Flask

# Pega a URL do banco do ambiente
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Configuração do Google Maps API
GMAPS_API_KEY = "AIzaSyCymXsTmYyT3JdhBHQd4eK0a3mzWxiZws0"
gmaps = googlemaps.Client(key=GMAPS_API_KEY)

# Modelo do Banco de Dados
class Place(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    address = db.Column(db.String(300), nullable=False)
    category = db.Column(db.String(100), nullable=True)
    visited = db.Column(db.Boolean, default=False)


class RouteHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    start = db.Column(db.String(200))
    end = db.Column(db.String(200))
    mode = db.Column(db.String(50))  # Tipo de transporte
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)


class CustomList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)


# Inicialização do banco
with app.app_context():
    db.create_all()

# Rota principal
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/create_db')
def create_db():
    db.create_all()
    return 'Banco criado com sucesso!'

# Criar uma lista personalizada
@app.route('/create_list', methods=['POST'])
def create_list():
    data = request.json
    list_name = data.get('list_name')
    new_list = CustomList(name=list_name)
    db.session.add(new_list)
    db.session.commit()
    return jsonify({"message": f"Lista '{list_name}' criada com sucesso!"})


# Marcar um lugar como visitado
@app.route('/mark_place', methods=['POST'])
def mark_place():
    data = request.json
    place_id = data['id']
    visited = data['visited']

    place = Place.query.filter_by(id=place_id).first()
    if place:
        place.visited = visited
        db.session.commit()
        return jsonify({"message": "Lugar atualizado com sucesso!"})
    else:
        return jsonify({"error": "Lugar não encontrado!"}), 404


# Buscar lugares pela API do Google Maps
@app.route('/search_places', methods=['GET'])
def search_places():
    query = request.args.get('query')
    location = request.args.get('location', "Buenos Aires, Argentina")

    results = gmaps.places(query=query, location=location)
    places = []
    for place in results.get("results", []):
        geometry = place.get("geometry", {}).get("location", {})
        places.append({
            "name": place.get("name"),
            "address": place.get("formatted_address", "Endereço desconhecido"),
            "rating": place.get("rating", "Sem avaliação"),
            "lat": geometry.get("lat"),
            "lng": geometry.get("lng")
        })

    return jsonify(places)


# Buscar rotas multimodais
@app.route('/get_route', methods=['GET'])
def get_route():
    start = request.args.get('start')  # Ex.: "La Boca, Buenos Aires"
    end = request.args.get('end')  # Ex.: "Palermo, Buenos Aires"
    mode = request.args.get('mode', 'driving')  # driving, walking, transit

    directions = gmaps.directions(origin=start, destination=end, mode=mode)
    if directions:
        route = directions[0]['legs'][0]
        distance = route['distance']['text']
        duration = route['duration']['text']

        # Salvar no histórico de rotas
        route_history = RouteHistory(start=start, end=end, mode=mode)
        db.session.add(route_history)
        db.session.commit()

        return jsonify({
            "start_address": route['start_address'],
            "end_address": route['end_address'],
            "distance": distance,
            "duration": duration,
            "steps": [{"instruction": step['html_instructions'], "distance": step['distance']['text']} for step in route['steps']]
        })
    else:
        return jsonify({"error": "Rota não encontrada!"})


# Obter histórico de rotas
@app.route('/get_route_history', methods=['GET'])
def get_route_history():
    history = RouteHistory.query.all()
    return jsonify([
        {
            "id": route.id,
            "start": route.start,
            "end": route.end,
            "mode": route.mode,
            "created_at": route.created_at.strftime("%Y-%m-%d %H:%M")
        }
        for route in history
    ])


# Inicialização do servidor
if __name__ == '__main__':
    app.run(debug=True)
