# backend/main.py (Corrected)

# import os
# import ee
# import uvicorn
# import pandas as pd
# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import Optional, Dict, Any
# from dotenv import load_dotenv
# from fastapi.responses import StreamingResponse
# import io

# # --- Pydantic Models ---
# class MapRequest(BaseModel):
#     year: int
#     month: int
#     aoi: Optional[Dict[str, Any]] = None

# class PointDataRequest(BaseModel):
#     lat: float
#     lon: float
#     end_year: int
#     end_month: int
#     aoi: Optional[Dict[str, Any]] = None

# # --- FastAPI App ---
# app = FastAPI()
# origins = ["http://localhost:5173", "https://your-app-name.netlify.app"]
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # --- GEE Auth ---
# try:
#     ee.Initialize(opt_url='https://earthengine-highvolume.googleapis.com')
#     print("GEE Authenticated Successfully")
# except Exception as e:
#     raise RuntimeError(f"Error initializing Earth Engine: {e}")

# # --- GEE Logic ---
# DEFAULT_AOI = ee.Geometry.Rectangle([-74.25, 40.5, -73.7, 40.9])

# def get_ee_geometry(aoi_geojson: Optional[Dict[str, Any]] = None) -> ee.Geometry:
#     if aoi_geojson and 'geometry' in aoi_geojson and aoi_geojson['geometry']:
#         coords = aoi_geojson['geometry']['coordinates']
#         geom_type = aoi_geojson['geometry']['type']
#         if geom_type == 'Polygon':
#             return ee.Geometry.Polygon(coords)
#     return DEFAULT_AOI

# def mask_s2_clouds(image):
#     qa = image.select('QA60')
#     cloud_bit_mask = 1 << 10
#     cirrus_bit_mask = 1 << 11
#     mask = qa.bitwiseAnd(cloud_bit_mask).eq(0).And(qa.bitwiseAnd(cirrus_bit_mask).eq(0))
#     return image.updateMask(mask).divide(10000).copyProperties(image, ["system:time_start"])

# def add_ndvi(image):
#     ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
#     return image.addBands(ndvi)

# def get_monthly_ndvi_collection(aoi: ee.Geometry):
#     s2_collection = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
#                      .filterBounds(aoi)
#                      .map(mask_s2_clouds)
#                      .map(add_ndvi)
#                      .select('NDVI'))
#     return s2_collection

# # --- API Endpoints ---
# @app.post("/api/mapid")
# def get_map_id(req: MapRequest):
#     try:
#         aoi = get_ee_geometry(req.aoi)
#         start_date = f"{req.year}-{req.month:02d}-01"
#         end_date = pd.to_datetime(start_date) + pd.offsets.MonthEnd(1)
#         s2_collection = get_monthly_ndvi_collection(aoi)
#         monthly_image = s2_collection.filterDate(start_date, end_date.strftime('%Y-%m-%d')).median()
#         image = monthly_image.clip(aoi)
#         vis_params = {'min': -0.2, 'max': 0.8, 'palette': ['#d73027', '#fee08b', '#1a9850']}
#         map_id = image.getMapId(vis_params)
#         return {"tileUrl": map_id['tile_fetcher'].url_format}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# def calculate_time_series(point: ee.Geometry, end_year: int, end_month: int, aoi: ee.Geometry):
#     end_date = pd.to_datetime(f'{end_year}-{end_month}-01')
#     date_range = pd.date_range(end=end_date, periods=12, freq='MS')
#     s2_collection = get_monthly_ndvi_collection(aoi)

#     def get_monthly_mean(d):
#         # Cast the date to an ee.Date object to use GEE functions
#         start = ee.Date(d)
#         end = start.advance(1, 'month')
        
#         monthly_image = s2_collection.filterDate(start, end).median()
        
#         mean_value = monthly_image.reduceRegion(
#             reducer=ee.Reducer.mean(),
#             geometry=point.buffer(15),
#             scale=10
#         ).get('NDVI')
        
#         # **THE FIX IS HERE:** Use GEE's server-side date formatting `format('YYYY-MM')`
#         # instead of the client-side Python `strftime`.
#         return ee.Feature(None, {'date': start.format('YYYY-MM'), 'ndvi': mean_value})

#     ee_dates = ee.List([d.strftime('%Y-%m-%d') for d in date_range])
#     results = ee_dates.map(get_monthly_mean)
#     return results.getInfo()

