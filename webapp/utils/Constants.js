jQuery.sap.declare("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.utils.Constants"); // This line of code declares my extended Constants.js
jQuery.sap.require("retail.store.receiveproduct.utils.Constants"); // This line of code references the standard Constants.js

retail.store.receiveproduct.utils.Constants = {
	postingState: {
		notStarted: "0",
		inProgress: "2",
		error: "6",
		success: "8",
		empty: "" // TFS 4979 : A l'enregistrement d'un Roll côté détail s'il une erreur apparait les postes se grisent
	},

	processingState: {
		unprocessed: "0",
		notProcessable: "1",
		inProcess: "2",
		pending: "4",
		error: "6",
		partiallyPosted: "7",
		completed: "8",
		blocked: "9"
	},

	scannedIDType: {
		unknown: "0",
		handlingUnit: "1",
		GTIN: "2",
		delivery: "3",
		purchaseOrder: "4",
		trackingNumber: "5",
		product: "6"
	},

	documentType: {
		handlingUnit: "X",
		outboundDelivery: "J",
		inboundDelivery: "7",
		purchaseOrder: "V"
	},

	ProposedReceiveQuantity: {
		Zero: "0",
		Expected: "1"
	}
};

retail.store.receiveproduct.utils.Constants.Picard = {
	
	moveReasonFilter: {
		goodsReceipt:"ZSBO017A",
		additionalGoodsReceipt:"ZSBO017A_ROLLSUP",
		rollProcessing:"ZSBO017B",
		additionalRollProcessing:"ZSBO017B_ROLLSUP"
	},
	
	/* Les cdes de type ZSQL et ZIPV sont valorisées en UVC et non en unité Cartons */
	aDeliveryTypeWithNumberUnitException : [
		'ZIPV',
		'ZSQL'
	],
	
	documentItemObject: {
		AssignedPurchaseOrderID: "",
		BatchNumber: "",
		BatchNumberPostingMessage: "",
		BatchNumberPostingState: "",
		BestBeforeDate: null,
		BestBeforeDatePostingMessage: "",
		BestBeforeDatePostingState: "",
		BlockingReason: "",
		ColdRoomQuantity: "0",
		ColdRoomQuantityUnitCode: "",
		DeliveryQuantityUnitCode: "UVC",
		DeliveryQuantityUnitDenominator: "0",
		DeliveryQuantityUnitNumerator: "0",
		DocumentInternalID: "",
		DocumentItemInternalID: 0,
		ExpectedDeliveryDate: null,
		ExpectedQuantity: "0",
		ExpectedQuantityBase: "0",
		ExpectedQuantityUnitCode: "UVC",
		ExpectedQuantityUnitIsoCode: "UVC",
		ExpectedQuantityUnitIsoName: "",
		ExpectedQuantityUnitName: "",
		IsBlockedForReceiving: false,
		IsFinallyDelivered: true,
		LastProcessedTime: "",
		MoveReasonID: "0000",
		MoveReasonName: "",
		OpenQuantity: "0",
		OpenQuantityBase: "0",
		OpenQuantityUnitCode: "UVC",
		OpenQuantityUnitIsoCode: "UVC",
		OpenQuantityUnitIsoName: "",
		OpenQuantityUnitName: "",
		OrderQuantity: "0",
		OrderQuantityBase: "0",
		OrderQuantityUnitCode: "UVC",
		OrderQuantityUnitDenominator: "0",
		OrderQuantityUnitNumerator: "0",
		PostedQuantity: "0",
		PostedQuantityBase: "0",
		PostedQuantityUnitCode: "UVC",
		PostedQuantityUnitIsoCode: "UVC",
		PostedQuantityUnitIsoName: "",
		PostedQuantityUnitName: "",
		ProcessingState: retail.store.receiveproduct.utils.Constants.postingState.notStarted,
		Product: {},
		ProductID: "",
		QuantityBaseUnitCode: "UVC",
		ReceiveQuantity: "0",
		ReceiveQuantityBase: "0",
		ReceiveQuantityGTIN: "",
		ReceiveQuantityIsChanged: false,
		ReceiveQuantityPostingMessage: "",
		ReceiveQuantityPostingState: "0",
		ReceiveQuantityUnitCode: "UVC",
		ReceiveQuantityUnitIsoCode: "UVC",
		ReceiveQuantityUnitIsoName: "",
		ReceiveQuantityUnitName: "",
		ReceivingIsFinished: false,
		ReturnQuantity: "0",
		ReturnQuantityBase: "0",
		ReturnQuantityIsChanged: false,
		ReturnQuantityPostingMessage: "",
		ReturnQuantityPostingState: "",
		StoreID: ""
	}
};