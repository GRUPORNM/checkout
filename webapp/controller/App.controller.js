sap.ui.define([
  "./BaseController",
  "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
  "use strict";

  return BaseController.extend("checkout.controller.App", {

    onInit: function () {
      var iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

      var oViewModel = new JSONModel({
        busy: false,
        delay: 0,
        load_order: ""
      });

      this.setModel(oViewModel, "appView");

      var fnSetAppNotBusy = function () {
        oViewModel.setProperty("/busy", false);
        oViewModel.setProperty("/delay", iOriginalBusyDelay);
      };

      this.getOwnerComponent().getModel().metadataLoaded().then(fnSetAppNotBusy);
      this.getOwnerComponent().getModel().attachMetadataFailed(fnSetAppNotBusy);

      this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
    }
  });
});