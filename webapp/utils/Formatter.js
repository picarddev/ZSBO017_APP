jQuery.sap.declare("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.utils.Formatter"); // This line of code declares my extended DataManager.js
jQuery.sap.require("retail.store.receiveproduct.utils.Formatter"); // This line of code references the standard DataManager.js

retail.store.receiveproduct.utils.Formatter.formatObjAttrDescriptionText = function (sDocumentType, sHUType, sHUContent, sDelType, sPOType,
	sAssignedPOs) {
	var sText = "";
	if (sDocumentType === retail.store.receiveproduct.utils.Constants.documentType.handlingUnit) {
		// Handling Unit
		if (sHUContent) {
			sText = sHUType + ": " + sHUContent;
		} else {
			sText = sDelType;
		}
	} else if (sDocumentType === retail.store.receiveproduct.utils.Constants.documentType.outboundDelivery ||
		sDocumentType === retail.store.receiveproduct.utils.Constants.documentType.inboundDelivery) {
		// Delivery
		sText = sAssignedPOs;
	} else if (sDocumentType === retail.store.receiveproduct.utils.Constants.documentType.purchaseOrder) {
		// Purchase Order
		sText = sPOType;
	}
	return sText;
};

retail.store.receiveproduct.utils.Formatter.formatValueState = function (sPostingState) {
	var sValueState = sap.ui.core.ValueState.None;
	if (sPostingState === retail.store.receiveproduct.utils.Constants.postingState.error) {
		sValueState = sap.ui.core.ValueState.Error;
	}
	return sValueState;
};

retail.store.receiveproduct.utils.Formatter.formatBestBeforeDateInputValueState = function (sPostingState) {
	var sValueState = sap.ui.core.ValueState.None;
	if (sPostingState === retail.store.receiveproduct.utils.Constants.postingState.error) {
		sValueState = sap.ui.core.ValueState.Error;
	}
	return sValueState;
};

retail.store.receiveproduct.utils.Formatter.formatBestBeforeDate = function (sBestBeforeDate) {
	var sDateFormatted = "";
	if (sBestBeforeDate) {
		// Get instance of date format class with given style
		var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
			style: "medium"
		});

		// Format the date according to user settings
		sDateFormatted = oDateFormat.format(sBestBeforeDate);
	}
	return sDateFormatted;
};

retail.store.receiveproduct.utils.Formatter.isValidBestBeforeDate = function (sBestBeforeDate) {
	return true;
};

retail.store.receiveproduct.utils.Formatter.isValidBatchNumber = function (sBatchNumber) {
	return true;
};

// TFS 4980 : Interdire les saisies négatives dans la quantité de retour suite à motif de refus
retail.store.receiveproduct.utils.Formatter.isValidReceiveQuantity = function (sInput) {
	var oFloatFormat = retail.store.receiveproduct.utils.Formatter.getQuantityInputFormat();
	var fNumber = oFloatFormat.parse(sInput);
	var fReparsedNumber = oFloatFormat.parse(oFloatFormat.format(fNumber));
	return fNumber === fReparsedNumber && fNumber >= 0;
};

retail.store.receiveproduct.utils.Formatter.isValidReceiveQuantityWithBaseUnit = function (sInput, sNumberOfLowerLevelUoM) {
	var bIsValidReceiveQuantityWithBaseUnit = true;
	var fNumerator, fDenominator;

	if (sInput && sInput !== "0" && sNumberOfLowerLevelUoM && sNumberOfLowerLevelUoM > 1) {
		fNumerator = Math.max(sInput, sNumberOfLowerLevelUoM);
		fDenominator = Math.min(sInput, sNumberOfLowerLevelUoM);
		bIsValidReceiveQuantityWithBaseUnit = (fNumerator % fDenominator) === 0;
	}

	return bIsValidReceiveQuantityWithBaseUnit;
};

//XPO Le 29.08.2018 - TFS 4391 : Evolutions liées à la mise en place de la tuile « Réassort » 
retail.store.receiveproduct.utils.Formatter.formatStockRoomQuantityValueState = function (fStockRoomQuantity) {
	var sValueState = "None";

	if (fStockRoomQuantity !== undefined && fStockRoomQuantity !== null) {
		if (Number(fStockRoomQuantity) > 0) {
			sValueState = "Success";
		}
	}

	return sValueState;
};