# @app.post("/api/timeseries")
# def get_point_timeseries(req: PointDataRequest):
#     try:
#         point = ee.Geometry.Point(req.lon, req.lat)
#         aoi = get_ee_geometry(req.aoi)
#         feature_collection = calculate_time_series(point, req.end_year, req.end_month, aoi)
#         time_series_data = [f['properties'] for f in feature_collection]
#         for item in time_series_data:
#             if item['ndvi'] is not None:
#                 item['ndvi'] = round(item['ndvi'], 4)
#         return {"timeSeries": time_series_data}
#     except Exception as e:
#         print(f"Error in /api/timeseries: {e}") # Added print for debugging
#         raise HTTPException(status_code=500, detail=str(e))

# @app.post("/api/export_csv")
# def export_timeseries_csv(req: PointDataRequest):
#     # This endpoint logic remains the same
#     try:
#         point = ee.Geometry.Point(req.lon, req.lat)
#         aoi = get_ee_geometry(req.aoi)
#         feature_collection = calculate_time_series(point, req.end_year, req.end_month, aoi)
#         data = [f['properties'] for f in feature_collection]
#         df = pd.DataFrame(data)
#         output = io.StringIO()
#         df.to_csv(output, index=False)
#         return StreamingResponse(
#             iter([output.getvalue()]),
#             media_type="text/csv",
#             headers={"Content-Disposition": f"attachment; filename=ndvi_timeseries_{req.lat:.2f}_{req.lon:.2f}.csv"}
#         )
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# if __name__ == "__main__":
#     uvicorn.run(app, host="0.0.0.0", port=8000)



# # backend/main.py (Final Version)

# import os
# import ee
# import uvicorn
# import pandas as pd
# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import Optional, Dict, Any
# from dotenv import load_dotenv
# from fastapi.responses import StreamingResponse
# import io

# # --- Pydantic Models ---
# class MapRequest(BaseModel):
#     year: int
#     month: int
#     aoi: Optional[Dict[str, Any]] = None

# class PointDataRequest(BaseModel):
#     lat: float
#     lon: float
#     end_year: int
#     end_month: int
#     aoi: Optional[Dict[str, Any]] = None

# # --- FastAPI App ---
# app = FastAPI()
# origins = ["http://localhost:5173", "https://your-app-name.netlify.app"] # Add your Netlify URL here later
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # --- GEE Auth ---
# try:
#     ee.Initialize(opt_url='https://earthengine-highvolume.googleapis.com')
#     print("GEE Authenticated Successfully")
# except Exception as e:
#     raise RuntimeError(f"Error initializing Earth Engine: {e}")

# # --- GEE Logic ---
# DEFAULT_AOI = ee.Geometry.Rectangle([-74.25, 40.5, -73.7, 40.9])

# # ** THIS FUNCTION IS THE FIX **
# # It is now more robust at parsing the shape drawn by the user.
# def get_ee_geometry(aoi_geojson: Optional[Dict[str, Any]] = None) -> ee.Geometry:
#     """Creates an ee.Geometry object from GeoJSON or returns the default."""
#     try:
#         # Check if the geojson and its geometry attribute exist
#         if aoi_geojson and 'geometry' in aoi_geojson and aoi_geojson['geometry']:
#             geom = aoi_geojson['geometry']
#             # GEE can often directly ingest a GeoJSON geometry dictionary.
#             # This is more robust than parsing 'type' and 'coordinates' manually.
#             return ee.Geometry(geom)
#     except Exception as e:
#         # If GEE fails to parse the geometry, we'll see this error in the backend log.
#         print(f"!!! GEE parsing error for incoming GeoJSON: {e}")
    
#     # If anything fails or if no AOI is provided, fall back to the default.
#     return DEFAULT_AOI

# def mask_s2_clouds(image):
#     qa = image.select('MSK_CLDPRB')
#     mask = qa.lt(30).selfMask()
#     return image.updateMask(mask).divide(10000).copyProperties(image, ["system:time_start"])

# def add_ndvi(image):
#     ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
#     return image.addBands(ndvi)

# def get_monthly_ndvi_collection(aoi: ee.Geometry):
#     s2_collection = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
#                      .filterBounds(aoi)
#                      .map(mask_s2_clouds)
#                      .map(add_ndvi)
#                      .select('NDVI'))
#     return s2_collection

