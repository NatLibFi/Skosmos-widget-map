// declaring a namespace for the plugin
var MAP = MAP || {};

MAP = {
    coordinates: [],
    coordinatesStr: [],
    getTranslation: function (key) {
        var getLang = lang;
        if (lang !== "fi" && lang !== "sv") {
            getLang = "en";
        }
        if (key === "mapCaption") {
            var pref = MAP.preferred_label + $("#pref-label + .prefLabelLang").text();
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
    mapObject: null,
    preferred_label: "",
    widget: {
        addAccordionToggleEvents: function() {
            $('#headingMap > a > .glyphicon, #headingMap > a.versal').on('click', function() {
                MAP.widget.toggleAccordion();
            });
        },
        // Flips the icon displayed on the top right corner of the widget header
        flipChevron: function() {
            var $glyph = $('#headingMap > a > .glyphicon');
            if ($glyph.hasClass('glyphicon-chevron-down')) {
                $glyph.removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
                createCookie('MAP_WIDGET_OPEN', 1);
            } else {
                $glyph.removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
                createCookie('MAP_WIDGET_OPEN', 0);
            }
        },
        render: function (object) {
            var openCookie = readCookie('MAP_WIDGET_OPEN');
            var isOpen = openCookie !== null ? parseInt(openCookie, 10) : 1;
            var context = {
                opened: Boolean(isOpen),
                mapCaption: MAP.getTranslation("mapCaption"),
                mapVocabulary: vocShortName
            };
            $('.concept-info').after(Handlebars.compile($('#map-template').html())(context));

            this.addAccordionToggleEvents();

            if (isOpen) {
                MAP.initialize();
            }
        },
        // Handles the collapsing and expanding actions of the widget.
        toggleAccordion: function() {
            $('#collapseMap').collapse('toggle');
            // switching the glyphicon to indicate a change in the accordion state
            MAP.widget.flipChevron();
            // if the widget has not been opened yet (lazy loading)
            if (MAP.mapObject === null) {
                MAP.initialize();
            }
        },
    }
};

$(function() {

    window.mapWidget = function (data) {
        // Only activate the widget when
        // 1) on a concept page
        // 2) and there is a prefLabel
        // 3) and the json-ld data can be found
        // 4) and the latitude and longitude are defined
        if (data.page !== 'page' || data.prefLabels === undefined || $.isEmptyObject(data["json-ld"])) {
            return;
        }
        var wgs84_prefix = "http://www.w3.org/2003/01/geo/wgs84_pos#";
        var jsonld_uri = data.uri;

        $.each(data["json-ld"]["@context"], function (key, value) {
            if (data.uri.startsWith(value)) {
                jsonld_uri = key + ":" + data.uri.substr(value.length);
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

        correct_jsonld_objects = $.grep(data["json-ld"].graph, function (obj) {
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
        MAP.preferred_label = $("span.prefLabel.conceptlabel")[0].innerHTML;

        // render widget
        MAP.widget.render();
    }

});