//XPO Le 29.08.2018 - TFS 4391 : Evolutions liées à la mise en place de la tuile « Réassort » 
retail.store.receiveproduct.utils.Formatter.formatStockRoomQuantityWithUnit = function (fStockRoomQuantity) {
	var sFormattedQty = "";
	if (fStockRoomQuantity > 1) {
		sFormattedQty = [sap.retail.store.lib.reuse.util.Formatter.formatQuantityMaxOneDigit(fStockRoomQuantity),
			sap.retail.store.lib.reuse.util.TextUtil.getText("LIST_BOX_UNITS")
		].join(" ");
	} else {
		sFormattedQty = [sap.retail.store.lib.reuse.util.Formatter.formatQuantityMaxOneDigit(fStockRoomQuantity),
			sap.retail.store.lib.reuse.util.TextUtil.getText("LIST_BOX_UNIT")
		].join(" ");
	}
	return sFormattedQty;
};

//XPO Le 29.08.2018 - TFS 4391 : Evolutions liées à la mise en place de la tuile « Réassort » 
retail.store.receiveproduct.utils.Formatter.formatStockRoomTextQuantityUnit = function (fQuantity) {
	var sUnit = "";
	if (fQuantity > 1) {
		sUnit = sap.retail.store.lib.reuse.util.TextUtil.getText("LIST_BOX_UNITS");
	} else {
		sUnit = sap.retail.store.lib.reuse.util.TextUtil.getText("LIST_BOX_UNIT");
	}
	return sUnit;
};

retail.store.receiveproduct.utils.Formatter.formatReceiveInputEnabled = function (bDetailedReceiving, sDocProcessingState, bItemFinished,
	sPostingState, bItemBlocked, sTableMode) {
	var bEnabled = false;
	if (bDetailedReceiving && !bItemFinished && !bItemBlocked &&
		sDocProcessingState !== retail.store.receiveproduct.utils.Constants.processingState.notProcessable &&
		sDocProcessingState !== retail.store.receiveproduct.utils.Constants.processingState.pending &&
		sDocProcessingState !== retail.store.receiveproduct.utils.Constants.processingState.completed &&
		//sPostingState !== retail.store.receiveproduct.utils.Constants.postingState.success &&
		sPostingState !== retail.store.receiveproduct.utils.Constants.postingState.inProgress &&
		sTableMode !== sap.m.ListMode.MultiSelect) {
		// If everything is fine, the input field is editable
		bEnabled = true;
	}
	return bEnabled;
};

retail.store.receiveproduct.utils.Formatter.formatCountedSwitchEnabled = function (sDocProcessingState, sPostingState, bBlocked, sTableMode) {
	var bEnabled = true;
	if (sPostingState === retail.store.receiveproduct.utils.Constants.postingState.inProgress || bBlocked || sTableMode === sap.m.ListMode.MultiSelect ||
		sDocProcessingState === retail.store.receiveproduct.utils.Constants.processingState.notProcessable ||
		sDocProcessingState === retail.store.receiveproduct.utils.Constants.processingState.pending ||
		sDocProcessingState === retail.store.receiveproduct.utils.Constants.processingState.completed) {
		// In this case the switch is disabled
		bEnabled = false;
	}
	return bEnabled;
};

retail.store.receiveproduct.utils.Formatter.formatOpenQuantity = function (sExpectedQuantity, sPostedQuantity, sReceiveQuantity) {

	/* 
		Si l'état du document est terminé les quantités reçues passent à 0. On calcule les  
		litiges à partir de la quantité enregistrée (posted quantity) ou la quantité reçue.
	*/

	if (sReceiveQuantity !== undefined && sReceiveQuantity !== null) {
		var sOpenQuantity = Math.max(Number(sPostedQuantity), Number(sReceiveQuantity)) - Number(sExpectedQuantity);
		return retail.store.receiveproduct.utils.Formatter.formatReceiveQuantity(sOpenQuantity);
	}

	return "0";
};

retail.store.receiveproduct.utils.Formatter.formatOpenQuantityState = function (sExpectedQuantity, sPostedQuantity, sReceiveQuantity) {

	/* 
		Si l'état du document est terminé les quantités reçues passent à 0. On calcule les  
		litiges à partir de la quantité enregistrée (posted quantity) ou la quantité reçue.
	*/

	if (sReceiveQuantity !== undefined && sReceiveQuantity !== null) {
		var sOpenQuantity = Math.max(Number(sPostedQuantity), Number(sReceiveQuantity)) - Number(sExpectedQuantity);
		return sOpenQuantity !== 0 ? "Error" : "None";
	}

	return "None";
};

retail.store.receiveproduct.utils.Formatter.formatOpenQuantityWithUnit = function (sExpectedQuantity, sPostedQuantity, sReceiveQuantity,
	sUnit) {
	return retail.store.receiveproduct.utils.Formatter.formatOpenQuantity(sExpectedQuantity, sPostedQuantity, sReceiveQuantity) + " " + sUnit;
};