# # --- API Endpoints ---
# @app.post("/api/mapid")
# def get_map_id(req: MapRequest):
#     try:
#         aoi = get_ee_geometry(req.aoi)
#         start_date = f"{req.year}-{req.month:02d}-01"
#         end_date = pd.to_datetime(start_date) + pd.offsets.MonthEnd(1)
#         s2_collection = get_monthly_ndvi_collection(aoi)
#         monthly_image = s2_collection.filterDate(start_date, end_date.strftime('%Y-%m-%d')).median()
#         image = monthly_image.clip(aoi)
#         vis_params = {'min': -0.2, 'max': 0.8, 'palette': ['#d73027', '#fee08b', '#1a9850']}
#         map_id = image.getMapId(vis_params)
#         return {"tileUrl": map_id['tile_fetcher'].url_format}
#     except Exception as e:
#         # This will now catch errors if the AOI is too large or invalid for GEE processing
#         print(f"Error during GEE processing in /api/mapid: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

# def calculate_time_series(point: ee.Geometry, end_year: int, end_month: int, aoi: ee.Geometry):
#     end_date = pd.to_datetime(f'{end_year}-{end_month}-01')
#     date_range = pd.date_range(end=end_date, periods=12, freq='MS')
#     s2_collection = get_monthly_ndvi_collection(aoi)

#     def get_monthly_mean(d):
#         start = ee.Date(d)
#         end = start.advance(1, 'month')
#         monthly_image = s2_collection.filterDate(start, end).median()
#         mean_value = monthly_image.reduceRegion(
#             reducer=ee.Reducer.mean(), geometry=point.buffer(15), scale=10
#         ).get('NDVI')
#         return ee.Feature(None, {'date': start.format('YYYY-MM'), 'ndvi': mean_value})

#     ee_dates = ee.List([d.strftime('%Y-%m-%d') for d in date_range])
#     results = ee_dates.map(get_monthly_mean)
#     return results.getInfo()

# @app.post("/api/timeseries")
# def get_point_timeseries(req: PointDataRequest):
#     try:
#         point = ee.Geometry.Point(req.lon, req.lat)
#         aoi = get_ee_geometry(req.aoi)
#         feature_collection = calculate_time_series(point, req.end_year, req.end_month, aoi)
#         time_series_data = [f['properties'] for f in feature_collection]
#         for item in time_series_data:
#             if item['ndvi'] is not None:
#                 item['ndvi'] = round(item['ndvi'], 4)
#         return {"timeSeries": time_series_data}
#     except Exception as e:
#         print(f"Error in /api/timeseries: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

# @app.post("/api/export_csv")
# def export_timeseries_csv(req: PointDataRequest):
#     try:
#         point = ee.Geometry.Point(req.lon, req.lat)
#         aoi = get_ee_geometry(req.aoi)
#         feature_collection = calculate_time_series(point, req.end_year, req.end_month, aoi)
#         data = [f['properties'] for f in feature_collection]
#         df = pd.DataFrame(data)
#         output = io.StringIO()
#         df.to_csv(output, index=False)
#         return StreamingResponse(
#             iter([output.getvalue()]),
#             media_type="text/csv",
#             headers={"Content-Disposition": f"attachment; filename=ndvi_timeseries_{req.lat:.2f}_{req.lon:.2f}.csv"}
#         )
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# if __name__ == "__main__":
#     uvicorn.run(app, host="0.0.0.0", port=8000)





# backend/main.py (Final Typing Fix)

import os
import ee
import uvicorn
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from fastapi.responses import StreamingResponse
import io
from google.oauth2.service_account import Credentials

# --- Pydantic Models (THIS SECTION IS FIXED) ---
class MapRequest(BaseModel):
    year: int
    month: int
    # The fix is here: Optional[Dict[str, Any]] is the correct syntax
    aoi: Optional[Dict[str, Any]] = None

class PointDataRequest(BaseModel):
    lat: float
    lon: float
    end_year: int
    end_month: int
    # The fix is here as well
    aoi: Optional[Dict[str, Any]] = None

# --- FastAPI App & CORS (No Changes) ---
app = FastAPI()
origins = [
    "http://localhost:5173",
    "https://gee-map-dashboard.netlify.app/" # Make sure to update this later
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GEE Authentication (No Changes from last step) ---
SERVICE_ACCOUNT_FILE = 'google_credentials.json'

try:
    base_credentials = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE)
    scoped_credentials = base_credentials.with_scopes([
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/earthengine'
    ])
    ee.Initialize(scoped_credentials, opt_url='https://earthengine-highvolume.googleapis.com')
    print("GEE Authenticated Successfully with explicit credentials and scope.")
