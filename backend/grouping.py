import numpy as np
from sklearn.cluster import KMeans
from geopy.geocoders import Nominatim
from sklearn.metrics.pairwise import haversine_distances
from math import radians
from geopy.exc import GeocoderTimedOut
import matplotlib.pyplot as plt

# Function to geocode addresses to latitude and longitude
def geocode_addresses(addresses):
    geolocator = Nominatim(user_agent="UberSplitter")
    coordinates = []
    
    for address in addresses:
        try:
            location = geolocator.geocode(address)
            if location:
                coordinates.append((location.latitude, location.longitude))
            else:
                print(f"Address not found: {address}")
        except GeocoderTimedOut:
            print(f"Geocoding timed out for address: {address}")
    
    print(coordinates)
    
    return np.array(coordinates)

# Haversine distance function
def haversine(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat / 2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    R = 6371  # Radius of the Earth in kilometers
    return R * c  # Returns the distance in kilometers

# Post-process function to ensure clusters are between 4-6 members
def post_process_clusters(labels, coordinates, min_size=4, max_size=6):
    unique_labels = np.unique(labels)
    new_clusters = []
    
    for label in unique_labels:
        cluster_indices = np.where(labels == label)[0]
        cluster_size = len(cluster_indices)
        
        # If cluster size is larger than max_size, split the cluster
        if cluster_size > max_size:
            new_clusters.append(cluster_indices[:max_size])
            new_clusters.append(cluster_indices[max_size:])
        # If cluster size is smaller than min_size, merge it with the closest cluster
        elif cluster_size < min_size:
            # Find the nearest cluster and merge
            nearest_cluster = find_nearest_cluster(label, labels, coordinates)
            new_clusters[nearest_cluster].extend(cluster_indices)
        else:
            new_clusters.append(cluster_indices)
    
    # Re-label the clusters
    new_labels = np.zeros(len(labels), dtype=int)
    for idx, cluster in enumerate(new_clusters):
        for i in cluster:
            new_labels[i] = idx
    
    return new_labels

# Find the nearest cluster by calculating the distance between centroids
def find_nearest_cluster(label, labels, coordinates):
    centroid = np.mean(coordinates[labels == label], axis=0)
    nearest_cluster = None
    min_dist = float('inf')
    
    for i in np.unique(labels):
        if i != label:
            other_centroid = np.mean(coordinates[labels == i], axis=0)
            dist = haversine(centroid[0], centroid[1], other_centroid[0], other_centroid[1])
            if dist < min_dist:
                min_dist = dist
                nearest_cluster = i
    
    return nearest_cluster

# Main function to apply K-Means and perform post-processing
def cluster_addresses(addresses):
    # Step 1: Geocode addresses
    coordinates = geocode_addresses(addresses)
    
    if len(coordinates) < 4:
        print("Not enough addresses to form clusters.")
        return None
    
    # Step 2: Apply K-Means clustering
    kmeans = KMeans(n_clusters=2, random_state=42)  # Start with 2 clusters as an example
    kmeans.fit(coordinates)
    labels = kmeans.labels_
    
    # Step 3: Post-process clusters to ensure size constraints (4-6 addresses per cluster)
    # final_labels = post_process_clusters(labels, coordinates)

    final_labels = labels
    
    # Step 4: Visualize the clusters
    # plt.scatter(coordinates[:, 1], coordinates[:, 0], c=final_labels, cmap='viridis')
    # plt.title("Clustered Addresses")
    # plt.xlabel("Longitude")
    # plt.ylabel("Latitude")
    # plt.show()

    
    centers = []
    geolocator = Nominatim(user_agent="UberSplitter2")
    for center in kmeans.cluster_centers_:
        address = geolocator.reverse((center[0], center[1]), timeout=10)
        centers.append(address.address)
    
    print("number of centers: ", len(centers))
    
    return final_labels, centers

# Example usage
addresses = [
    "2533 Hillegass Ave, Berkeley, CA  94704",
    "2545 Benvenue Ave, Berkeley, CA  94704",
    "1849 Shattuck Ave, Berkeley, CA  94709",
    "2319 Shattuck Ave, Berkeley, CA  94704",
    "2175 Dwight Way, Berkeley, CA  94704",
    "2640 Shattuck Ave, Berkeley, CA  94704",

]

labels, centers = cluster_addresses(addresses)
# print(labels)
print(centers)