retail.store.receiveproduct.utils.Formatter.formatReturnQantityWithMoveReasonText = function (sMoveReasonText, sReturnQuantity,
	ReceiveQuantityUnitCode) {
	if (!sMoveReasonText) {
		return null;
	}
	return sap.retail.store.lib.reuse.util.TextUtil.getText("PRODUCTS_RETURN_QTY_WITH_MOVE_REASON", [sReturnQuantity, ReceiveQuantityUnitCode,
		sMoveReasonText
	]);
};

retail.store.receiveproduct.utils.Formatter.formatProductIDWithQuantityUnitCode = function (sProductID, sDeliveryQuantityUnitCode,
	sDeliveryQuantityUnitNumerator, bIsOnPromotion, sSalesStatusName) {
	var sFormattedUnitCode = null;
	var bEncodedUnitCode = RegExp("CX", "i").test(sDeliveryQuantityUnitCode);

	if (bEncodedUnitCode && sDeliveryQuantityUnitNumerator) { 
		sFormattedUnitCode = sDeliveryQuantityUnitNumerator.length === 1 ? "0" + sDeliveryQuantityUnitNumerator : sDeliveryQuantityUnitNumerator;
		sFormattedUnitCode = "C".concat(sFormattedUnitCode);
	} else {
		sFormattedUnitCode = sDeliveryQuantityUnitCode;
	}

	if (bIsOnPromotion) {
		return [sProductID, sFormattedUnitCode, sSalesStatusName].join(" | ");
	}

	return [sProductID, sFormattedUnitCode].join(" | ");
};

retail.store.receiveproduct.utils.Formatter.formatPostButtonEnabled = function (sDocProcessingState, bItemBlocked) {
	var bEnabled = false;
	if (!bItemBlocked &&
		sDocProcessingState !== retail.store.receiveproduct.utils.Constants.processingState.notProcessable &&
		sDocProcessingState !== retail.store.receiveproduct.utils.Constants.processingState.pending &&
		sDocProcessingState !== retail.store.receiveproduct.utils.Constants.processingState.completed) {
		bEnabled = true;
	}
	return bEnabled;
};

retail.store.receiveproduct.utils.Formatter.formatThumbnailImageUrl = function (sImageUrl, sStoreID, sProductID) {

	if (sImageUrl) {
		return sImageUrl;
	} else if (sStoreID && sProductID && retail.store.receiveproduct.utils.Formatter._sServiceUrl) { // Test du paramètre sProductID pour empêcher le BMG 140 dans /IWFND/ERROR_LOG si undefined
		sImageUrl = retail.store.receiveproduct.utils.Formatter._sServiceUrl + "Products(StoreID='" + sStoreID + "',ProductID='" + sProductID +
			"')/Thumbnail/$value";
		return sImageUrl;
	}
};

retail.store.receiveproduct.utils.Formatter.formatLargeImageUrl = function (sImageUrl, sStoreID, sProductID) {

	if (sImageUrl) {
		return sImageUrl;
	} else if (sStoreID && sProductID && retail.store.receiveproduct.utils.Formatter._sServiceUrl) { // Test du paramètre sProductID pour empêcher le BMG 140 dans /IWFND/ERROR_LOG si undefined
		sImageUrl = retail.store.receiveproduct.utils.Formatter._sServiceUrl + "Products(StoreID='" + sStoreID + "',ProductID='" + sProductID +
			"')/$value";
		return sImageUrl;
	}
};

/**
 * Transform sTagID parameter to an hexadecimal color
 * @public
 * @param {string} sTagID primary key from TagColor business entity
 * @returns {string} hexadecimal color value
 */
retail.store.receiveproduct.utils.Formatter.formatTagColorToHexColorValue = function(sTagID) {
	if (!sTagID) {
		return "Transparent";
	}
	return ["#", sTagID].join("");
};

retail.store.receiveproduct.utils.Formatter.formatStatusState = function (sProcessingState) {
	var sState = sap.ui.core.ValueState.None;
	switch (sProcessingState) {
	case retail.store.receiveproduct.utils.Constants.processingState.unprocessed:
		sState = sap.ui.core.ValueState.None;
		break;
	case retail.store.receiveproduct.utils.Constants.processingState.notProcessable:
		sState = sap.ui.core.ValueState.None;
		break;
	case retail.store.receiveproduct.utils.Constants.processingState.inProcess:
		sState = sap.ui.core.ValueState.Warning;
		break;
	case retail.store.receiveproduct.utils.Constants.processingState.pending:
		sState = sap.ui.core.ValueState.Warning;
		break;
	case retail.store.receiveproduct.utils.Constants.processingState.error:
		sState = sap.ui.core.ValueState.Error;
		break;
	case retail.store.receiveproduct.utils.Constants.processingState.partiallyPosted:
		sState = sap.ui.core.ValueState.None;
		break;
	case retail.store.receiveproduct.utils.Constants.processingState.completed:
		sState = sap.ui.core.ValueState.Success;
		break;
	}
	return sState;
};