except Exception as e:
    print(f"!!! FAILED to initialize GEE with explicit credentials: {e}")
    raise RuntimeError(f"Error initializing Earth Engine with explicit credentials: {e}")

# --- ALL OTHER GEE LOGIC AND API ENDPOINTS REMAIN EXACTLY THE SAME ---
DEFAULT_AOI = ee.Geometry.Rectangle([-74.25, 40.5, -73.7, 40.9])

def get_ee_geometry(aoi_geojson: Optional[Dict[str, Any]] = None) -> ee.Geometry:
    try:
        if aoi_geojson and 'geometry' in aoi_geojson and aoi_geojson['geometry']:
            geom = aoi_geojson['geometry']
            return ee.Geometry(geom)
    except Exception as e:
        print(f"!!! GEE parsing error for incoming GeoJSON: {e}")
    return DEFAULT_AOI

def mask_s2_clouds(image):
    qa = image.select('QA60')
    cloud_bit_mask = 1 << 10
    cirrus_bit_mask = 1 << 11
    mask = qa.bitwiseAnd(cloud_bit_mask).eq(0).And(qa.bitwiseAnd(cirrus_bit_mask).eq(0))
    return image.updateMask(mask).divide(10000).copyProperties(image, ["system:time_start"])

def add_ndvi(image):
    ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
    return image.addBands(ndvi)

def get_monthly_ndvi_collection(aoi: ee.Geometry):
    s2_collection = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                     .filterBounds(aoi)
                     .map(mask_s2_clouds)
                     .map(add_ndvi)
                     .select('NDVI'))
    return s2_collection

@app.post("/api/mapid")
def get_map_id(req: MapRequest):
    try:
        aoi = get_ee_geometry(req.aoi)
        start_date = f"{req.year}-{req.month:02d}-01"
        end_date = pd.to_datetime(start_date) + pd.offsets.MonthEnd(1)
        s2_collection = get_monthly_ndvi_collection(aoi)
        monthly_image = s2_collection.filterDate(start_date, end_date.strftime('%Y-%m-%d')).median()
        image = monthly_image.clip(aoi)
        vis_params = {'min': -0.2, 'max': 0.8, 'palette': ['#d73027', '#fee08b', '#1a9850']}
        map_id = image.getMapId(vis_params)
        return {"tileUrl": map_id['tile_fetcher'].url_format}
    except Exception as e:
        print(f"Error during GEE processing in /api/mapid: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def calculate_time_series(point: ee.Geometry, end_year: int, end_month: int, aoi: ee.Geometry):
    end_date = pd.to_datetime(f'{end_year}-{end_month}-01')
    date_range = pd.date_range(end=end_date, periods=12, freq='MS')
    s2_collection = get_monthly_ndvi_collection(aoi)

    def get_monthly_mean(d):
        start = ee.Date(d)
        end = start.advance(1, 'month')
        monthly_image = s2_collection.filterDate(start, end).median()
        mean_value = monthly_image.reduceRegion(
            reducer=ee.Reducer.mean(), geometry=point.buffer(15), scale=10
        ).get('NDVI')
        return ee.Feature(None, {'date': start.format('YYYY-MM'), 'ndvi': mean_value})

    ee_dates = ee.List([d.strftime('%Y-%m-%d') for d in date_range])
    results = ee_dates.map(get_monthly_mean)
    return results.getInfo()

@app.post("/api/timeseries")
def get_point_timeseries(req: PointDataRequest):
    try:
        point = ee.Geometry.Point(req.lon, req.lat)
        aoi = get_ee_geometry(req.aoi)
        feature_collection = calculate_time_series(point, req.end_year, req.end_month, aoi)
        time_series_data = [f['properties'] for f in feature_collection]
        for item in time_series_data:
            if item['ndvi'] is not None:
                item['ndvi'] = round(item['ndvi'], 4)
        return {"timeSeries": time_series_data}
    except Exception as e:
        print(f"Error in /api/timeseries: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/export_csv")
def export_timeseries_csv(req: PointDataRequest):
    try:
        point = ee.Geometry.Point(req.lon, req.lat)
        aoi = get_ee_geometry(req.aoi)
        feature_collection = calculate_time_series(point, req.end_year, req.end_month, aoi)
        data = [f['properties'] for f in feature_collection]
        df = pd.DataFrame(data)
        output = io.StringIO()
        df.to_csv(output, index=False)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=ndvi_timeseries_{req.lat:.2f}_{req.lon:.2f}.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)