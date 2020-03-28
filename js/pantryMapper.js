class PantryMapper {
    constructor(apiEndpoint, map) {
        this.apiEndpoint = apiEndpoint;
        this.map = map;
        this.refreshInterval = null;
        this.intervalDelay = 60000; //Refresh data every x ms
        this.data = [];
        this.filteredData = [];
        this._getData = this._getData.bind(this);
        this.setCategoryFilter = this.setCategoryFilter.bind(this);
        
        this.categoryFilter = "";
        this.townFilter = "";
        this.countyFilter = "";
    }

    _getData(successCallback) {
        $.get(this.apiEndpoint).done((response, status) => {
            const markerInfoData = JSON.parse(response);
            for (let markerInfo of markerInfoData) {
                if (markerInfo.Category == "Meal Sites")
                    markerInfo.Icon = "fastfood";
                else if (markerInfo.Category == "Food Pantry")
                    markerInfo.Icon = "store";
                else if (markerInfo.Category == "Shelter")
                    markerInfo.Icon = "home";
                else 
                    markerInfo.Icon = "category";
            }      

            this.data = markerInfoData;
            this._applyFilters();
            successCallback();
        });
    }

    _refreshMapAndSideBar() {
        this.map.layerGroup.clearLayers();
        this.map.markers = {};
        this._buildMapMarkers(this.filteredData);
        this._buildSidebarListing(this.filteredData);
    }

    _setFilter(filter, prop) {
        if (filter !== null && filter !== undefined && filter.length > 0) {
            this[prop] = filter;
        } else {
            this[prop] = "";
        }
        
        this._applyFilters();
    }

    setCategoryFilter(filter) {
        this._setFilter(filter, "categoryFilter");
    }

    setCountyFilter(filter) {
        this._setFilter(filter, "countyFilter");
    }

    setTownFilter(filter) {
        this._setFilter(filter, "townFilter");
    }
    
    _applyFilters() {
        this.filteredData = this.data.filter(d => d.Category.indexOf(this.categoryFilter) >= 0 && d.Town.indexOf(this.townFilter) >= 0 && d.County.indexOf(this.countyFilter) >= 0);
        this._refreshMapAndSideBar();
    }

    _buildMapMarkers(pantryInfoArray) {
        for (let entry of pantryInfoArray) {
            if (entry.Latitude && entry.Longitude) {
                if (this.map.markers[entry.Address]) {
                    this.map.markers[entry.Address].bindPopup(this._getMarkerPopupHtml(entry));
                } else {
                    let marker = L.marker([entry.Latitude, entry.Longitude], {}).addTo(this.map.layerGroup);
                    marker.bindPopup(this._getMarkerPopupHtml(entry));
                    this.map.markers[entry.Address] = marker;
                }
                //TODO: Remove any markers whose IDs not present.
            }
        }
    }

    _buildSidebarListing(pantryInfoArray) {
        let target = document.getElementById('map-results-list');
        let src = document.getElementById('pin-list-template').innerHTML;
        let template = Handlebars.compile(src);
        target.innerHTML = template(pantryInfoArray);
    }
    
    _getMarkerPopupHtml(pantryInfo) {
        return `<span style="font-size:1.1rem">${pantryInfo.Name}</span><br>
        <hr style="margin-top: 0; margin-bottom: 4px;">
        <small><b>Phone: </b>${pantryInfo.Phone}}</small><br>
        <small><b>Website: </b><a href='${pantryInfo.Category}' target='_blank'>${pantryInfo.WebLink}</a></small><br>
        <small><b>Address: </b>${pantryInfo.Address}</small><br>
        <small><b>Hours: </b>${pantryInfo.HoursOfOperation}</small>`;
    }
    
    start(loadCallback) {
        this._getData(loadCallback);
        this.refreshInterval = setInterval(() => this._getData(loadCallback), this.intervalDelay); 
    }

    stop() {
        if (this.refreshInterval !== null)
            clearInterval(this.refreshInterval);
    }
}
