sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "checkout/model/models"
],
    function (UIComponent, Device, models) {
        "use strict";

        return UIComponent.extend("checkout.Component", {
            metadata: {
                manifest: "json"
            },

            init: function () {
                this.setModel(models.createDeviceModel(), "device");
                this.setModel(models.createGlobalModel(), "global");

                UIComponent.prototype.init.apply(this, arguments);

                this.getRouter().initialize();
            },

            getContentDensityClass: function () {
                if (this._sContentDensityClass === undefined) {
                    if (document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
                        this._sContentDensityClass = "";
                    } else if (!Device.support.touch) {
                        this._sContentDensityClass = "sapUiSizeCompact";
                    } else {
                        this._sContentDensityClass = "sapUiSizeCozy";
                    }
                }
                return this._sContentDensityClass;
            }
        });
    }
);