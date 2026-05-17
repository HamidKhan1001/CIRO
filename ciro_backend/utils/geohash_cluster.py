from geohash2 import encode as geohash_encode, decode_exactly
import json
from typing import List, Dict, Tuple


# Dummy imports for db/redis, since they aren't explicitly provided in snippet
# class db: ... 
# class redis: ...

class GeoHashCluster:
    def __init__(self, precision: int = 6):
        """
        GeoHash clustering with configurable precision
        
        Precision levels:
        4: ~20km cells
        5: ~4.9km cells
        6: ~1.2km cells
        7: ~152m cells
        8: ~38m cells
        """
        self.precision = precision
    
    def cluster_incidents(self, bbox_tuple: Tuple[float, float, float, float], incidents: List) -> Dict:
        """
        Cluster incidents within bounding box
        
        Args:
            bbox_tuple: (min_lat, min_lon, max_lat, max_lon)
            incidents: list of incident objects to cluster
        
        Returns:
            GeoJSON FeatureCollection with clusters and single incidents
        """
        min_lat, min_lon, max_lat, max_lon = bbox_tuple
        
        if not incidents:
            return {"type": "FeatureCollection", "features": []}
        
        # Cluster by geohash
        clusters = {}
        for incident in incidents:
            gh = geohash_encode(incident.lat, incident.lon, precision=self.precision)
            if gh not in clusters:
                clusters[gh] = []
            clusters[gh].append(incident)
        
        features = []
        
        # Create cluster features
        for gh, cluster_incidents in clusters.items():
            if len(cluster_incidents) > 1:
                # Multi-incident cluster
                feature = self._create_cluster_feature(gh, cluster_incidents)
            else:
                # Single incident
                feature = self._create_incident_feature(cluster_incidents[0])
            
            features.append(feature)
        
        return {
            "type": "FeatureCollection",
            "features": features
        }
    
    def _create_cluster_feature(self, gh: str, incidents: List) -> Dict:
        """Create GeoJSON feature for cluster"""
        lat, lon, lat_err, lon_err = decode_exactly(gh)
        bounds_arr = [lon - lon_err, lat - lat_err, lon + lon_err, lat + lat_err]
        
        return {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat]
            },
            "properties": {
                "cluster": True,
                "count": len(incidents),
                "severity": max([getattr(i, 'severity_numeric', 1) for i in incidents]),
                "affected_population": sum([getattr(i, 'affected_population', 0) for i in incidents]),
                "bbox": bounds_arr,
                "geohash": gh
            }
        }
    
    def _create_incident_feature(self, incident) -> Dict:
        """Create GeoJSON feature for single incident"""
        return {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [incident.lon, incident.lat]
            },
            "properties": {
                "cluster": False,
                "incident_id": getattr(incident, 'id', ''),
                "crisis_type": getattr(incident, 'crisis_type', ''),
                "severity": getattr(incident, 'severity', ''),
                "severity_numeric": getattr(incident, 'severity_numeric', 1),
                "affected_population": getattr(incident, 'affected_population', 0)
            }
        }
