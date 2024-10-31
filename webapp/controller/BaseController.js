sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], function (Controller, MessageBox) {
    "use strict";

    return Controller.extend("checkout.controller.BaseController", {
        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },

        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        showErrorMessage: function (oMessage) {
            new sap.m.MessageBox.error(oMessage.oText, {
                title: oMessage.oTitle,
                actions: [sap.m.MessageBox.Action.OK],
                emphasizedAction: sap.m.MessageBox.Action.OK
            });
        },

        onStartWebSocket: function () {
            var that = this,
                socket, webSocketURI,
                tokenUser = "TQA_CHECKOUT";

            webSocketURI = "wss://sapdev.grupornm.pt:44300" + '/sap/bc/apc/tqa/trace';
            // webSocketURI = "wss://sap.grupornm.pt:44300" + '/sap/bc/apc/tqa/trace';

            socket = new WebSocket(webSocketURI);
            socket.onerror = function (error) {
                console.error("WebSocket Error: ", error);
            };

            socket.onopen = function () {
                socket.send(JSON.stringify({ token: tokenUser, channel: "/checkout" }));
            };

            socket.onmessage = function (notification) {
                if (notification.data) {
                    if (!that.getModel("appView").getProperty("/load_order")) {
                        that.oNrOrdemCliente = notification.data;
                        that.getModel("appView").setProperty("/load_order", notification.data);
                        that.onGetData();
                    }
                }
            };
        },

        onGetData: function () {
            var oModel = this.getModel(),
                oAppViewModel = this.getModel("appView");

            try {
                oModel.read("/Shipments('" + this.oNrOrdemCliente + "')", {
                    success: function (oData) {
                        if (oData.VoltasNo) {
                            this.handleOutraVolta(oData.VoltasNo);
                        } else {
                            this.handlePrint(oData);
                        }
                    }.bind(this),
                    error: function (oError) {
                        var sError = JSON.parse(oError.responseText).error.message.value;

                        sap.m.MessageBox.alert(sError, {
                            icon: "ERROR",
                            onClose: null,
                            styleClass: '',
                            initialFocus: null,
                            textDirection: sap.ui.core.TextDirection.Inherit
                        });
                    }.bind(this),
                });

                oModel.attachRequestSent(function () {
                    oAppViewModel.setProperty("/busy", true);
                });
                oModel.attachRequestCompleted(function () {
                    oAppViewModel.setProperty("/busy", true);
                });
                oModel.attachRequestFailed(function () {
                    oAppViewModel.setProperty("/busy", false);
                });
            } catch (error) {
                var oMessage = {
                    oText: error.message,
                    oTitle: this.getResourceBundle().getText("errorMessageBoxTitle")
                }

                this.showErrorMessage(oMessage);
            }
        },

        onConfirmPrint: function (oType) {
            switch (oType) {
                case '1':
                    var oModel = this.getModel(),
                        oAppViewModel = this.getModel("appView"),
                        sPath = "/Confirms('" + this.oNrOrdemCliente + "')";

                    try {
                        var oEntry = {
                            ConfirmPrint: "Confirm"
                        };

                        oModel.update(sPath, oEntry, {
                            success: function (oData) {
                                window.location.href = "https://sap.grupornm.pt:44300/sap/bc/ui5_ui5/tqa/checkout/index.html?sap-client=100";
                            }.bind(this),
                            error: function (oError) {
                                var sError = JSON.parse(oError.responseText).error.message.value;

                                sap.m.MessageBox.alert(sError, {
                                    icon: "ERROR",
                                    onClose: null,
                                    styleClass: '',
                                    initialFocus: null,
                                    textDirection: sap.ui.core.TextDirection.Inherit
                                });
                            }.bind(this),
                        })

                        oModel.attachRequestSent(function () {
                            oAppViewModel.setProperty("/busy", true);
                        });
                        oModel.attachRequestCompleted(function () {
                            oAppViewModel.setProperty("/busy", false);
                        });
                        oModel.attachRequestFailed(function () {
                            oAppViewModel.setProperty("/busy", false);
                        });
                    } catch (error) {
                        var oMessage = {
                            oText: error.message,
                            oTitle: this.getResourceBundle().getText("errorMessageBoxTitle")
                        }

                        this.showErrorMessage(oMessage);
                    }
                    break;
                case '2':
                    new sap.m.MessageBox.error("Por favor entre em contacto com o Responsável de Turno através do Intercomunicador..!", {
                        title: "Erro",
                        actions: [sap.m.MessageBox.Action.OK],
                        emphasizedAction: sap.m.MessageBox.Action.OK,
                        onClose: function (oAction) {
                            if (oAction === sap.m.MessageBox.Action.OK) {
                                window.location.href = "https://sapdev.grupornm.pt:44300/sap/bc/ui5_ui5/tqa/checkout/index.html?sap-client=300";
                            }
                        }
                    });
                    break;
            }
        },

        onChangeComponentVisibility: function (oComponents) {
            oComponents.forEach(({ id, visible, text, title }) => {
                var component = this.byId(id);
                if (!component) return;
                if (visible !== undefined) component.setProperty("visible", visible);
                if (text !== undefined && component.setText) component.setText(text);
                if (title !== undefined && component.setTitle) component.setTitle(title);
            });
        },

        handlePrint: function (oData) {
            setTimeout(() => {
                this.getModel("appView").setProperty("/busy", false);
                this.onChangeComponentVisibility([
                    { id: "largeTitle", title: "A Imprimir..." },
                    { id: "progressIndicator", visible: true },
                    { id: "matriculaText", visible: true, text: "Matrícula: " + oData.Matricula }
                ]);

                let iProgress = 0;
                var iInterval = 1000,
                    iTotalTime = 12000,
                    iIncrement = 100 / (iTotalTime / iInterval);

                var oInterval = setInterval(() => {
                    iProgress += iIncrement;
                    this._updateProgressIndicator(iProgress);

                    if (iProgress >= 100) {
                        clearInterval(oInterval);
                        this._updateProgressIndicator(100);
                        this.onFinishPrint();
                    }
                }, iInterval);
            }, 5000);
        },

        handleOutraVolta: function (oVolta) {
            this.onChangeComponentVisibility([
                { id: "iconVolta", visible: true },
                { id: "largeTitle", title: "Tem de efetuar a volta: " + oVolta }
            ]);
            this.getModel("appView").setProperty("/busy", false);

            setTimeout(() => {
                this.onConfirmPrint("1");
            }, 5000);
        },

        onFinishPrint: function () {
            this.onChangeComponentVisibility([
                { id: "largeTitle", title: "Impressão Concluída" },
                { id: "matriculaText", visible: false },
                { id: "progressIndicator", visible: false },
                { id: "btConfirm", visible: true },
                { id: "btCancel", visible: true },
                { id: "printInfoLabel", visible: true }
            ]);
        },

        _updateProgressIndicator: function (iProgress) {
            var oProgressIndicator = this.byId("progressIndicator");
            oProgressIndicator.setPercentValue(iProgress);
            oProgressIndicator.setDisplayValue(Math.floor(iProgress) + "%");
        },
    });
});