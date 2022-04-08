sap.ui.controller("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.MainCustom", {

	 /**
	 * TFS 2784 : Surcharge de la méthode standard pour afficher directement
	 * ---------  la liste des documents au démarage de l'application.
	 * 
	 * @param {} 
	 * @returns {void} 
	 * 
	 */
	 
	setAppMode: function() {
		
		/**
		 * @UtilityHook [Get Trusted Mode]
		 * The hook is called once when the app is started. If it returns "true", the app runs in trusted mode,
		 * which means that scanning a handling unit directly leads to posting that handling unit.
		 * @callback retail.store.receiveproduct.utils.ModeHandler~utilityExtHookGetTrustedMode
		 * @return {boolean} The indicator, if the app should run in trusted mode.
		 */
		 
		retail.store.receiveproduct.utils.ModeHandler.utilityExtHookGetTrustedMode = function() {
			return true;
		};
		
		retail.store.receiveproduct.utils.ModeHandler.setAppModeInitial(this);
		// sap.ui.getCore().applyTheme("sap_belize_plus"); 
	}

});