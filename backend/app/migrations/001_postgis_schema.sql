CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS features (
    feature_id VARCHAR(64) PRIMARY KEY,
    image_id VARCHAR(64) NOT NULL,
    feature_type VARCHAR(32) NOT NULL CHECK (feature_type IN ('BUILDING', 'ROAD', 'WATERBODY')),
    geom geometry(Geometry, 4326) NOT NULL,
    geometry_json JSONB NOT NULL,
    area_m2 DOUBLE PRECISION NOT NULL CHECK (area_m2 >= 0),
    perimeter_m DOUBLE PRECISION NULL CHECK (perimeter_m IS NULL OR perimeter_m >= 0),
    length_m DOUBLE PRECISION NULL CHECK (length_m IS NULL OR length_m >= 0),
    confidence DOUBLE PRECISION NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    confidence_level VARCHAR(16) NOT NULL CHECK (confidence_level IN ('HIGH', 'MEDIUM', 'LOW')),
    status VARCHAR(32) NOT NULL CHECK (
        status IN (
            'AUTO_ACCEPTED',
            'REVIEW_RECOMMENDED',
            'HUMAN_REVIEW_REQUIRED',
            'ACCEPTED',
            'REJECTED',
            'EDITED'
        )
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_features_image_id ON features (image_id);
CREATE INDEX IF NOT EXISTS idx_features_type ON features (feature_type);
CREATE INDEX IF NOT EXISTS idx_features_status ON features (status);
CREATE INDEX IF NOT EXISTS idx_features_geom ON features USING GIST (geom);

CREATE TABLE IF NOT EXISTS reviews (
    review_id VARCHAR(64) PRIMARY KEY,
    feature_id VARCHAR(64) NOT NULL REFERENCES features(feature_id),
    reviewer_id VARCHAR(64) NOT NULL,
    action VARCHAR(16) NOT NULL CHECK (action IN ('ACCEPT', 'REJECT', 'EDIT')),
    comment TEXT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_feature_id ON reviews (feature_id);

CREATE TABLE IF NOT EXISTS exports (
    export_id VARCHAR(64) PRIMARY KEY,
    image_id VARCHAR(64) NOT NULL,
    format VARCHAR(16) NOT NULL CHECK (format IN ('GEOJSON', 'CSV')),
    layers JSONB NOT NULL,
    file_uri TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exports_image_id ON exports (image_id);
