sap.ui.define([
    "./BaseController",
], function (BaseController) {
    "use strict";

    return BaseController.extend("checkout.controller.Start", {

        onInit: function () {
        },

        onAfterRendering: function () {
            this.onStartWebSocket();
        },
    });
});