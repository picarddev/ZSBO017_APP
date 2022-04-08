sap.ui.define([
	"sap/ui/test/Opa5",
	"retail/store/receiveproduct/Z_SBO017B_RECV_PROD/test/integration/pages/Common",
	"sap/ui/test/matchers/AggregationLengthEquals",
	"sap/ui/test/matchers/AggregationFilled",
	"sap/ui/test/matchers/PropertyStrictEquals"
], function(Opa5, Common, AggregationLengthEquals, AggregationFilled, PropertyStrictEquals) {
	"use strict";

	var sViewName = "DocumentList",
		sSomethingThatCannotBeFound = "*#-Q@@||",
		iGroupingBoundary = 100;

	function enterSomethingInASearchField(oSearchField, oSearchParams) {
		oSearchParams = oSearchParams || {};

		if (oSearchParams.searchValue) {
			oSearchField.setValue(oSearchParams.searchValue);
		}

		if (oSearchParams.skipEvent) {
			return;
		}

		var oEvent = jQuery.Event("touchend");
		oEvent.originalEvent = {
			query: oSearchParams.searchValue,
			refreshButtonPressed: oSearchParams.refreshButtonPressed,
			id: oSearchField.getId()
		};
		oEvent.target = oSearchField;
		oEvent.srcElement = oSearchField;
		jQuery.extend(oEvent, oEvent.originalEvent);

		oSearchField.fireSearch(oEvent);
	}

	Opa5.createPageObjects({
		onTheMasterPage: {
			baseClass: Common,

			actions: {

				iWaitUntilTheListIsLoaded: function() {
					return this.waitFor({
						id: "receiveProductsListDocuments",
						viewName: sViewName,
						matchers: new AggregationLengthEquals({
							name: "items",
							length: 8
						}),
						errorMessage: "The master list has not been loaded"
					});
				},

				iWaitUntilTheFirstItemIsSelected: function() {
					return this.waitFor({
						id: "receiveProductsListDocuments",
						viewName: sViewName,
						matchers: function(oList) {
							// wait until the list has a selected item
							var oSelectedItem = oList.getSelectedItem();
							return oSelectedItem && oList.getItems().indexOf(oSelectedItem) === 0;
						},
						errorMessage: "The first item of the master list is not selected"
					});
				},

				iWaitUntilTheStoreListIsLoaded: function() {
					return this.waitFor({
						controlType: "sap.m.SelectDialog",
						viewName: sViewName,
						matchers: new AggregationFilled({
							name: "items"
						}),
						errorMessage: "The store list has not been loaded"
					});
				},

				iSortTheListOnName: function() {
					return this.iPressItemInSelectInFooter("sort-select", "masterSort1");
				},

				iSortTheListOnUnitNumber: function() {
					return this.iPressItemInSelectInFooter("sort-select", "masterSort2");
				},

				iRemoveFilterFromTheList: function() {
					return this.iPressItemInSelectInFooter("filter-select", "masterFilterNone");
				},

				iFilterTheListLessThan100UoM: function() {
					return this.iPressItemInSelectInFooter("filter-select", "masterFilter1");
				},

				iFilterTheListMoreThan100UoM: function() {
					return this.iPressItemInSelectInFooter("filter-select", "masterFilter2");
				},

				iGroupTheList: function() {
					return this.iPressItemInSelectInFooter("group-select", "masterGroup1");
				},

				iRemoveListGrouping: function() {
					return this.iPressItemInSelectInFooter("group-select", "masterGroupNone");
				},

				iOpenViewSettingsDialog: function() {
					return this.waitFor({
						id: "filter-button",
						viewName: sViewName,
						check: function() {
							var oViewSettingsDialog = Opa5.getWindow().sap.ui.getCore().byId("viewSettingsDialog");
							// check if the dialog is still open - wait until it is closed
							// view settings dialog has no is open function and no open close events so checking the domref is the only option here
							// if there is no view settings dialog yet, there is no need to wait
							return !oViewSettingsDialog || oViewSettingsDialog.$().length === 0;
						},
						success: function(oButton) {
							oButton.$().trigger("tap");
						},
						errorMessage: "Did not find the 'filter' button."
					});
				},

				iSelectListItemInViewSettingsDialog: function(sListItemTitle) {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.StandardListItem",
						matchers: new Opa5.matchers.PropertyStrictEquals({
							name: "title",
							value: sListItemTitle
						}),
						success: function(aListItems) {
							aListItems[0].$().trigger("tap");
						},
						errorMessage: "Did not find list item with title " + sListItemTitle + " in View Settings Dialog."
					});
				},

				iPressOKInViewSelectionDialog: function() {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Button",
						matchers: new Opa5.matchers.PropertyStrictEquals({
							name: "text",
							value: "OK"
						}),
						success: function(aButtons) {
							aButtons[0].$().trigger("tap");
						},
						errorMessage: "Did not find the ViewSettingDialog's 'OK' button."
					});
				},

				iPressEnterDocumentSearchButtonInFooter: function() {
					return this.waitFor({
						// searchOpenDialogs: true,
						controlType: "sap.m.Button",
						matchers: new Opa5.matchers.PropertyStrictEquals({
							name: "text",
							value: "Saisir ID"
						}),
						success: function(aButtons) {
							aButtons[0].$().trigger("tap");
						},
						errorMessage: "Did not find the ViewSettingDialog's 'OK' button."
					});
				},

				iPressSaveDocumentsButtonInFooter: function() {
					return this.waitFor({
						controlType: "sap.m.Button",
						matchers: new sap.ui.test.matchers.Properties({
							id: new RegExp("receiveProductsButtonPost", "i")
						}),
						success: function(oButton) {
							oButton[0].$().trigger("tap");
						},
						errorMessage: "Did not find the Save button."
					});
				},

				iPressMoveReasonButtonInFooter: function() {
					return this.waitFor({
						controlType: "sap.m.Button",
						matchers: new sap.ui.test.matchers.Properties({
							id: new RegExp("receiveProductsMoveReasonButton", "i")
						}),
						success: function(oButton) {
							oButton[0].$().trigger("tap");
						},
						errorMessage: "Did not find the MoveReason button."
					});
				},

				iPressOnTheMoveReasonObjectAtPosition: function() {
					return this.waitFor({
						id: "receiveProductsListMoveReason",
						success: function(oSelect) {
							var aItems = oSelect.getItems();
							aItems[4].$().trigger("tap");
						},
						errorMessage: "Did not find the edit button on header"
					});
				},

				iPressResetInViewSelectionDialog: function() {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Button",
						matchers: new Opa5.matchers.PropertyStrictEquals({
							name: "icon",
							value: "sap-icon://refresh"
						}),
						success: function(aButtons) {
							aButtons[0].$().trigger("tap");
						},
						errorMessage: "Did not find the ViewSettingDialog's 'Reset' button."
					});
				},

				iPressOnEditModeButtonInHeader: function(sSelect, sItem) {
					return this.waitFor({
						id: "receiveProductsButtonEdit",
						viewName: sViewName,
						matchers: new sap.ui.test.matchers.PropertyStrictEquals({
							name: "icon",
							value: "sap-icon://multi-select"
						}),
						success: function(oButton) {
							oButton.$().trigger("tap");
						},
						errorMessage: "Did not find the edit button on header"
					});
				},

				iPressItemInSelectInFooter: function(sSelect, sItem) {
					return this.waitFor({
						id: sSelect,
						viewName: sViewName,
						success: function(oSelect) {
							oSelect.open();
							this.waitFor({
								id: sItem,
								viewName: sViewName,
								success: function(oElem) {
									oElem.$().trigger("tap");
								},
								errorMessage: "Did not find the " + sItem + " element in select"
							});
						}.bind(this),
						errorMessage: "Did not find the " + sSelect + " select"
					});
				},

				iRememberTheSelectedItem: function() {
					return this.waitFor({
						id: "list",
						viewName: sViewName,
						matchers: function(oList) {
							return oList.getSelectedItem();
						},
						success: function(oListItem) {
							this.getContext().currentListItem = oListItem;
						},
						errorMessage: "The list does not have a selected item so nothing can be remembered"
					});
				},

				iRememberTheIdOfListItemAtPosition: function(iPosition) {
					return this.waitFor({
						id: "list",
						viewName: sViewName,
						matchers: function(oList) {
							return oList.getItems()[iPosition];
						},
						success: function(oListItem) {
							this.getContext().currentListItem = oListItem;
						},
						errorMessage: "The list does not have an item at the index " + iPosition
					});
				},

				iRememberAnIdOfAnObjectThatsNotInTheList: function() {
					return this.waitFor(this.createAWaitForAnEntitySet({
						entitySet: "CarrierSet",
						success: function(aEntityData) {
							this.waitFor({
								id: "list",
								viewName: sViewName,
								matchers: new AggregationFilled({
									name: "items"
								}),
								success: function(oList) {
									var aItemsNotInTheList = aEntityData.filter(function(oObject) {
										return !oList.getItems().some(function(oListItem) {
											return oListItem.getBindingContext().getProperty("Carrid") === oObject.Carrid;
										});
									});

									if (!aItemsNotInTheList.length) {
										QUnit.ok(false, "Did not find a list item that is not in the list");
									}

									this.getContext().currentId = aItemsNotInTheList[0].Carrid;
								},
								errorMessage: "the model does not have a item that is not in the list"
							});
						}
					}));
				},

				iPressOnTheObjectAtPosition: function(iPositon) {
					return this.waitFor({
						id: "receiveProductsListDocuments",
						viewName: sViewName,
						matchers: function(oList) {
							return oList.getItems()[iPositon];
						},
						success: function(oListItem) {
							oListItem.$().trigger("tap");
						},
						errorMessage: "List 'list' in view '" + sViewName + "' does not contain an ObjectListItem at position '" + iPositon + "'"
					});
				},

				iPressOnTheStoreAtPosition: function(iPositon) {
					return this.waitFor({
						controlType: "sap.m.SelectDialog",
						viewName: sViewName,
						matchers: function(oList) {
							return oList.getItems()[iPositon];
						},
						success: function(oListItem) {
							oListItem[0].$().trigger("tap");
						},
						errorMessage: "List 'list' in view '" + sViewName + "' does not contain an ObjectListItem at position '" + iPositon + "'"
					});
				},

				iSearchForTheFirstObject: function() {
					var sFirstObjectTitle;

					this.waitFor({
						id: "list",
						viewName: sViewName,
						matchers: new AggregationFilled({
							name: "items"
						}),
						success: function(oList) {
							sFirstObjectTitle = oList.getItems()[0].getTitle();
						},
						errorMessage: "Did not find list items while trying to search for the first item."
					});

					return this.waitFor({
						id: "searchField",
						viewName: sViewName,
						success: function(oSearchField) {
							enterSomethingInASearchField(oSearchField, {
								searchValue: sFirstObjectTitle
							});
						},
						errorMessage: "Failed to find search field in Master view.'"
					});
				},

				// iSearchForTheSecondDocument: function() {
				// 	return this.waitFor({
				// 		id: "searchField",
				// 		viewName: sViewName,
				// 		success: function(oSearchField) {
				// 			enterSomethingInASearchField(oSearchField, {
				// 				searchValue: sFirstObjectTitle
				// 			});
				// 		},
				// 		errorMessage: "Failed to find search field in Master view.'"
				// 	});
				// },

				iTypeSomethingInTheSearchThatCannotBeFound: function() {
					return this.iSearchForValue({
						searchValue: sSomethingThatCannotBeFound,
						skipEvent: true
					});
				},

				iSearchForValue: function(oSearchParams) {
					return this.waitFor({
						id: "searchField",
						viewName: sViewName,
						success: function(oSearchField) {
							enterSomethingInASearchField(oSearchField, oSearchParams);
						},
						errorMessage: "Failed to find search field in Master view.'"
					});
				},

				iClearTheSearch: function() {
					return this.iSearchForValue({
						searchValue: ""
					});
				},

				iSearchForSomethingWithNoResults: function() {
					return this.iSearchForValue({
						searchValue: sSomethingThatCannotBeFound
					});
				},

				iTriggerRefresh: function() {
					return this.iSearchForValue({
						refreshButtonPressed: true
					});
				}

			},

			assertions: {

				iShouldSeeTheBusyIndicator: function() {
					return this.waitFor({
						id: "list",
						viewName: sViewName,
						success: function(oList) {
							// we set the list busy, so we need to query the parent of the app
							QUnit.ok(oList.getBusy(), "The master list is busy");
						},
						errorMessage: "The master list is not busy."
					});
				},

				iShouldSeeStoreListDialog: function() {
					return this.waitFor({
						controlType: "sap.m.SelectDialog",
						viewName: sViewName,
						matchers: new sap.ui.test.matchers.AggregationFilled({
							name: "items"
						}),
						success: function(oStoreListDialog) {
							this.getContext().StoreListDialog = oStoreListDialog;
							QUnit.ok(oStoreListDialog, "Found the store list dialog");
						},
						errorMessage: "Can't see the store list dialog."
					});
				},

				iShouldSeeSaveConfirmDialog: function() {
					return this.waitFor({
						controlType: "sap.m.Input",
						matchers: new sap.ui.test.matchers.Properties({
							id: new RegExp("receiveProductsUserIdentifierInput", "i")
						}),
						success: function(oInput) {
							QUnit.ok(oInput, "Found the save confirm dialog");
						},
					});
				},

				// iShouldSeeMasterPage: function() {
				// 	return this.waitFor({
				// 		id: "receiveProductsListDocuments",
				// 		viewName: sViewName,
				// 		matchers: new sap.ui.test.matchers.AggregationFilled({
				// 			name: "items"
				// 		}),
				// 		success: function(oList) {
				// 			QUnit.ok(oList, "i found the object List");
				// 		},
				// 		errorMessage: "i can't see the master list."
				// 	});
				// },

				theListGroupShouldBeFilteredOnUnitNumberValue20OrLess: function() {
					return this.theListShouldBeFilteredOnUnitNumberValue(20, false, {
						iLow: 1,
						iHigh: 2
					});
				},

				theListShouldContainAGroupHeader: function() {
					return this.waitFor({
						controlType: "sap.m.GroupHeaderListItem",
						viewName: sViewName,
						success: function() {
							QUnit.ok(true, "Master list is grouped");
						},
						errorMessage: "Master list is not grouped"
					});
				},

				theListHeaderDisplaysZeroHits: function() {
					return this.waitFor({
						viewName: sViewName,
						id: "page",
						matchers: new PropertyStrictEquals({
							name: "title",
							value: "CarrierSet (0)"
						}),
						success: function() {
							QUnit.ok(true, "The list header displays 'CarrierSet (0)'");
						},
						errorMessage: "The list still has items"
					});
				},

				theListHasEntries: function() {
					return this.waitFor({
						viewName: sViewName,
						id: "receiveProductsListDocuments",
						matchers: new AggregationFilled({
							name: "items"
						}),
						success: function() {
							QUnit.ok(true, "The list has items");
						},
						errorMessage: "The list had no items"
					});
				},

				theListHasAllItemsOnMultiSelectMode: function() {
					return this.waitFor({
						viewName: sViewName,
						id: "receiveProductsListDocuments",
						matchers: function(oList) {
							return oList.getItems().every(function(oItem) {
								return oItem.getMode() === "MultiSelect";
							});
						},
						success: function(oListItems) {
							QUnit.ok(true, "The list has items on multiselect mode");
						},
						errorMessage: "The list items had no items on multiselect mode"
					});
				},

				theListShouldNotContainGroupHeaders: function() {
					function fnIsGroupHeader(oElement) {
						return oElement.getMetadata().getName() === "sap.m.GroupHeaderListItem";
					}

					return this.waitFor({
						viewName: sViewName,
						id: "list",
						matchers: function(oList) {
							return !oList.getItems().some(fnIsGroupHeader);
						},
						success: function() {
							QUnit.ok(true, "Master list does not contain a group header although grouping has been removed.");
						},
						errorMessage: "Master list still contains a group header although grouping has been removed."
					});
				},

				theListShouldBeSortedAscendingOnUnitNumber: function() {
					return this.theListShouldBeSortedAscendingOnField("");
				},

				theListShouldBeSortedAscendingOnName: function() {
					return this.theListShouldBeSortedAscendingOnField("Carrname");
				},

				theListShouldBeSortedAscendingOnField: function(sField) {
					function fnCheckSort(oList) {
						var oLastValue = null,
							fnIsOrdered = function(oElement) {
								if (!oElement.getBindingContext()) {
									return false;
								}

								var oCurrentValue = oElement.getBindingContext().getProperty(sField);

								if (oCurrentValue === undefined) {
									return false;
								}

								if (!oLastValue || oCurrentValue >= oLastValue) {
									oLastValue = oCurrentValue;
								} else {
									return false;
								}
								return true;
							};

						return oList.getItems().every(fnIsOrdered);
					}

					return this.waitFor({
						viewName: sViewName,
						id: "list",
						matchers: fnCheckSort,
						success: function() {
							QUnit.ok(true, "Master list has been sorted correctly for field '" + sField + "'.");
						},
						errorMessage: "Master list has not been sorted correctly for field '" + sField + "'."
					});
				},

				theListShouldBeFilteredOnUnitNumberValue: function(iThreshhold, bGreaterThan, oRange) {

					function fnCheckFilter(oList) {
						var fnIsGreaterThanMaxValue = function(oElement) {
							if (bGreaterThan) {
								return oElement.getBindingContext().getProperty("UnitNumber") < iThreshhold;
							}
							return oElement.getBindingContext().getProperty("UnitNumber") > iThreshhold;
						};
						var aItems = oList.getItems();
						if (oRange) {
							aItems = aItems.slice(oRange.iLow, oRange.iHigh);
						}

						return !aItems.some(fnIsGreaterThanMaxValue);
					}

					return this.waitFor({
						id: "list",
						viewName: sViewName,
						matchers: fnCheckFilter,
						success: function() {
							QUnit.ok(true, "Master list has been filtered correctly with filter value '" + iThreshhold + "'.");
						},
						errorMessage: "Master list has not been filtered correctly with filter value '" + iThreshhold + "'."
					});
				},

				theMasterListShouldBeFilteredOnUnitNumberValueMoreThanTheGroupBoundary: function() {
					return this.theListShouldBeFilteredOnUnitNumberValue(iGroupingBoundary, true);
				},

				theMasterListShouldBeFilteredOnUnitNumberValueLessThanTheGroupBoundary: function() {
					return this.theListShouldBeFilteredOnUnitNumberValue(iGroupingBoundary);
				},

				theListShowsOnlyObjectsWithTheSearchStringInTheirTitle: function() {
					this.waitFor({
						id: "list",
						viewName: sViewName,
						matchers: new AggregationFilled({
							name: "items"
						}),
						success: function(oList) {
							var sTitle = oList.getItems()[0].getTitle(),
								bEveryItemContainsTheTitle = oList.getItems().every(function(oItem) {
									return oItem.getTitle().indexOf(sTitle) !== -1;
								});

							QUnit.ok(bEveryItemContainsTheTitle, "Every item did contain the title");
						},
						errorMessage: "The list did not have items"
					});
				},

				theListShouldHaveNEntries: function(iObjIndex) {
					return this.waitFor({
						id: "receiveProductsListDocuments",
						viewName: sViewName,
						matchers: [new AggregationLengthEquals({
							name: "items",
							length: iObjIndex
						})],
						success: function(oList) {
							QUnit.strictEqual(oList.getItems().length, iObjIndex, "The list has " + oList.getItems().length + " items");
						},
						errorMessage: "List does not have " + iObjIndex + " entries."
					});
				},

				theListShouldHaveAllEntries: function() {
					return this.waitFor({
						id: "list",
						viewName: sViewName,
						matchers: function(oList) {
							var iThreshold = oList.getGrowingThreshold();
							return new AggregationLengthEquals({
								name: "items",
								length: iThreshold
							}).isMatching(oList);
						},
						success: function(oList) {
							QUnit.strictEqual(oList.getItems().length, oList.getGrowingThreshold(), "The growing list has 10 items");
						},
						errorMessage: "List does not have all entries."
					});
				},

				theMoveReasonMasterListShouldHaveNEntries: function(iObjIndex) {
					return this.waitFor({
						id: "receiveProductsListMoveReason",
						matchers: [new AggregationLengthEquals({
							name: "items",
							length: iObjIndex
						})],
						success: function(oList) {
							QUnit.strictEqual(oList.getItems().length, iObjIndex, "The list has " + oList.getItems().length + " items");
						},
						errorMessage: "List does not have " + iObjIndex + " entries."
					});
				},

				selectedDocumentsShouldHaveMoveReason: function() {
					return this.waitFor({
						id: "receiveProductsListDocuments",
						viewName: sViewName,
						matchers: function(oList) {
							return oList.getSelectedItems().every(function(oItem) {
								return oItem.getBindingContext().getProperty("MoveReasonName");
							});
						},
						success: function(oList) {
							QUnit.ok(true, "Entries have a MoveReason");
						},
						errorMessage: "Did not find MoveReason on selected entries"
					});
				},

				iShouldSeeTheNoDataTextForNoSearchResults: function() {
					return this.waitFor({
						id: "list",
						viewName: sViewName,
						success: function(oList) {
							QUnit.strictEqual(oList.getNoDataText(), oList.getModel("i18n").getProperty("masterListNoDataWithFilterOrSearchText"),
								"the list should show the no data text for search and filter");
						},
						errorMessage: "list does not show the no data text for search and filter"
					});
				},

				theHeaderShouldDisplayAllEntries: function() {
					return this.waitFor({
						id: "receiveProductsListDocuments",
						viewName: sViewName,
						success: function(oList) {
							var iExpectedLength = oList.getBinding("items").getLength();
							this.waitFor({
								id: "receiveProductsPageDocumentList",
								viewName: sViewName,
								matchers: new sap.ui.test.matchers.Properties({
									title: new RegExp(".\(" + iExpectedLength + "\)", "i")
								}),
								success: function() {
									QUnit.ok(true, "The master page header displays " + iExpectedLength + " items");
								},
								errorMessage: "The  master page header does not display " + iExpectedLength + " items."
							});
						},
						errorMessage: "Header does not display the number of items in the list"
					});
				},

				theFirstItemShouldBeSelected: function() {
					return this.waitFor({
						id: "receiveProductsListDocuments",
						viewName: sViewName,
						matchers: new AggregationFilled({
							name: "items"
						}),
						success: function(oList) {
							QUnit.strictEqual(oList.getItems()[0], oList.getSelectedItem(), "The first object is selected");
						},
						errorMessage: "The first object is not selected."
					});
				},

				theListShouldHaveNSelectedEntries: function(iObjIndex) {
					return this.waitFor({
						id: "receiveProductsListDocuments",
						viewName: sViewName,
						matchers: new AggregationFilled({
							name: "items"
						}),
						success: function(oList) {
							QUnit.strictEqual(oList.getSelectedItems().length, iObjIndex, iObjIndex + " selected items");
						},
						errorMessage: "List does not have " + iObjIndex + " selected items"
					});
				},

				theFirstItemPropertyShouldBeEqualTo: function(sProperty, sValue) {
					return this.waitFor({
						id: "receiveProductsListDocuments",
						viewName: sViewName,
						matchers: function(oList) {
							var oFirstItem = oList.getItems()[0];
							return oFirstItem && oFirstItem[sProperty]() === sValue;
						},
						success: function(oList) {
							QUnit.ok(true, "the property " + sProperty + " is equal to " + sValue);
						},
						errorMessage: "the property " + sProperty + " is not equal to " + sValue
					});
				},

				theProcessingStateSouldBeUnprocessed: function() {
					return this.waitFor({
						id: "receiveProductsListDocuments",
						viewName: sViewName,
						matchers: function(oList) {
							var oFirstItem = oList.getItems()[0];
							var oCtx = oFirstItem.getBindingContext();
							return oCtx.getProperty("ProcessingState") === "0";
						},
						success: function(oList) {
							QUnit.ok(true, "the state is unprocessed");
						},
						errorMessage: "the state is not unprocessed"
					});
				},

				theDeliveryTypeSouldBeZPDV: function() {
					return this.waitFor({
						id: "receiveProductsListDocuments",
						viewName: sViewName,
						matchers: function(oList) {
							var oFirstItem = oList.getItems()[0];
							var oCtx = oFirstItem.getBindingContext();
							return oCtx.getProperty("DeliveryType") === "ZPDV";
						},
						success: function(oList) {
							QUnit.ok(true, "the delivery type is ZPDV");
						},
						errorMessage: "the delivery type is not ZPDV"
					});
				},

				theListShouldHaveNoSelection: function() {
					return this.waitFor({
						id: "list",
						viewName: sViewName,
						matchers: function(oList) {
							return !oList.getSelectedItem();
						},
						success: function(oList) {
							QUnit.strictEqual(oList.getSelectedItems().length, 0, "The list selection is removed");
						},
						errorMessage: "List selection was not removed"
					});
				},

				theRememberedListItemShouldBeSelected: function() {
					this.waitFor({
						id: "list",
						viewName: sViewName,
						matchers: function(oList) {
							return oList.getSelectedItem();
						},
						success: function(oSelectedItem) {
							QUnit.strictEqual(oSelectedItem.getTitle(), this.getContext().currentListItem.getTitle(), "The list selection is incorrect");
						},
						errorMessage: "The list has no selection"
					});
				}
			}

		}

	});

});