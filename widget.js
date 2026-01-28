/* global Vue, L */

const MAP =  {
    vueApp: null,
    createVueApp: function() {
        return Vue.createApp({
            data() {
                return {
                    mapCaption: MAP.getTranslation("mapCaption"),
                    mapVocabulary: window.SKOSMOS.vocShortName
                }
            },
            template: `
                <div class="concept-widget panel-group" id="mapAccordion" role="tablist" aria-multiselectable="true">
                    <div class="panel panel-default">
                        <div class="panel-heading" role="tab" id="headingMap">
                            <button class="accordion-button accordion" type="button" data-bs-toggle="collapse" data-bs-target="#collapseMap" aria-expanded="true" aria-controls="collapseMap">
                                {{mapCaption}}
                                <span class="map-caption-vocabulary float-end versal">{{mapVocabulary}}</span>
                            </button>
                        </div>
                        <div id="collapseMap" class="panel-collapse collapse show" role="tabpanel" aria-labelledby="headingMap">
                            <div class="panel-body">
                                <div id="map" class="panel position-sticky" role="tabpanel" aria-labelledby="headingMapWidget"></div>
                            </div>
                        </div>
                    </div>
                </div>
                `
        })
    },
    coordinates: [],
    coordinatesStr: [],
    getTranslation: function (key) {
        var getLang = window.SKOSMOS.lang;
        if (getLang !== "fi" && getLang !== "sv") {
            getLang = "en";
        }
        if (key === "mapCaption") {
            var pref = MAP.preferred_label
            return {
                "fi": pref + " kartalla",
                "sv": pref + " på karta",
                "en": pref + " on map"
            }[getLang];
        }
        else {
            return "";
        }
    },
    initialize: function() {
        var mapObject = L.map("map").setView(MAP.coordinates, 10);

        mapObject.attributionControl.setPrefix('<a href="https://leafletjs.com" title="A JS library for interactive maps" target="_blank">Leaflet</a>')

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
        }).addTo(mapObject);

        L.marker(MAP.coordinates).addTo(mapObject)
            .bindPopup("<div class='map-popup-label'>" + MAP.preferred_label + "</div><div class='map-popup-coordinates'>(" + MAP.coordinatesStr.join(", ") + ")</div>")
            .openPopup();

        L.control.scale({imperial: false}).addTo(mapObject);

        MAP.mapObject = mapObject;
    },
    render: function (object) {
        const mountPoint = document.getElementById('map-plugin')
        if (mountPoint) {
            if (this.vueApp) {
                this.vueApp.unmount()
            }
        mountPoint.remove()
        }
        const newMountPoint = document.createElement('div')
        newMountPoint.id = 'map-plugin'
        document.getElementById('main-content-bottom-slot').appendChild(newMountPoint)

        this.vueApp = this.createVueApp()
        this.vueApp.mount('#map-plugin')

        MAP.initialize();
    },
};

document.addEventListener('DOMContentLoaded', function() {

    window.mapWidget = function (data) {
        // Only activate the widget when
        // 1) on a concept page
        // 2) and there is a prefLabel
        // 3) and the json-ld data can be found
        // 4) and the latitude and longitude are defined
        if (data.pageType !== 'concept' || data.prefLabels === undefined || Object.keys(data["jsonLd"]).length === 0) {
            return;
        }
        const skosmosUriSpace = window.SKOSMOS.uriSpace;
        const context = data["jsonLd"]["@context"];

        // Use the NS prefix defined in the json-ld object for the current namespace for the concept page
        const jsonLdUriSpace = Object.keys(context).find(key => context[key] === window.SKOSMOS.uriSpace);
        const jsonLdUri = data.uri.replace(skosmosUriSpace, jsonLdUriSpace + ":");

        const graph = data["jsonLd"]["graph"];
        const WGS84 = {
            "lat": "http://www.w3.org/2003/01/geo/wgs84_pos#lat",
            "long": "http://www.w3.org/2003/01/geo/wgs84_pos#long"
        };
        for (const concept of graph) {
            if (concept.uri === jsonLdUri) {
                if (concept[WGS84.lat] && concept[WGS84.long]) {
                    const latitudeStr = concept[WGS84.lat];
                    const longitudeStr = concept[WGS84.long];
                    MAP.coordinates = [parseFloat(latitudeStr), parseFloat(longitudeStr)];
                    MAP.coordinatesStr = [latitudeStr, longitudeStr];
                }
            }
        }
        if (MAP.coordinates.length === 0) {
            return;
        }

        // map variables
        MAP.mapObject = null;
        MAP.preferred_label = data.prefLabels[0]["label"];

        // render widget
        MAP.render();
    }

});
