from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from collections import defaultdict
from sklearn.cluster import KMeans

app = Flask(__name__)
CORS(app)


def helper(users):
    coordinates = np.array([[user["lat"], user["lng"]] for user in users])
    
    kmeans = KMeans(n_clusters=2, random_state=42)
    labels = kmeans.fit_predict(coordinates)
    
    clusters = defaultdict(list)
    for user, label in zip(users, labels):
        clusters[label].append(user["name"])

    grouped_names = list(clusters.values())
    return grouped_names

@app.route('/cluster-group', methods=["POST"])
def cluster_users():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No User data provided"}), 400
    
    try:
        grouped = helper(data)
        return jsonify({"groups": grouped})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

if __name__ == '__main__':
    app.run(port=5000)
