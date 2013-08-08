L.Map.include({

    highAccuracyLocate: function (options) {
        options = options || {};
        options.enableHighAccuracy = true;
        options = this._locationOptions = L.extend(
            this._defaultLocateOptions,
            options
        );

        if (!navigator.geolocation) {
            this._handleGeolocationError({
                code: 0,
                message: "Geolocation not supported."
            });
            return this;
        }

        var onResponse = L.bind(
            this._handleHighAccuracyGeolocationResponse,
            this
        ),
            onError = L.bind(this._handleHighAccuracyGeolocationError, this);

        if (options.watch) {
            this._highAccuracyLocationWatchId =
                navigator.geolocation.watchPosition(
                    onResponse, onError, options
                );
        } else {
            navigator.geolocation.getCurrentPosition(
                onResponse, onError, options
            );
        }
        return this;
    },

    stopHighAccuracyLocate: function () {
        if (navigator.geolocation) {
            navigator.geolocation.clearWatch(this._highAccuracyLocationWatchId);
        }
        return this;
    },

    _handleHighAccuracyGeolocationError: function (error) {
        var c = error.code,
            message = error.message ||
                    (c === 1 ? "permission denied" :
                    (c === 2 ? "position unavailable" : "timeout"));

        if (this._locationOptions.setView && !this._loaded) {
            this.fitWorld();
        }

        this.fire('highaccuracylocationerror', {
            code: c,
            message: "Geolocation error (high accuracy): " + message + "."
        });
    },

    _handleHighAccuracyGeolocationResponse: function (pos) {
        var latAccuracy = 180 * pos.coords.accuracy / 4e7,
            lngAccuracy = latAccuracy * 2,

            lat = pos.coords.latitude,
            lng = pos.coords.longitude,
            latlng = new L.LatLng(lat, lng),

            sw = new L.LatLng(lat - latAccuracy, lng - lngAccuracy),
            ne = new L.LatLng(lat + latAccuracy, lng + lngAccuracy),
            bounds = new L.LatLngBounds(sw, ne),

            options = this._locationOptions;

        if (options.setView) {
            var zoom = Math.min(this.getBoundsZoom(bounds), options.maxZoom);
            this.setView(latlng, zoom);
        }

        this.fire('highaccuracylocationfound', {
            latlng: latlng,
            bounds: bounds,
            accuracy: pos.coords.accuracy
        });
    }
});
