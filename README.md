# Interactive GEE NDVI Map Dashboard

A full-stack web application that visualizes monthly NDVI (Normalized Difference Vegetation Index) using data from Google Earth Engine, deployed on Netlify and Render.

**Live Demo:** [https://gee-map-dashboard.netlify.app](https://gee-map-dashboard.netlify.app)



## 📝 Project Overview

This dashboard provides an interactive map interface to explore and analyze vegetation health over time. Users can select a date and an area of interest (either the default New York City or a custom-drawn polygon/rectangle) to view the corresponding NDVI data. The application also allows for point-based time-series analysis, generating a chart of the last 12 months of NDVI data for any clicked location and allowing for a CSV data export.

This project demonstrates a complete full-stack workflow, from server-side geospatial data processing with a Python backend to a responsive, interactive user interface built with React, all deployed to modern cloud platforms.

## ✨ Features

-   **Dynamic NDVI Visualization:** Fetches and displays monthly median NDVI composites from Google Earth Engine.
-   **Custom Area of Interest (AOI):** Users can draw a custom rectangle or polygon on the map to run the analysis for any region.
-   **Interactive Point Analysis:** Click anywhere on the map to generate a 12-month time-series chart of the average NDVI for that location.
-   **Data Export:** Export the generated time-series data to a CSV file.
-   **Interactive UI:** Modern, responsive sidebar with date controls, a dynamic legend, and an analysis panel.
-   **Dual Basemaps:** Toggle between OpenStreetMap and satellite imagery baselayers.

## 🛠️ Tech Stack

-   **Frontend:** React (Vite), Leaflet.js, React-Leaflet, `react-leaflet-draw`, Recharts, Axios
-   **Backend:** Python, FastAPI
-   **Geospatial Data:** Google Earth Engine (GEE)
-   **Deployment:**
    -   Frontend deployed on **Netlify**.
    -   Backend deployed on **Render**.

## 📊 Data Source & Processing

-   **Dataset:** [Sentinel-2 L2A (COPERNICUS/S2_SR_HARMONIZED)](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED) via Google Earth Engine.
-   **Processing Steps (on the backend):**
    1.  Filter the ImageCollection by the user-defined date and Area of Interest.
    2.  Apply a cloud mask using the `QA60` band to remove poor-quality pixels.
    3.  Calculate NDVI for each image using the formula: `(NIR - Red) / (NIR + Red)`.
    4.  Create a single, seamless monthly image by taking the median value of all images in the collection.
    5.  For point analysis, this process is repeated for the last 12 months to generate time-series data.

## 🚀 Local Setup & Installation

To run this project on your local machine, follow these steps.

### Prerequisites

-   Python 3.9+
-   Node.js v18+
-   A Google Cloud Platform (GCP) project with the Earth Engine API enabled.
-   A `google_credentials.json` service account key file.

### Backend Setup

1.  Navigate to the `/backend` directory: `cd backend`
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  Install dependencies: `pip install -r requirements.txt`
4.  Place your `google_credentials.json` file in the `/backend` directory.
5.  Run the server: `uvicorn main:app --reload`

### Frontend Setup

1.  Open a new terminal and navigate to the `/frontend` directory: `cd frontend`
2.  Install dependencies: `npm install`
3.  Run the development server: `npm run dev`
4.  Open `http://localhost:5173` in your browser.