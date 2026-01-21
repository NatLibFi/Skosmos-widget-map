const MAP =  {
    vueApp: null,
    createVueApp: function() {
        return Vue.createApp({
            data() {
                return {
                    mapCaption: MAP.getTranslation("mapCaption"),
                    mapVocabulary: SKOSMOS.vocShortName
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
        var getLang = SKOSMOS.lang;
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
        if (data.pageType !== 'concept' || data.prefLabels === undefined || Object.keys(data["jsonLd"]).length === 0) {
            return;
        }
        var wgs84_prefix = "http://www.w3.org/2003/01/geo/wgs84_pos#";
        var jsonld_uri = data.uri;
        Object.entries(data["jsonLd"]["@context"]).forEach(([key, value]) => {
            if (data.uri.startsWith(value)) {
                console.log(key + ": " +value);
                jsonld_uri = key + ":" + data.uri.substring(value.length);
            }
            if (value === wgs84_prefix) {
                wgs84_prefix = key + ":";
            }
        });
        var WGS84 = {
            "lat": wgs84_prefix + "lat",
            "long": wgs84_prefix + "long"
        };
        var correct_jsonld_objects = []; // only a single value is expected
        correct_jsonld_objects = data["jsonLd"].graph.filter(function (obj) {
            return obj.uri === jsonld_uri && obj[WGS84.lat] && obj[WGS84.long];
        });
        if (correct_jsonld_objects.length == 0) {
            return;
        }
        var jsonld_object = correct_jsonld_objects[0];
        var latitudeStr = jsonld_object[WGS84.lat];
        var longitudeStr = jsonld_object[WGS84.long];

        // map variables
        MAP.mapObject = null;
        MAP.coordinates = [parseFloat(latitudeStr), parseFloat(longitudeStr)];
        MAP.coordinatesStr = [latitudeStr, longitudeStr];
        MAP.preferred_label = data.prefLabels[0]["label"];

        // render widget
        MAP.render();
    }

});
