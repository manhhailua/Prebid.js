/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /** @module pbjs */
	
	var _prebidGlobal = __webpack_require__(1);
	
	var _utils = __webpack_require__(2);
	
	var _video = __webpack_require__(4);
	
	__webpack_require__(15);
	
	var _url = __webpack_require__(14);
	
	var _cpmBucketManager = __webpack_require__(12);
	
	var _secureCreatives = __webpack_require__(43);
	
	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
	
	var pbjs = (0, _prebidGlobal.getGlobal)();
	var CONSTANTS = __webpack_require__(3);
	var utils = __webpack_require__(2);
	var bidmanager = __webpack_require__(11);
	var adaptermanager = __webpack_require__(5);
	var bidfactory = __webpack_require__(10);
	var adloader = __webpack_require__(44);
	var events = __webpack_require__(8);
	var adserver = __webpack_require__(45);
	var targeting = __webpack_require__(46);
	
	/* private variables */
	
	var objectType_function = 'function';
	var objectType_undefined = 'undefined';
	var objectType_object = 'object';
	var BID_WON = CONSTANTS.EVENTS.BID_WON;
	var SET_TARGETING = CONSTANTS.EVENTS.SET_TARGETING;
	
	var auctionRunning = false;
	var bidRequestQueue = [];
	
	var eventValidators = {
	  bidWon: checkDefinedPlacement
	};
	
	/* Public vars */
	
	pbjs._bidsRequested = [];
	pbjs._bidsReceived = [];
	// _adUnitCodes stores the current filter to use for adUnits as an array of adUnitCodes
	pbjs._adUnitCodes = [];
	pbjs._winningBids = [];
	pbjs._adsReceived = [];
	pbjs._sendAllBids = false;
	
	pbjs.bidderSettings = pbjs.bidderSettings || {};
	
	//default timeout for all bids
	pbjs.bidderTimeout = pbjs.bidderTimeout || 3000;
	
	// current timeout set in `requestBids` or to default `bidderTimeout`
	pbjs.cbTimeout = pbjs.cbTimeout || 200;
	
	// timeout buffer to adjust for bidder CDN latency
	pbjs.timeoutBuffer = 200;
	
	pbjs.logging = pbjs.logging || false;
	
	// domain where prebid is running for cross domain iframe communication
	pbjs.publisherDomain = pbjs.publisherDomain || window.location.origin;
	
	//let the world know we are loaded
	pbjs.libLoaded = true;
	
	//version auto generated from build
	pbjs.version = 'v0.20.0-pre';
	utils.logInfo('Prebid.js v0.20.0-pre loaded');
	
	//create adUnit array
	pbjs.adUnits = pbjs.adUnits || [];
	
	/**
	 * Command queue that functions will execute once prebid.js is loaded
	 * @param  {function} cmd Annoymous function to execute
	 * @alias module:pbjs.que.push
	 */
	pbjs.que.push = function (cmd) {
	  if ((typeof cmd === 'undefined' ? 'undefined' : _typeof(cmd)) === objectType_function) {
	    try {
	      cmd.call();
	    } catch (e) {
	      utils.logError('Error processing command :' + e.message);
	    }
	  } else {
	    utils.logError('Commands written into pbjs.que.push must wrapped in a function');
	  }
	};
	
	function processQue() {
	  for (var i = 0; i < pbjs.que.length; i++) {
	    if (_typeof(pbjs.que[i].called) === objectType_undefined) {
	      try {
	        pbjs.que[i].call();
	        pbjs.que[i].called = true;
	      } catch (e) {
	        utils.logError('Error processing command :', 'prebid.js', e);
	      }
	    }
	  }
	}
	
	function checkDefinedPlacement(id) {
	  var placementCodes = pbjs._bidsRequested.map(function (bidSet) {
	    return bidSet.bids.map(function (bid) {
	      return bid.placementCode;
	    });
	  }).reduce(_utils.flatten).filter(_utils.uniques);
	
	  if (!utils.contains(placementCodes, id)) {
	    utils.logError('The "' + id + '" placement is not defined.');
	    return;
	  }
	
	  return true;
	}
	
	/**
	 * When a request for bids is made any stale bids remaining will be cleared for
	 * a placement included in the outgoing bid request.
	 */
	function clearPlacements() {
	  pbjs._bidsRequested = [];
	
	  // leave bids received for ad slots not in this bid request
	  pbjs._bidsReceived = pbjs._bidsReceived.filter(function (bid) {
	    return !pbjs._adUnitCodes.includes(bid.adUnitCode);
	  });
	}
	
	function setRenderSize(doc, width, height) {
	  if (doc.defaultView && doc.defaultView.frameElement) {
	    doc.defaultView.frameElement.width = width;
	    doc.defaultView.frameElement.height = height;
	  }
	}
	
	//////////////////////////////////
	//                              //
	//    Start Public APIs         //
	//                              //
	//////////////////////////////////
	
	/**
	 * This function returns the query string targeting parameters available at this moment for a given ad unit. Note that some bidder's response may not have been received if you call this function too quickly after the requests are sent.
	 * @param  {string} [adunitCode] adUnitCode to get the bid responses for
	 * @alias module:pbjs.getAdserverTargetingForAdUnitCodeStr
	 * @return {array}  returnObj return bids array
	 */
	pbjs.getAdserverTargetingForAdUnitCodeStr = function (adunitCode) {
	  utils.logInfo('Invoking pbjs.getAdserverTargetingForAdUnitCodeStr', arguments);
	
	  // call to retrieve bids array
	  if (adunitCode) {
	    var res = pbjs.getAdserverTargetingForAdUnitCode(adunitCode);
	    return utils.transformAdServerTargetingObj(res);
	  } else {
	    utils.logMessage('Need to call getAdserverTargetingForAdUnitCodeStr with adunitCode');
	  }
	};
	
	/**
	 * This function returns the query string targeting parameters available at this moment for a given ad unit. Note that some bidder's response may not have been received if you call this function too quickly after the requests are sent.
	 * @param adUnitCode {string} adUnitCode to get the bid responses for
	 * @returns {object}  returnObj return bids
	 */
	pbjs.getAdserverTargetingForAdUnitCode = function (adUnitCode) {
	  return pbjs.getAdserverTargeting(adUnitCode)[adUnitCode];
	};
	
	/**
	 * returns all ad server targeting for all ad units
	 * @return {object} Map of adUnitCodes and targeting values []
	 * @alias module:pbjs.getAdserverTargeting
	 */
	
	pbjs.getAdserverTargeting = function (adUnitCode) {
	  utils.logInfo('Invoking pbjs.getAdserverTargeting', arguments);
	  return targeting.getAllTargeting(adUnitCode).map(function (targeting) {
	    return _defineProperty({}, Object.keys(targeting)[0], targeting[Object.keys(targeting)[0]].map(function (target) {
	      return _defineProperty({}, Object.keys(target)[0], target[Object.keys(target)[0]].join(', '));
	    }).reduce(function (p, c) {
	      return _extends(c, p);
	    }, {}));
	  }).reduce(function (accumulator, targeting) {
	    var key = Object.keys(targeting)[0];
	    accumulator[key] = _extends({}, accumulator[key], targeting[key]);
	    return accumulator;
	  }, {});
	};
	
	/**
	 * This function returns the bid responses at the given moment.
	 * @alias module:pbjs.getBidResponses
	 * @return {object}            map | object that contains the bidResponses
	 */
	
	pbjs.getBidResponses = function () {
	  utils.logInfo('Invoking pbjs.getBidResponses', arguments);
	  var responses = pbjs._bidsReceived.filter(_utils.adUnitsFilter.bind(this, pbjs._adUnitCodes));
	
	  // find the last requested id to get responses for most recent auction only
	  var currentRequestId = responses && responses.length && responses[responses.length - 1].requestId;
	
	  return responses.map(function (bid) {
	    return bid.adUnitCode;
	  }).filter(_utils.uniques).map(function (adUnitCode) {
	    return responses.filter(function (bid) {
	      return bid.requestId === currentRequestId && bid.adUnitCode === adUnitCode;
	    });
	  }).filter(function (bids) {
	    return bids && bids[0] && bids[0].adUnitCode;
	  }).map(function (bids) {
	    return _defineProperty({}, bids[0].adUnitCode, { bids: bids });
	  }).reduce(function (a, b) {
	    return _extends(a, b);
	  }, {});
	};
	
	/**
	 * Returns bidResponses for the specified adUnitCode
	 * @param  {String} adUnitCode adUnitCode
	 * @alias module:pbjs.getBidResponsesForAdUnitCode
	 * @return {Object}            bidResponse object
	 */
	
	pbjs.getBidResponsesForAdUnitCode = function (adUnitCode) {
	  var bids = pbjs._bidsReceived.filter(function (bid) {
	    return bid.adUnitCode === adUnitCode;
	  });
	  return {
	    bids: bids
	  };
	};
	
	/**
	 * Set query string targeting on all GPT ad units.
	 * @alias module:pbjs.setTargetingForGPTAsync
	 */
	pbjs.setTargetingForGPTAsync = function () {
	  utils.logInfo('Invoking pbjs.setTargetingForGPTAsync', arguments);
	  if (!(0, _utils.isGptPubadsDefined)()) {
	    utils.logError('window.googletag is not defined on the page');
	    return;
	  }
	
	  //first reset any old targeting
	  targeting.resetPresetTargeting();
	
	  //now set new targeting keys
	  targeting.setTargeting(targeting.getAllTargeting());
	
	  //emit event 
	  events.emit(SET_TARGETING);
	};
	
	pbjs.setTargetingForAst = function () {
	  utils.logInfo('Invoking pbjs.setTargetingForAn', arguments);
	  if (!targeting.isApntagDefined()) {
	    utils.logError('window.apntag is not defined on the page');
	    return;
	  }
	
	  targeting.setTargetingForAst();
	
	  //emit event 
	  events.emit(SET_TARGETING);
	};
	
	/**
	 * Returns a bool if all the bids have returned or timed out
	 * @alias module:pbjs.allBidsAvailable
	 * @return {bool} all bids available
	 */
	pbjs.allBidsAvailable = function () {
	  utils.logInfo('Invoking pbjs.allBidsAvailable', arguments);
	  return bidmanager.bidsBackAll();
	};
	
	/**
	 * This function will render the ad (based on params) in the given iframe document passed through. Note that doc SHOULD NOT be the parent document page as we can't doc.write() asynchrounsly
	 * @param  {object} doc document
	 * @param  {string} id bid id to locate the ad
	 * @alias module:pbjs.renderAd
	 */
	pbjs.renderAd = function (doc, id) {
	  utils.logInfo('Invoking pbjs.renderAd', arguments);
	  utils.logMessage('Calling renderAd with adId :' + id);
	  if (doc && id) {
	    try {
	      //lookup ad by ad Id
	      var adObject = pbjs._bidsReceived.find(function (bid) {
	        return bid.adId === id;
	      });
	      if (adObject) {
	        //save winning bids
	        pbjs._winningBids.push(adObject);
	        //emit 'bid won' event here
	        events.emit(BID_WON, adObject);
	
	        var height = adObject.height;
	        var width = adObject.width;
	        var url = adObject.adUrl;
	        var ad = adObject.ad;
	
	        if (doc === document || adObject.mediaType === 'video') {
	          utils.logError('Error trying to write ad. Ad render call ad id ' + id + ' was prevented from writing to the main document.');
	        } else if (ad) {
	          doc.write(ad);
	          doc.close();
	          setRenderSize(doc, width, height);
	        } else if (url) {
	          doc.write('<IFRAME SRC="' + url + '" FRAMEBORDER="0" SCROLLING="no" MARGINHEIGHT="0" MARGINWIDTH="0" TOPMARGIN="0" LEFTMARGIN="0" ALLOWTRANSPARENCY="true" WIDTH="' + width + '" HEIGHT="' + height + '"></IFRAME>');
	          doc.close();
	          setRenderSize(doc, width, height);
	        } else {
	          utils.logError('Error trying to write ad. No ad for bid response id: ' + id);
	        }
	      } else {
	        utils.logError('Error trying to write ad. Cannot find ad by given id : ' + id);
	      }
	    } catch (e) {
	      utils.logError('Error trying to write ad Id :' + id + ' to the page:' + e.message);
	    }
	  } else {
	    utils.logError('Error trying to write ad Id :' + id + ' to the page. Missing document or adId');
	  }
	};
	
	/**
	 * Remove adUnit from the pbjs configuration
	 * @param  {String} adUnitCode the adUnitCode to remove
	 * @alias module:pbjs.removeAdUnit
	 */
	pbjs.removeAdUnit = function (adUnitCode) {
	  utils.logInfo('Invoking pbjs.removeAdUnit', arguments);
	  if (adUnitCode) {
	    for (var i = 0; i < pbjs.adUnits.length; i++) {
	      if (pbjs.adUnits[i].code === adUnitCode) {
	        pbjs.adUnits.splice(i, 1);
	      }
	    }
	  }
	};
	
	pbjs.clearAuction = function () {
	  auctionRunning = false;
	  utils.logMessage('Prebid auction cleared');
	  if (bidRequestQueue.length) {
	    bidRequestQueue.shift()();
	  }
	};
	
	/**
	 *
	 * @param bidsBackHandler
	 * @param timeout
	 * @param adUnits
	 * @param adUnitCodes
	 */
	pbjs.requestBids = function (_ref4) {
	  var bidsBackHandler = _ref4.bidsBackHandler,
	      timeout = _ref4.timeout,
	      adUnits = _ref4.adUnits,
	      adUnitCodes = _ref4.adUnitCodes;
	
	  events.emit('requestBids');
	  var cbTimeout = pbjs.cbTimeout = timeout || pbjs.bidderTimeout;
	  adUnits = adUnits || pbjs.adUnits;
	
	  utils.logInfo('Invoking pbjs.requestBids', arguments);
	
	  if (adUnitCodes && adUnitCodes.length) {
	    // if specific adUnitCodes supplied filter adUnits for those codes
	    adUnits = adUnits.filter(function (unit) {
	      return adUnitCodes.includes(unit.code);
	    });
	  } else {
	    // otherwise derive adUnitCodes from adUnits
	    adUnitCodes = adUnits && adUnits.map(function (unit) {
	      return unit.code;
	    });
	  }
	
	  // for video-enabled adUnits, only request bids if all bidders support video
	  var invalidVideoAdUnits = adUnits.filter(_video.videoAdUnit).filter(_video.hasNonVideoBidder);
	  invalidVideoAdUnits.forEach(function (adUnit) {
	    utils.logError('adUnit ' + adUnit.code + ' has \'mediaType\' set to \'video\' but contains a bidder that doesn\'t support video. No Prebid demand requests will be triggered for this adUnit.');
	    for (var i = 0; i < adUnits.length; i++) {
	      if (adUnits[i].code === adUnit.code) {
	        adUnits.splice(i, 1);
	      }
	    }
	  });
	
	  if (auctionRunning) {
	    bidRequestQueue.push(function () {
	      pbjs.requestBids({ bidsBackHandler: bidsBackHandler, timeout: cbTimeout, adUnits: adUnits, adUnitCodes: adUnitCodes });
	    });
	    return;
	  }
	
	  auctionRunning = true;
	
	  // we will use adUnitCodes for filtering the current auction
	  pbjs._adUnitCodes = adUnitCodes;
	
	  bidmanager.externalCallbackReset();
	  clearPlacements();
	
	  if (!adUnits || adUnits.length === 0) {
	    utils.logMessage('No adUnits configured. No bids requested.');
	    if ((typeof bidsBackHandler === 'undefined' ? 'undefined' : _typeof(bidsBackHandler)) === objectType_function) {
	      bidmanager.addOneTimeCallback(bidsBackHandler, false);
	    }
	    bidmanager.executeCallback();
	    return;
	  }
	
	  //set timeout for all bids
	  var timedOut = true;
	  var timeoutCallback = bidmanager.executeCallback.bind(bidmanager, timedOut);
	  var timer = setTimeout(timeoutCallback, cbTimeout);
	  if ((typeof bidsBackHandler === 'undefined' ? 'undefined' : _typeof(bidsBackHandler)) === objectType_function) {
	    bidmanager.addOneTimeCallback(bidsBackHandler, timer);
	  }
	
	  adaptermanager.callBids({ adUnits: adUnits, adUnitCodes: adUnitCodes, cbTimeout: cbTimeout });
	  if (pbjs._bidsRequested.length === 0) {
	    bidmanager.executeCallback();
	  }
	};
	
	/**
	 *
	 * Add adunit(s)
	 * @param {Array|String} adUnitArr Array of adUnits or single adUnit Object.
	 * @alias module:pbjs.addAdUnits
	 */
	pbjs.addAdUnits = function (adUnitArr) {
	  utils.logInfo('Invoking pbjs.addAdUnits', arguments);
	  if (utils.isArray(adUnitArr)) {
	    //append array to existing
	    pbjs.adUnits.push.apply(pbjs.adUnits, adUnitArr);
	  } else if ((typeof adUnitArr === 'undefined' ? 'undefined' : _typeof(adUnitArr)) === objectType_object) {
	    pbjs.adUnits.push(adUnitArr);
	  }
	};
	
	/**
	 * @param {String} event the name of the event
	 * @param {Function} handler a callback to set on event
	 * @param {String} id an identifier in the context of the event
	 *
	 * This API call allows you to register a callback to handle a Prebid.js event.
	 * An optional `id` parameter provides more finely-grained event callback registration.
	 * This makes it possible to register callback events for a specific item in the
	 * event context. For example, `bidWon` events will accept an `id` for ad unit code.
	 * `bidWon` callbacks registered with an ad unit code id will be called when a bid
	 * for that ad unit code wins the auction. Without an `id` this method registers the
	 * callback for every `bidWon` event.
	 *
	 * Currently `bidWon` is the only event that accepts an `id` parameter.
	 */
	pbjs.onEvent = function (event, handler, id) {
	  utils.logInfo('Invoking pbjs.onEvent', arguments);
	  if (!utils.isFn(handler)) {
	    utils.logError('The event handler provided is not a function and was not set on event "' + event + '".');
	    return;
	  }
	
	  if (id && !eventValidators[event].call(null, id)) {
	    utils.logError('The id provided is not valid for event "' + event + '" and no handler was set.');
	    return;
	  }
	
	  events.on(event, handler, id);
	};
	
	/**
	 * @param {String} event the name of the event
	 * @param {Function} handler a callback to remove from the event
	 * @param {String} id an identifier in the context of the event (see `pbjs.onEvent`)
	 */
	pbjs.offEvent = function (event, handler, id) {
	  utils.logInfo('Invoking pbjs.offEvent', arguments);
	  if (id && !eventValidators[event].call(null, id)) {
	    return;
	  }
	
	  events.off(event, handler, id);
	};
	
	/**
	 * Add a callback event
	 * @param {String} eventStr event to attach callback to Options: "allRequestedBidsBack" | "adUnitBidsBack"
	 * @param {Function} func  function to execute. Paramaters passed into the function: (bidResObj), [adUnitCode]);
	 * @alias module:pbjs.addCallback
	 * @returns {String} id for callback
	 */
	pbjs.addCallback = function (eventStr, func) {
	  utils.logInfo('Invoking pbjs.addCallback', arguments);
	  var id = null;
	  if (!eventStr || !func || (typeof func === 'undefined' ? 'undefined' : _typeof(func)) !== objectType_function) {
	    utils.logError('error registering callback. Check method signature');
	    return id;
	  }
	
	  id = utils.getUniqueIdentifierStr;
	  bidmanager.addCallback(id, func, eventStr);
	  return id;
	};
	
	/**
	 * Remove a callback event
	 * //@param {string} cbId id of the callback to remove
	 * @alias module:pbjs.removeCallback
	 * @returns {String} id for callback
	 */
	pbjs.removeCallback = function () /* cbId */{
	  //todo
	  return null;
	};
	
	/**
	 * Wrapper to register bidderAdapter externally (adaptermanager.registerBidAdapter())
	 * @param  {[type]} bidderAdaptor [description]
	 * @param  {[type]} bidderCode    [description]
	 * @return {[type]}               [description]
	 */
	pbjs.registerBidAdapter = function (bidderAdaptor, bidderCode) {
	  utils.logInfo('Invoking pbjs.registerBidAdapter', arguments);
	  try {
	    adaptermanager.registerBidAdapter(bidderAdaptor(), bidderCode);
	  } catch (e) {
	    utils.logError('Error registering bidder adapter : ' + e.message);
	  }
	};
	
	/**
	 * Wrapper to register analyticsAdapter externally (adaptermanager.registerAnalyticsAdapter())
	 * @param  {[type]} options [description]
	 */
	pbjs.registerAnalyticsAdapter = function (options) {
	  utils.logInfo('Invoking pbjs.registerAnalyticsAdapter', arguments);
	  try {
	    adaptermanager.registerAnalyticsAdapter(options);
	  } catch (e) {
	    utils.logError('Error registering analytics adapter : ' + e.message);
	  }
	};
	
	pbjs.bidsAvailableForAdapter = function (bidderCode) {
	  utils.logInfo('Invoking pbjs.bidsAvailableForAdapter', arguments);
	
	  pbjs._bidsRequested.find(function (bidderRequest) {
	    return bidderRequest.bidderCode === bidderCode;
	  }).bids.map(function (bid) {
	    return _extends(bid, bidfactory.createBid(1), {
	      bidderCode: bidderCode,
	      adUnitCode: bid.placementCode
	    });
	  }).map(function (bid) {
	    return pbjs._bidsReceived.push(bid);
	  });
	};
	
	/**
	 * Wrapper to bidfactory.createBid()
	 * @param  {[type]} statusCode [description]
	 * @return {[type]}            [description]
	 */
	pbjs.createBid = function (statusCode) {
	  utils.logInfo('Invoking pbjs.createBid', arguments);
	  return bidfactory.createBid(statusCode);
	};
	
	/**
	 * Wrapper to bidmanager.addBidResponse
	 * @param {[type]} adUnitCode [description]
	 * @param {[type]} bid        [description]
	 */
	pbjs.addBidResponse = function (adUnitCode, bid) {
	  utils.logInfo('Invoking pbjs.addBidResponse', arguments);
	  bidmanager.addBidResponse(adUnitCode, bid);
	};
	
	/**
	 * Wrapper to adloader.loadScript
	 * @param  {[type]}   tagSrc   [description]
	 * @param  {Function} callback [description]
	 * @return {[type]}            [description]
	 */
	pbjs.loadScript = function (tagSrc, callback, useCache) {
	  utils.logInfo('Invoking pbjs.loadScript', arguments);
	  adloader.loadScript(tagSrc, callback, useCache);
	};
	
	/**
	 * Will enable sendinga prebid.js to data provider specified
	 * @param  {object} config object {provider : 'string', options : {}}
	 */
	pbjs.enableAnalytics = function (config) {
	  if (config && !utils.isEmpty(config)) {
	    utils.logInfo('Invoking pbjs.enableAnalytics for: ', config);
	    adaptermanager.enableAnalytics(config);
	  } else {
	    utils.logError('pbjs.enableAnalytics should be called with option {}');
	  }
	};
	
	pbjs.aliasBidder = function (bidderCode, alias) {
	  utils.logInfo('Invoking pbjs.aliasBidder', arguments);
	  if (bidderCode && alias) {
	    adaptermanager.aliasBidAdapter(bidderCode, alias);
	  } else {
	    utils.logError('bidderCode and alias must be passed as arguments', 'pbjs.aliasBidder');
	  }
	};
	
	/**
	 * Sets a default price granularity scheme.
	 * @param {String|Object} granularity - the granularity scheme.
	 * "low": $0.50 increments, capped at $5 CPM
	 * "medium": $0.10 increments, capped at $20 CPM (the default)
	 * "high": $0.01 increments, capped at $20 CPM
	 * "auto": Applies a sliding scale to determine granularity
	 * "dense": Like "auto", but the bid price granularity uses smaller increments, especially at lower CPMs
	 *
	 * Alternatively a custom object can be specified:
	 * { "buckets" : [{"min" : 0,"max" : 20,"increment" : 0.1,"cap" : true}]};
	 * See http://prebid.org/dev-docs/publisher-api-reference.html#module_pbjs.setPriceGranularity for more details
	 */
	pbjs.setPriceGranularity = function (granularity) {
	  utils.logInfo('Invoking pbjs.setPriceGranularity', arguments);
	  if (!granularity) {
	    utils.logError('Prebid Error: no value passed to `setPriceGranularity()`');
	    return;
	  }
	  if (typeof granularity === 'string') {
	    bidmanager.setPriceGranularity(granularity);
	  } else if ((typeof granularity === 'undefined' ? 'undefined' : _typeof(granularity)) === 'object') {
	    if (!(0, _cpmBucketManager.isValidePriceConfig)(granularity)) {
	      utils.logError('Invalid custom price value passed to `setPriceGranularity()`');
	      return;
	    }
	    bidmanager.setCustomPriceBucket(granularity);
	    bidmanager.setPriceGranularity(CONSTANTS.GRANULARITY_OPTIONS.CUSTOM);
	    utils.logMessage('Using custom price granularity');
	  }
	};
	
	pbjs.enableSendAllBids = function () {
	  pbjs._sendAllBids = true;
	};
	
	pbjs.getAllWinningBids = function () {
	  return pbjs._winningBids;
	};
	
	/**
	 * Build master video tag from publishers adserver tag
	 * @param {string} adserverTag default url
	 * @param {object} options options for video tag
	 */
	pbjs.buildMasterVideoTagFromAdserverTag = function (adserverTag, options) {
	  utils.logInfo('Invoking pbjs.buildMasterVideoTagFromAdserverTag', arguments);
	  var urlComponents = (0, _url.parse)(adserverTag);
	
	  //return original adserverTag if no bids received
	  if (pbjs._bidsReceived.length === 0) {
	    return adserverTag;
	  }
	
	  var masterTag = '';
	  if (options.adserver.toLowerCase() === 'dfp') {
	    var dfpAdserverObj = adserver.dfpAdserver(options, urlComponents);
	    if (!dfpAdserverObj.verifyAdserverTag()) {
	      utils.logError('Invalid adserverTag, required google params are missing in query string');
	    }
	    dfpAdserverObj.appendQueryParams();
	    masterTag = (0, _url.format)(dfpAdserverObj.urlComponents);
	  } else {
	    utils.logError('Only DFP adserver is supported');
	    return;
	  }
	  return masterTag;
	};
	
	/**
	 * Set the order bidders are called in. If not set, the bidders are called in
	 * the order they are defined wihin the adUnit.bids array
	 * @param {string} order - Order to call bidders in. Currently the only possible value
	 * is 'random', which randomly shuffles the order
	 */
	pbjs.setBidderSequence = function (order) {
	  if (order === CONSTANTS.ORDER.RANDOM) {
	    adaptermanager.setBidderSequence(CONSTANTS.ORDER.RANDOM);
	  }
	};
	
	/**
	 * Get array of highest cpm bids for all adUnits, or highest cpm bid
	 * object for the given adUnit
	 * @param {string} adUnitCode - optional ad unit code
	 * @return {array} array containing highest cpm bid object(s)
	 */
	pbjs.getHighestCpmBids = function (adUnitCode) {
	  return targeting.getWinningBids(adUnitCode);
	};
	
	pbjs.que.push(function () {
	  return (0, _secureCreatives.listenMessagesFromCreative)();
	});
	processQue();

/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.getGlobal = getGlobal;
	// if pbjs already exists in global document scope, use it, if not, create the object
	// global defination should happen BEFORE imports to avoid global undefined errors.
	window.pbjs = window.pbjs || {};
	window.pbjs.que = window.pbjs.que || [];
	
	function getGlobal() {
	  return window.pbjs;
	}

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	exports.uniques = uniques;
	exports.flatten = flatten;
	exports.getBidRequest = getBidRequest;
	exports.getKeys = getKeys;
	exports.getValue = getValue;
	exports.getBidderCodes = getBidderCodes;
	exports.isGptPubadsDefined = isGptPubadsDefined;
	exports.getHighestCpm = getHighestCpm;
	exports.shuffle = shuffle;
	exports.adUnitsFilter = adUnitsFilter;
	var CONSTANTS = __webpack_require__(3);
	
	var objectType_object = 'object';
	var objectType_string = 'string';
	var objectType_number = 'number';
	
	var _loggingChecked = false;
	
	var t_Arr = 'Array';
	var t_Str = 'String';
	var t_Fn = 'Function';
	var t_Numb = 'Number';
	var toString = Object.prototype.toString;
	var infoLogger = null;
	try {
	  infoLogger = console.info.bind(window.console);
	} catch (e) {}
	
	/*
	 *   Substitutes into a string from a given map using the token
	 *   Usage
	 *   var str = 'text %%REPLACE%% this text with %%SOMETHING%%';
	 *   var map = {};
	 *   map['replace'] = 'it was subbed';
	 *   map['something'] = 'something else';
	 *   console.log(replaceTokenInString(str, map, '%%')); => "text it was subbed this text with something else"
	 */
	exports.replaceTokenInString = function (str, map, token) {
	  this._each(map, function (value, key) {
	    value = value === undefined ? '' : value;
	
	    var keyString = token + key.toUpperCase() + token;
	    var re = new RegExp(keyString, 'g');
	
	    str = str.replace(re, value);
	  });
	
	  return str;
	};
	
	/* utility method to get incremental integer starting from 1 */
	var getIncrementalInteger = function () {
	  var count = 0;
	  return function () {
	    count++;
	    return count;
	  };
	}();
	
	function _getUniqueIdentifierStr() {
	  return getIncrementalInteger() + Math.random().toString(16).substr(2);
	}
	
	//generate a random string (to be used as a dynamic JSONP callback)
	exports.getUniqueIdentifierStr = _getUniqueIdentifierStr;
	
	/**
	 * Returns a random v4 UUID of the form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx,
	 * where each x is replaced with a random hexadecimal digit from 0 to f,
	 * and y is replaced with a random hexadecimal digit from 8 to b.
	 * https://gist.github.com/jed/982883 via node-uuid
	 */
	exports.generateUUID = function generateUUID(placeholder) {
	  return placeholder ? (placeholder ^ Math.random() * 16 >> placeholder / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, generateUUID);
	};
	
	exports.getBidIdParameter = function (key, paramsObj) {
	  if (paramsObj && paramsObj[key]) {
	    return paramsObj[key];
	  }
	
	  return '';
	};
	
	exports.tryAppendQueryString = function (existingUrl, key, value) {
	  if (value) {
	    return existingUrl += key + '=' + encodeURIComponent(value) + '&';
	  }
	
	  return existingUrl;
	};
	
	//parse a query string object passed in bid params
	//bid params should be an object such as {key: "value", key1 : "value1"}
	exports.parseQueryStringParameters = function (queryObj) {
	  var result = '';
	  for (var k in queryObj) {
	    if (queryObj.hasOwnProperty(k)) result += k + '=' + encodeURIComponent(queryObj[k]) + '&';
	  }
	
	  return result;
	};
	
	//transform an AdServer targeting bids into a query string to send to the adserver
	exports.transformAdServerTargetingObj = function (targeting) {
	  // we expect to receive targeting for a single slot at a time
	  if (targeting && Object.getOwnPropertyNames(targeting).length > 0) {
	
	    return getKeys(targeting).map(function (key) {
	      return key + '=' + encodeURIComponent(getValue(targeting, key));
	    }).join('&');
	  } else {
	    return '';
	  }
	};
	
	//Copy all of the properties in the source objects over to the target object
	//return the target object.
	exports.extend = function (target, source) {
	  target = target || {};
	
	  this._each(source, function (value, prop) {
	    if (_typeof(source[prop]) === objectType_object) {
	      target[prop] = this.extend(target[prop], source[prop]);
	    } else {
	      target[prop] = source[prop];
	    }
	  });
	
	  return target;
	};
	
	/**
	 * Parse a GPT-Style general size Array like `[[300, 250]]` or `"300x250,970x90"` into an array of sizes `["300x250"]` or '['300x250', '970x90']'
	 * @param  {array[array|number]} sizeObj Input array or double array [300,250] or [[300,250], [728,90]]
	 * @return {array[string]}  Array of strings like `["300x250"]` or `["300x250", "728x90"]`
	 */
	exports.parseSizesInput = function (sizeObj) {
	  var parsedSizes = [];
	
	  //if a string for now we can assume it is a single size, like "300x250"
	  if ((typeof sizeObj === 'undefined' ? 'undefined' : _typeof(sizeObj)) === objectType_string) {
	    //multiple sizes will be comma-separated
	    var sizes = sizeObj.split(',');
	
	    //regular expression to match strigns like 300x250
	    //start of line, at least 1 number, an "x" , then at least 1 number, and the then end of the line
	    var sizeRegex = /^(\d)+x(\d)+$/i;
	    if (sizes) {
	      for (var curSizePos in sizes) {
	        if (hasOwn(sizes, curSizePos) && sizes[curSizePos].match(sizeRegex)) {
	          parsedSizes.push(sizes[curSizePos]);
	        }
	      }
	    }
	  } else if ((typeof sizeObj === 'undefined' ? 'undefined' : _typeof(sizeObj)) === objectType_object) {
	    var sizeArrayLength = sizeObj.length;
	
	    //don't process empty array
	    if (sizeArrayLength > 0) {
	      //if we are a 2 item array of 2 numbers, we must be a SingleSize array
	      if (sizeArrayLength === 2 && _typeof(sizeObj[0]) === objectType_number && _typeof(sizeObj[1]) === objectType_number) {
	        parsedSizes.push(this.parseGPTSingleSizeArray(sizeObj));
	      } else {
	        //otherwise, we must be a MultiSize array
	        for (var i = 0; i < sizeArrayLength; i++) {
	          parsedSizes.push(this.parseGPTSingleSizeArray(sizeObj[i]));
	        }
	      }
	    }
	  }
	
	  return parsedSizes;
	};
	
	//parse a GPT style sigle size array, (i.e [300,250])
	//into an AppNexus style string, (i.e. 300x250)
	exports.parseGPTSingleSizeArray = function (singleSize) {
	  //if we aren't exactly 2 items in this array, it is invalid
	  if (this.isArray(singleSize) && singleSize.length === 2 && !isNaN(singleSize[0]) && !isNaN(singleSize[1])) {
	    return singleSize[0] + 'x' + singleSize[1];
	  }
	};
	
	exports.getTopWindowLocation = function () {
	  var location = void 0;
	  try {
	    location = window.top.location;
	  } catch (e) {
	    location = window.location;
	  }
	
	  return location;
	};
	
	exports.getTopWindowUrl = function () {
	  var href = void 0;
	  try {
	    href = this.getTopWindowLocation().href;
	  } catch (e) {
	    href = '';
	  }
	
	  return href;
	};
	
	exports.logWarn = function (msg) {
	  if (debugTurnedOn() && console.warn) {
	    console.warn('WARNING: ' + msg);
	  }
	};
	
	exports.logInfo = function (msg, args) {
	  if (debugTurnedOn() && hasConsoleLogger()) {
	    if (infoLogger) {
	      if (!args || args.length === 0) {
	        args = '';
	      }
	
	      infoLogger('INFO: ' + msg + (args === '' ? '' : ' : params : '), args);
	    }
	  }
	};
	
	exports.logMessage = function (msg) {
	  if (debugTurnedOn() && hasConsoleLogger()) {
	    console.log('MESSAGE: ' + msg);
	  }
	};
	
	function hasConsoleLogger() {
	  return window.console && window.console.log;
	}
	
	exports.hasConsoleLogger = hasConsoleLogger;
	
	var errLogFn = function (hasLogger) {
	  if (!hasLogger) return '';
	  return window.console.error ? 'error' : 'log';
	}(hasConsoleLogger());
	
	var debugTurnedOn = function debugTurnedOn() {
	  if (pbjs.logging === false && _loggingChecked === false) {
	    pbjs.logging = getParameterByName(CONSTANTS.DEBUG_MODE).toUpperCase() === 'TRUE';
	    _loggingChecked = true;
	  }
	
	  return !!pbjs.logging;
	};
	
	exports.debugTurnedOn = debugTurnedOn;
	
	exports.logError = function (msg, code, exception) {
	  var errCode = code || 'ERROR';
	  if (debugTurnedOn() && hasConsoleLogger()) {
	    console[errLogFn](console, errCode + ': ' + msg, exception || '');
	  }
	};
	
	exports.createInvisibleIframe = function _createInvisibleIframe() {
	  var f = document.createElement('iframe');
	  f.id = _getUniqueIdentifierStr();
	  f.height = 0;
	  f.width = 0;
	  f.border = '0px';
	  f.hspace = '0';
	  f.vspace = '0';
	  f.marginWidth = '0';
	  f.marginHeight = '0';
	  f.style.border = '0';
	  f.scrolling = 'no';
	  f.frameBorder = '0';
	  f.src = 'about:blank';
	  f.style.display = 'none';
	  return f;
	};
	
	/*
	 *   Check if a given parameter name exists in query string
	 *   and if it does return the value
	 */
	var getParameterByName = function getParameterByName(name) {
	  var regexS = '[\\?&]' + name + '=([^&#]*)';
	  var regex = new RegExp(regexS);
	  var results = regex.exec(window.location.search);
	  if (results === null) {
	    return '';
	  }
	
	  return decodeURIComponent(results[1].replace(/\+/g, ' '));
	};
	
	/**
	 * This function validates paramaters.
	 * @param  {object[string]} paramObj          [description]
	 * @param  {string[]} requiredParamsArr [description]
	 * @return {bool}                   Bool if paramaters are valid
	 */
	exports.hasValidBidRequest = function (paramObj, requiredParamsArr, adapter) {
	  var found = false;
	
	  function findParam(value, key) {
	    if (key === requiredParamsArr[i]) {
	      found = true;
	    }
	  }
	
	  for (var i = 0; i < requiredParamsArr.length; i++) {
	    found = false;
	
	    this._each(paramObj, findParam);
	
	    if (!found) {
	      this.logError('Params are missing for bid request. One of these required paramaters are missing: ' + requiredParamsArr, adapter);
	      return false;
	    }
	  }
	
	  return true;
	};
	
	// Handle addEventListener gracefully in older browsers
	exports.addEventHandler = function (element, event, func) {
	  if (element.addEventListener) {
	    element.addEventListener(event, func, true);
	  } else if (element.attachEvent) {
	    element.attachEvent('on' + event, func);
	  }
	};
	/**
	 * Return if the object is of the
	 * given type.
	 * @param {*} object to test
	 * @param {String} _t type string (e.g., Array)
	 * @return {Boolean} if object is of type _t
	 */
	exports.isA = function (object, _t) {
	  return toString.call(object) === '[object ' + _t + ']';
	};
	
	exports.isFn = function (object) {
	  return this.isA(object, t_Fn);
	};
	
	exports.isStr = function (object) {
	  return this.isA(object, t_Str);
	};
	
	exports.isArray = function (object) {
	  return this.isA(object, t_Arr);
	};
	
	exports.isNumber = function (object) {
	  return this.isA(object, t_Numb);
	};
	
	/**
	 * Return if the object is "empty";
	 * this includes falsey, no keys, or no items at indices
	 * @param {*} object object to test
	 * @return {Boolean} if object is empty
	 */
	exports.isEmpty = function (object) {
	  if (!object) return true;
	  if (this.isArray(object) || this.isStr(object)) {
	    return !(object.length > 0); // jshint ignore:line
	  }
	
	  for (var k in object) {
	    if (hasOwnProperty.call(object, k)) return false;
	  }
	
	  return true;
	};
	
	/**
	 * Return if string is empty, null, or undefined
	 * @param str string to test
	 * @returns {boolean} if string is empty
	 */
	exports.isEmptyStr = function (str) {
	  return this.isStr(str) && (!str || 0 === str.length);
	};
	
	/**
	 * Iterate object with the function
	 * falls back to es5 `forEach`
	 * @param {Array|Object} object
	 * @param {Function(value, key, object)} fn
	 */
	exports._each = function (object, fn) {
	  if (this.isEmpty(object)) return;
	  if (this.isFn(object.forEach)) return object.forEach(fn, this);
	
	  var k = 0;
	  var l = object.length;
	
	  if (l > 0) {
	    for (; k < l; k++) {
	      fn(object[k], k, object);
	    }
	  } else {
	    for (k in object) {
	      if (hasOwnProperty.call(object, k)) fn.call(this, object[k], k);
	    }
	  }
	};
	
	exports.contains = function (a, obj) {
	  if (this.isEmpty(a)) {
	    return false;
	  }
	
	  if (this.isFn(a.indexOf)) {
	    return a.indexOf(obj) !== -1;
	  }
	
	  var i = a.length;
	  while (i--) {
	    if (a[i] === obj) {
	      return true;
	    }
	  }
	
	  return false;
	};
	
	exports.indexOf = function () {
	  if (Array.prototype.indexOf) {
	    return Array.prototype.indexOf;
	  }
	
	  // ie8 no longer supported
	  //return polyfills.indexOf;
	}();
	
	/**
	 * Map an array or object into another array
	 * given a function
	 * @param {Array|Object} object
	 * @param {Function(value, key, object)} callback
	 * @return {Array}
	 */
	exports._map = function (object, callback) {
	  if (this.isEmpty(object)) return [];
	  if (this.isFn(object.map)) return object.map(callback);
	  var output = [];
	  this._each(object, function (value, key) {
	    output.push(callback(value, key, object));
	  });
	
	  return output;
	};
	
	var hasOwn = function hasOwn(objectToCheck, propertyToCheckFor) {
	  if (objectToCheck.hasOwnProperty) {
	    return objectToCheck.hasOwnProperty(propertyToCheckFor);
	  } else {
	    return typeof objectToCheck[propertyToCheckFor] !== 'undefined' && objectToCheck.constructor.prototype[propertyToCheckFor] !== objectToCheck[propertyToCheckFor];
	  }
	};
	/**
	 * Creates a snippet of HTML that retrieves the specified `url`
	 * @param  {string} url URL to be requested
	 * @return {string}     HTML snippet that contains the img src = set to `url`
	 */
	exports.createTrackPixelHtml = function (url) {
	  if (!url) {
	    return '';
	  }
	
	  var escapedUrl = encodeURI(url);
	  var img = '<div style="position:absolute;left:0px;top:0px;visibility:hidden;">';
	  img += '<img src="' + escapedUrl + '"></div>';
	  return img;
	};
	
	/**
	 * Creates a snippet of Iframe HTML that retrieves the specified `url`
	 * @param  {string} url plain URL to be requested
	 * @return {string}     HTML snippet that contains the iframe src = set to `url`
	 */
	exports.createTrackPixelIframeHtml = function (url) {
	  if (!url) {
	    return '';
	  }
	
	  return '<iframe frameborder="0" allowtransparency="true" marginheight="0" marginwidth="0" width="0" hspace="0" vspace="0" height="0" style="height:0p;width:0p;display:none;" scrolling="no" src="' + encodeURI(url) + '"></iframe>';
	};
	
	/**
	 * Returns iframe document in a browser agnostic way
	 * @param  {object} iframe reference
	 * @return {object}        iframe `document` reference
	 */
	exports.getIframeDocument = function (iframe) {
	  if (!iframe) {
	    return;
	  }
	
	  var doc = void 0;
	  try {
	    if (iframe.contentWindow) {
	      doc = iframe.contentWindow.document;
	    } else if (iframe.contentDocument.document) {
	      doc = iframe.contentDocument.document;
	    } else {
	      doc = iframe.contentDocument;
	    }
	  } catch (e) {
	    this.logError('Cannot get iframe document', e);
	  }
	
	  return doc;
	};
	
	exports.getValueString = function (param, val, defaultValue) {
	  if (val === undefined || val === null) {
	    return defaultValue;
	  }
	  if (this.isStr(val)) {
	    return val;
	  }
	  if (this.isNumber(val)) {
	    return val.toString();
	  }
	  this.logWarn('Unsuported type for param: ' + param + ' required type: String');
	};
	
	function uniques(value, index, arry) {
	  return arry.indexOf(value) === index;
	}
	
	function flatten(a, b) {
	  return a.concat(b);
	}
	
	function getBidRequest(id) {
	  return pbjs._bidsRequested.map(function (bidSet) {
	    return bidSet.bids.find(function (bid) {
	      return bid.bidId === id;
	    });
	  }).find(function (bid) {
	    return bid;
	  });
	}
	
	function getKeys(obj) {
	  return Object.keys(obj);
	}
	
	function getValue(obj, key) {
	  return obj[key];
	}
	
	function getBidderCodes() {
	  var adUnits = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : pbjs.adUnits;
	
	  // this could memoize adUnits
	  return adUnits.map(function (unit) {
	    return unit.bids.map(function (bid) {
	      return bid.bidder;
	    }).reduce(flatten, []);
	  }).reduce(flatten).filter(uniques);
	}
	
	function isGptPubadsDefined() {
	  if (window.googletag && exports.isFn(window.googletag.pubads) && exports.isFn(window.googletag.pubads().getSlots)) {
	    return true;
	  }
	}
	
	function getHighestCpm(previous, current) {
	  if (previous.cpm === current.cpm) {
	    return previous.timeToRespond > current.timeToRespond ? current : previous;
	  }
	
	  return previous.cpm < current.cpm ? current : previous;
	}
	
	/**
	 * Fisher–Yates shuffle
	 * http://stackoverflow.com/a/6274398
	 * https://bost.ocks.org/mike/shuffle/
	 * istanbul ignore next
	 */
	function shuffle(array) {
	  var counter = array.length;
	
	  // while there are elements in the array
	  while (counter > 0) {
	    // pick a random index
	    var index = Math.floor(Math.random() * counter);
	
	    // decrease counter by 1
	    counter--;
	
	    // and swap the last element with it
	    var temp = array[counter];
	    array[counter] = array[index];
	    array[index] = temp;
	  }
	
	  return array;
	}
	
	function adUnitsFilter(filter, bid) {
	  return filter.includes(bid && bid.placementCode || bid && bid.adUnitCode);
	}

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = {
		"JSON_MAPPING": {
			"PL_CODE": "code",
			"PL_SIZE": "sizes",
			"PL_BIDS": "bids",
			"BD_BIDDER": "bidder",
			"BD_ID": "paramsd",
			"BD_PL_ID": "placementId",
			"ADSERVER_TARGETING": "adserverTargeting",
			"BD_SETTING_STANDARD": "standard"
		},
		"REPO_AND_VERSION": "prebid_prebid_0.20.0-pre",
		"DEBUG_MODE": "pbjs_debug",
		"STATUS": {
			"GOOD": 1,
			"NO_BID": 2
		},
		"CB": {
			"TYPE": {
				"ALL_BIDS_BACK": "allRequestedBidsBack",
				"AD_UNIT_BIDS_BACK": "adUnitBidsBack",
				"BID_WON": "bidWon",
				"REQUEST_BIDS": "requestBids"
			}
		},
		"objectType_function": "function",
		"objectType_undefined": "undefined",
		"objectType_object": "object",
		"objectType_string": "string",
		"objectType_number": "number",
		"EVENTS": {
			"AUCTION_INIT": "auctionInit",
			"AUCTION_END": "auctionEnd",
			"BID_ADJUSTMENT": "bidAdjustment",
			"BID_TIMEOUT": "bidTimeout",
			"BID_REQUESTED": "bidRequested",
			"BID_RESPONSE": "bidResponse",
			"BID_WON": "bidWon",
			"SET_TARGETING": "setTargeting",
			"REQUEST_BIDS": "requestBids"
		},
		"EVENT_ID_PATHS": {
			"bidWon": "adUnitCode"
		},
		"ORDER": {
			"RANDOM": "random"
		},
		"GRANULARITY_OPTIONS": {
			"LOW": "low",
			"MEDIUM": "medium",
			"HIGH": "high",
			"AUTO": "auto",
			"DENSE": "dense",
			"CUSTOM": "custom"
		},
		"TARGETING_KEYS": [
			"hb_bidder",
			"hb_adid",
			"hb_pb",
			"hb_size",
			"hb_deal"
		]
	};

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.hasNonVideoBidder = exports.videoAdUnit = undefined;
	
	var _adaptermanager = __webpack_require__(5);
	
	/**
	 * Helper functions for working with video-enabled adUnits
	 */
	var videoAdUnit = exports.videoAdUnit = function videoAdUnit(adUnit) {
	  return adUnit.mediaType === 'video';
	};
	var nonVideoBidder = function nonVideoBidder(bid) {
	  return !_adaptermanager.videoAdapters.includes(bid.bidder);
	};
	var hasNonVideoBidder = exports.hasNonVideoBidder = function hasNonVideoBidder(adUnit) {
	  return adUnit.bids.filter(nonVideoBidder).length;
	};

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /** @module adaptermanger */
	
	var _utils = __webpack_require__(2);
	
	var _sizeMapping = __webpack_require__(6);
	
	var _baseAdapter = __webpack_require__(7);
	
	var utils = __webpack_require__(2);
	var CONSTANTS = __webpack_require__(3);
	var events = __webpack_require__(8);
	
	
	var _bidderRegistry = {};
	exports.bidderRegistry = _bidderRegistry;
	
	var _analyticsRegistry = {};
	var _bidderSequence = null;
	
	function getBids(_ref) {
	  var bidderCode = _ref.bidderCode,
	      requestId = _ref.requestId,
	      bidderRequestId = _ref.bidderRequestId,
	      adUnits = _ref.adUnits;
	
	  return adUnits.map(function (adUnit) {
	    return adUnit.bids.filter(function (bid) {
	      return bid.bidder === bidderCode;
	    }).map(function (bid) {
	      var sizes = adUnit.sizes;
	      if (adUnit.sizeMapping) {
	        var sizeMapping = (0, _sizeMapping.mapSizes)(adUnit);
	        if (sizeMapping === '') {
	          return '';
	        }
	        sizes = sizeMapping;
	      }
	      return _extends(bid, {
	        placementCode: adUnit.code,
	        mediaType: adUnit.mediaType,
	        sizes: sizes,
	        bidId: utils.getUniqueIdentifierStr(),
	        bidderRequestId: bidderRequestId,
	        requestId: requestId
	      });
	    });
	  }).reduce(_utils.flatten, []).filter(function (val) {
	    return val !== '';
	  });
	}
	
	exports.callBids = function (_ref2) {
	  var adUnits = _ref2.adUnits,
	      cbTimeout = _ref2.cbTimeout;
	
	  var requestId = utils.generateUUID();
	  var auctionStart = Date.now();
	
	  var auctionInit = {
	    timestamp: auctionStart,
	    requestId: requestId
	  };
	  events.emit(CONSTANTS.EVENTS.AUCTION_INIT, auctionInit);
	
	  var bidderCodes = (0, _utils.getBidderCodes)(adUnits);
	  if (_bidderSequence === CONSTANTS.ORDER.RANDOM) {
	    bidderCodes = (0, _utils.shuffle)(bidderCodes);
	  }
	
	  bidderCodes.forEach(function (bidderCode) {
	    var adapter = _bidderRegistry[bidderCode];
	    if (adapter) {
	      var bidderRequestId = utils.getUniqueIdentifierStr();
	      var bidderRequest = {
	        bidderCode: bidderCode,
	        requestId: requestId,
	        bidderRequestId: bidderRequestId,
	        bids: getBids({ bidderCode: bidderCode, requestId: requestId, bidderRequestId: bidderRequestId, adUnits: adUnits }),
	        start: new Date().getTime(),
	        auctionStart: auctionStart,
	        timeout: cbTimeout
	      };
	      if (bidderRequest.bids && bidderRequest.bids.length !== 0) {
	        utils.logMessage('CALLING BIDDER ======= ' + bidderCode);
	        pbjs._bidsRequested.push(bidderRequest);
	        events.emit(CONSTANTS.EVENTS.BID_REQUESTED, bidderRequest);
	        adapter.callBids(bidderRequest);
	      }
	    } else {
	      utils.logError('Adapter trying to be called which does not exist: ' + bidderCode + ' adaptermanager.callBids');
	    }
	  });
	};
	
	exports.registerBidAdapter = function (bidAdaptor, bidderCode) {
	  if (bidAdaptor && bidderCode) {
	
	    if (_typeof(bidAdaptor.callBids) === CONSTANTS.objectType_function) {
	      _bidderRegistry[bidderCode] = bidAdaptor;
	    } else {
	      utils.logError('Bidder adaptor error for bidder code: ' + bidderCode + 'bidder must implement a callBids() function');
	    }
	  } else {
	    utils.logError('bidAdaptor or bidderCode not specified');
	  }
	};
	
	exports.aliasBidAdapter = function (bidderCode, alias) {
	  var existingAlias = _bidderRegistry[alias];
	
	  if ((typeof existingAlias === 'undefined' ? 'undefined' : _typeof(existingAlias)) === CONSTANTS.objectType_undefined) {
	    var bidAdaptor = _bidderRegistry[bidderCode];
	
	    if ((typeof bidAdaptor === 'undefined' ? 'undefined' : _typeof(bidAdaptor)) === CONSTANTS.objectType_undefined) {
	      utils.logError('bidderCode "' + bidderCode + '" is not an existing bidder.', 'adaptermanager.aliasBidAdapter');
	    } else {
	      try {
	        var newAdapter = null;
	        if (bidAdaptor instanceof _baseAdapter.BaseAdapter) {
	          //newAdapter = new bidAdaptor.constructor(alias);
	          utils.logError(bidderCode + ' bidder does not currently support aliasing.', 'adaptermanager.aliasBidAdapter');
	        } else {
	          newAdapter = bidAdaptor.createNew();
	          newAdapter.setBidderCode(alias);
	          this.registerBidAdapter(newAdapter, alias);
	        }
	      } catch (e) {
	        utils.logError(bidderCode + ' bidder does not currently support aliasing.', 'adaptermanager.aliasBidAdapter');
	      }
	    }
	  } else {
	    utils.logMessage('alias name "' + alias + '" has been already specified.');
	  }
	};
	
	exports.registerAnalyticsAdapter = function (_ref3) {
	  var adapter = _ref3.adapter,
	      code = _ref3.code;
	
	  if (adapter && code) {
	
	    if (_typeof(adapter.enableAnalytics) === CONSTANTS.objectType_function) {
	      adapter.code = code;
	      _analyticsRegistry[code] = adapter;
	    } else {
	      utils.logError('Prebid Error: Analytics adaptor error for analytics "' + code + '"\n        analytics adapter must implement an enableAnalytics() function');
	    }
	  } else {
	    utils.logError('Prebid Error: analyticsAdapter or analyticsCode not specified');
	  }
	};
	
	exports.enableAnalytics = function (config) {
	  if (!utils.isArray(config)) {
	    config = [config];
	  }
	
	  utils._each(config, function (adapterConfig) {
	    var adapter = _analyticsRegistry[adapterConfig.provider];
	    if (adapter) {
	      adapter.enableAnalytics(adapterConfig);
	    } else {
	      utils.logError('Prebid Error: no analytics adapter found in registry for\n        ' + adapterConfig.provider + '.');
	    }
	  });
	};
	
	exports.setBidderSequence = function (order) {
	  _bidderSequence = order;
	};
	
	var AdmicroAdapter = __webpack_require__(9);
	exports.registerBidAdapter(new AdmicroAdapter(), 'admicro');
	exports.videoAdapters = [];
	
	null;

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.setWindow = exports.getScreenWidth = exports.mapSizes = undefined;
	
	var _utils = __webpack_require__(2);
	
	var utils = _interopRequireWildcard(_utils);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	var _win = void 0; /**
	                    * @module sizeMapping
	                    */
	
	
	function mapSizes(adUnit) {
	  if (!isSizeMappingValid(adUnit.sizeMapping)) {
	    return adUnit.sizes;
	  }
	  var width = getScreenWidth();
	  if (!width) {
	    //size not detected - get largest value set for desktop
	    var _mapping = adUnit.sizeMapping.reduce(function (prev, curr) {
	      return prev.minWidth < curr.minWidth ? curr : prev;
	    });
	    if (_mapping.sizes) {
	      return _mapping.sizes;
	    }
	    return adUnit.sizes;
	  }
	  var sizes = '';
	  var mapping = adUnit.sizeMapping.find(function (sizeMapping) {
	    return width > sizeMapping.minWidth;
	  });
	  if (mapping && mapping.sizes) {
	    sizes = mapping.sizes;
	    utils.logMessage('AdUnit : ' + adUnit.code + ' resized based on device width to : ' + sizes);
	  } else {
	    utils.logMessage('AdUnit : ' + adUnit.code + ' not mapped to any sizes for device width. This request will be suppressed.');
	  }
	  return sizes;
	}
	
	function isSizeMappingValid(sizeMapping) {
	  if (utils.isArray(sizeMapping) && sizeMapping.length > 0) {
	    return true;
	  }
	  utils.logInfo('No size mapping defined');
	  return false;
	}
	
	function getScreenWidth(win) {
	  var w = win || _win || window;
	  var d = w.document;
	
	  if (w.innerWidth) {
	    return w.innerWidth;
	  } else if (d.body.clientWidth) {
	    return d.body.clientWidth;
	  } else if (d.documentElement.clientWidth) {
	    return d.documentElement.clientWidth;
	  }
	  return 0;
	}
	
	function setWindow(win) {
	  _win = win;
	}
	
	exports.mapSizes = mapSizes;
	exports.getScreenWidth = getScreenWidth;
	exports.setWindow = setWindow;

/***/ },
/* 7 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var BaseAdapter = exports.BaseAdapter = function () {
	  function BaseAdapter(code) {
	    _classCallCheck(this, BaseAdapter);
	
	    this.code = code;
	  }
	
	  _createClass(BaseAdapter, [{
	    key: 'getCode',
	    value: function getCode() {
	      return this.code;
	    }
	  }, {
	    key: 'setCode',
	    value: function setCode(code) {
	      this.code = code;
	    }
	  }, {
	    key: 'callBids',
	    value: function callBids() {
	      throw 'adapter implementation must override callBids method';
	    }
	  }]);

	  return BaseAdapter;
	}();

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	/**
	 * events.js
	 */
	var utils = __webpack_require__(2);
	var CONSTANTS = __webpack_require__(3);
	var slice = Array.prototype.slice;
	var push = Array.prototype.push;
	
	//define entire events
	//var allEvents = ['bidRequested','bidResponse','bidWon','bidTimeout'];
	var allEvents = utils._map(CONSTANTS.EVENTS, function (v) {
	  return v;
	});
	
	var idPaths = CONSTANTS.EVENT_ID_PATHS;
	
	//keep a record of all events fired
	var eventsFired = [];
	
	module.exports = function () {
	
	  var _handlers = {};
	  var _public = {};
	
	  /**
	   *
	   * @param {String} eventString  The name of the event.
	   * @param {Array} args  The payload emitted with the event.
	   * @private
	   */
	  function _dispatch(eventString, args) {
	    utils.logMessage('Emitting event for: ' + eventString);
	
	    var eventPayload = args[0] || {};
	    var idPath = idPaths[eventString];
	    var key = eventPayload[idPath];
	    var event = _handlers[eventString] || { que: [] };
	    var eventKeys = utils._map(event, function (v, k) {
	      return k;
	    });
	
	    var callbacks = [];
	
	    //record the event:
	    eventsFired.push({
	      eventType: eventString,
	      args: eventPayload,
	      id: key
	    });
	
	    /** Push each specific callback to the `callbacks` array.
	     * If the `event` map has a key that matches the value of the
	     * event payload id path, e.g. `eventPayload[idPath]`, then apply
	     * each function in the `que` array as an argument to push to the
	     * `callbacks` array
	     * */
	    if (key && utils.contains(eventKeys, key)) {
	      push.apply(callbacks, event[key].que);
	    }
	
	    /** Push each general callback to the `callbacks` array. */
	    push.apply(callbacks, event.que);
	
	    /** call each of the callbacks */
	    utils._each(callbacks, function (fn) {
	      if (!fn) return;
	      try {
	        fn.apply(null, args);
	      } catch (e) {
	        utils.logError('Error executing handler:', 'events.js', e);
	      }
	    });
	  }
	
	  function _checkAvailableEvent(event) {
	    return utils.contains(allEvents, event);
	  }
	
	  _public.on = function (eventString, handler, id) {
	
	    //check whether available event or not
	    if (_checkAvailableEvent(eventString)) {
	      var event = _handlers[eventString] || { que: [] };
	
	      if (id) {
	        event[id] = event[id] || { que: [] };
	        event[id].que.push(handler);
	      } else {
	        event.que.push(handler);
	      }
	
	      _handlers[eventString] = event;
	    } else {
	      utils.logError('Wrong event name : ' + eventString + ' Valid event names :' + allEvents);
	    }
	  };
	
	  _public.emit = function (event) {
	    var args = slice.call(arguments, 1);
	    _dispatch(event, args);
	  };
	
	  _public.off = function (eventString, handler, id) {
	    var event = _handlers[eventString];
	
	    if (utils.isEmpty(event) || utils.isEmpty(event.que) && utils.isEmpty(event[id])) {
	      return;
	    }
	
	    if (id && (utils.isEmpty(event[id]) || utils.isEmpty(event[id].que))) {
	      return;
	    }
	
	    if (id) {
	      utils._each(event[id].que, function (_handler) {
	        var que = event[id].que;
	        if (_handler === handler) {
	          que.splice(utils.indexOf.call(que, _handler), 1);
	        }
	      });
	    } else {
	      utils._each(event.que, function (_handler) {
	        var que = event.que;
	        if (_handler === handler) {
	          que.splice(utils.indexOf.call(que, _handler), 1);
	        }
	      });
	    }
	
	    _handlers[eventString] = event;
	  };
	
	  _public.get = function () {
	    return _handlers;
	  };
	
	  /**
	   * This method can return a copy of all the events fired
	   * @return {Array} array of events fired
	   */
	  _public.getEvents = function () {
	    var arrayCopy = [];
	    utils._each(eventsFired, function (value) {
	      var newProp = utils.extend({}, value);
	      arrayCopy.push(newProp);
	    });
	
	    return arrayCopy;
	  };
	
	  return _public;
	}();

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _bidfactory = __webpack_require__(10);
	
	var _bidfactory2 = _interopRequireDefault(_bidfactory);
	
	var _bidmanager = __webpack_require__(11);
	
	var _bidmanager2 = _interopRequireDefault(_bidmanager);
	
	var _ajax = __webpack_require__(13);
	
	var _utils = __webpack_require__(2);
	
	var utils = _interopRequireWildcard(_utils);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	var AdmicroAdapter = function AdmicroAdapter() {
	
	  /**
	   * Default function for call bids
	   * @param  {object} params  all params
	   * @return {void}           void function
	   */
	  function _callBids(params) {
	    var bids = params.bids || [];
	
	    _requestBids(bids);
	  }
	
	  /**
	   * Call bids requests
	   * @param  {array} bids   array of bids objects
	   * @return {void}         void function
	   */
	  function _requestBids(bids) {
	    utils.logInfo('Bids object', bids);
	
	    for (var i = 0; i < bids.length; i++) {
	      var bid = bids[i];
	      utils.logInfo('Current bid object', bid);
	
	      _request(bid);
	    }
	  }
	
	  /**
	   * Send AJAX request to SSP Service
	   * @param  {object} bid   single bid object
	   * @return {void}         void function
	   */
	  function _request(bid) {
	    (0, _ajax.ajax)(
	    // URL
	    '//sspapi.admicro.vn/ssp_request',
	    // Callback
	    function (responseText, response) {
	      utils.logInfo('Admicro SSP response', response);
	
	      var ads = JSON.parse(responseText);
	      var bidObject = _bidfactory2['default'].createBid(1);
	
	      bidObject.bidderCode = bid.bidder;
	      bidObject.cpm = ads.cpm;
	      bidObject.ad = ads.src;
	      bidObject.width = ads.width;
	      bidObject.height = ads.height;
	
	      utils.logInfo('AdMicro Ads', bidObject);
	
	      _bidmanager2['default'].addBidResponse(bid.placementCode, bidObject);
	    },
	    // Query params
	    bid.params,
	    // AJAX options
	    // .method - use GET or POST is okay
	    // .contentType and .preflight is for preventing preflight requests by CORS
	    {
	      method: 'GET',
	      contentType: 'application/x-www-form-urlencoded',
	      preflight: false
	    });
	  }
	
	  // Export the callBids function, so that prebid.js can execute this function
	  // when the page asks to send out bid requests.
	  return {
	    callBids: _callBids
	  };
	};
	
	module.exports = AdmicroAdapter;

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(2);
	
	/**
	 Required paramaters
	 bidderCode,
	 height,
	 width,
	 statusCode
	 Optional paramaters
	 adId,
	 cpm,
	 ad,
	 adUrl,
	 dealId,
	 priceKeyString;
	 */
	function Bid(statusCode, bidRequest) {
	  var _bidId = bidRequest && bidRequest.bidId || utils.getUniqueIdentifierStr();
	  var _statusCode = statusCode || 0;
	
	  this.bidderCode = '';
	  this.width = 0;
	  this.height = 0;
	  this.statusMessage = _getStatus();
	  this.adId = _bidId;
	
	  function _getStatus() {
	    switch (_statusCode) {
	      case 0:
	        return 'Pending';
	      case 1:
	        return 'Bid available';
	      case 2:
	        return 'Bid returned empty or error response';
	      case 3:
	        return 'Bid timed out';
	    }
	  }
	
	  this.getStatusCode = function () {
	    return _statusCode;
	  };
	
	  //returns the size of the bid creative. Concatenation of width and height by ‘x’.
	  this.getSize = function () {
	    return this.width + 'x' + this.height;
	  };
	}
	
	// Bid factory function.
	exports.createBid = function () {
	  return new (Function.prototype.bind.apply(Bid, [null].concat(Array.prototype.slice.call(arguments))))();
	};

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _utils = __webpack_require__(2);
	
	var _cpmBucketManager = __webpack_require__(12);
	
	var CONSTANTS = __webpack_require__(3);
	var AUCTION_END = CONSTANTS.EVENTS.AUCTION_END;
	var utils = __webpack_require__(2);
	var events = __webpack_require__(8);
	
	var objectType_function = 'function';
	
	var externalCallbacks = { byAdUnit: [], all: [], oneTime: null, timer: false };
	var _granularity = CONSTANTS.GRANULARITY_OPTIONS.MEDIUM;
	var _customPriceBucket = void 0;
	var defaultBidderSettingsMap = {};
	
	exports.setCustomPriceBucket = function (customConfig) {
	  _customPriceBucket = customConfig;
	};
	
	/**
	 * Returns a list of bidders that we haven't received a response yet
	 * @return {array} [description]
	 */
	exports.getTimedOutBidders = function () {
	  return pbjs._bidsRequested.map(getBidderCode).filter(_utils.uniques).filter(function (bidder) {
	    return pbjs._bidsReceived.map(getBidders).filter(_utils.uniques).indexOf(bidder) < 0;
	  });
	};
	
	function timestamp() {
	  return new Date().getTime();
	}
	
	function getBidderCode(bidSet) {
	  return bidSet.bidderCode;
	}
	
	function getBidders(bid) {
	  return bid.bidder;
	}
	
	function bidsBackAdUnit(adUnitCode) {
	  var _this = this;
	
	  var requested = pbjs._bidsRequested.map(function (request) {
	    return request.bids.filter(_utils.adUnitsFilter.bind(_this, pbjs._adUnitCodes)).filter(function (bid) {
	      return bid.placementCode === adUnitCode;
	    });
	  }).reduce(_utils.flatten, []).map(function (bid) {
	    return bid.bidder === 'indexExchange' ? bid.sizes.length : 1;
	  }).reduce(add, 0);
	
	  var received = pbjs._bidsReceived.filter(function (bid) {
	    return bid.adUnitCode === adUnitCode;
	  }).length;
	  return requested === received;
	}
	
	function add(a, b) {
	  return a + b;
	}
	
	function bidsBackAll() {
	  var requested = pbjs._bidsRequested.map(function (request) {
	    return request.bids;
	  }).reduce(_utils.flatten, []).filter(_utils.adUnitsFilter.bind(this, pbjs._adUnitCodes)).map(function (bid) {
	    return bid.bidder === 'indexExchange' ? bid.sizes.length : 1;
	  }).reduce(function (a, b) {
	    return a + b;
	  }, 0);
	
	  var received = pbjs._bidsReceived.filter(_utils.adUnitsFilter.bind(this, pbjs._adUnitCodes)).length;
	
	  return requested === received;
	}
	
	exports.bidsBackAll = function () {
	  return bidsBackAll();
	};
	
	function getBidderRequest(bidder, adUnitCode) {
	  return pbjs._bidsRequested.find(function (request) {
	    return request.bids.filter(function (bid) {
	      return bid.bidder === bidder && bid.placementCode === adUnitCode;
	    }).length > 0;
	  }) || { start: null, requestId: null };
	}
	
	/*
	 *   This function should be called to by the bidder adapter to register a bid response
	 */
	exports.addBidResponse = function (adUnitCode, bid) {
	  if (!adUnitCode) {
	    utils.logWarn('No adUnitCode supplied to addBidResponse, response discarded');
	    return;
	  }
	
	  if (bid) {
	    var _getBidderRequest = getBidderRequest(bid.bidderCode, adUnitCode),
	        requestId = _getBidderRequest.requestId,
	        start = _getBidderRequest.start;
	
	    _extends(bid, {
	      requestId: requestId,
	      responseTimestamp: timestamp(),
	      requestTimestamp: start,
	      cpm: bid.cpm || 0,
	      bidder: bid.bidderCode,
	      adUnitCode: adUnitCode
	    });
	
	    bid.timeToRespond = bid.responseTimestamp - bid.requestTimestamp;
	
	    if (bid.timeToRespond > pbjs.cbTimeout + pbjs.timeoutBuffer) {
	      var timedOut = true;
	
	      exports.executeCallback(timedOut);
	    }
	
	    //emit the bidAdjustment event before bidResponse, so bid response has the adjusted bid value
	    events.emit(CONSTANTS.EVENTS.BID_ADJUSTMENT, bid);
	
	    //emit the bidResponse event
	    events.emit(CONSTANTS.EVENTS.BID_RESPONSE, bid);
	
	    //append price strings
	    var priceStringsObj = (0, _cpmBucketManager.getPriceBucketString)(bid.cpm, _customPriceBucket);
	    bid.pbLg = priceStringsObj.low;
	    bid.pbMg = priceStringsObj.med;
	    bid.pbHg = priceStringsObj.high;
	    bid.pbAg = priceStringsObj.auto;
	    bid.pbDg = priceStringsObj.dense;
	    bid.pbCg = priceStringsObj.custom;
	
	    //if there is any key value pairs to map do here
	    var keyValues = {};
	    if (bid.bidderCode && bid.cpm > 0) {
	      keyValues = getKeyValueTargetingPairs(bid.bidderCode, bid);
	    }
	
	    bid.adserverTargeting = keyValues;
	    pbjs._bidsReceived.push(bid);
	  }
	
	  if (bid && bid.adUnitCode && bidsBackAdUnit(bid.adUnitCode)) {
	    triggerAdUnitCallbacks(bid.adUnitCode);
	  }
	
	  if (bidsBackAll()) {
	    exports.executeCallback();
	  }
	};
	
	function getKeyValueTargetingPairs(bidderCode, custBidObj) {
	  var keyValues = {};
	  var bidder_settings = pbjs.bidderSettings;
	
	  //1) set the keys from "standard" setting or from prebid defaults
	  if (custBidObj && bidder_settings) {
	    //initialize default if not set
	    var standardSettings = getStandardBidderSettings();
	    setKeys(keyValues, standardSettings, custBidObj);
	  }
	
	  //2) set keys from specific bidder setting override if they exist
	  if (bidderCode && custBidObj && bidder_settings && bidder_settings[bidderCode] && bidder_settings[bidderCode][CONSTANTS.JSON_MAPPING.ADSERVER_TARGETING]) {
	    setKeys(keyValues, bidder_settings[bidderCode], custBidObj);
	    custBidObj.alwaysUseBid = bidder_settings[bidderCode].alwaysUseBid;
	    custBidObj.sendStandardTargeting = bidder_settings[bidderCode].sendStandardTargeting;
	  }
	
	  //2) set keys from standard setting. NOTE: this API doesn't seem to be in use by any Adapter
	  else if (defaultBidderSettingsMap[bidderCode]) {
	      setKeys(keyValues, defaultBidderSettingsMap[bidderCode], custBidObj);
	      custBidObj.alwaysUseBid = defaultBidderSettingsMap[bidderCode].alwaysUseBid;
	      custBidObj.sendStandardTargeting = defaultBidderSettingsMap[bidderCode].sendStandardTargeting;
	    }
	
	  return keyValues;
	}
	
	exports.getKeyValueTargetingPairs = function () {
	  return getKeyValueTargetingPairs.apply(undefined, arguments);
	};
	
	function setKeys(keyValues, bidderSettings, custBidObj) {
	  var targeting = bidderSettings[CONSTANTS.JSON_MAPPING.ADSERVER_TARGETING];
	  custBidObj.size = custBidObj.getSize();
	
	  utils._each(targeting, function (kvPair) {
	    var key = kvPair.key;
	    var value = kvPair.val;
	
	    if (keyValues[key]) {
	      utils.logWarn('The key: ' + key + ' is getting ovewritten');
	    }
	
	    if (utils.isFn(value)) {
	      try {
	        value = value(custBidObj);
	      } catch (e) {
	        utils.logError('bidmanager', 'ERROR', e);
	      }
	    }
	
	    if ((typeof bidderSettings.suppressEmptyKeys !== "undefined" && bidderSettings.suppressEmptyKeys === true || key === "hb_deal") && ( // hb_deal is suppressed automatically if not set
	    utils.isEmptyStr(value) || value === null || value === undefined)) {
	      utils.logInfo("suppressing empty key '" + key + "' from adserver targeting");
	    } else {
	      keyValues[key] = value;
	    }
	  });
	
	  return keyValues;
	}
	
	exports.setPriceGranularity = function setPriceGranularity(granularity) {
	  var granularityOptions = CONSTANTS.GRANULARITY_OPTIONS;
	  if (Object.keys(granularityOptions).filter(function (option) {
	    return granularity === granularityOptions[option];
	  })) {
	    _granularity = granularity;
	  } else {
	    utils.logWarn('Prebid Warning: setPriceGranularity was called with invalid setting, using' + ' `medium` as default.');
	    _granularity = CONSTANTS.GRANULARITY_OPTIONS.MEDIUM;
	  }
	};
	
	exports.registerDefaultBidderSetting = function (bidderCode, defaultSetting) {
	  defaultBidderSettingsMap[bidderCode] = defaultSetting;
	};
	
	exports.executeCallback = function (timedOut) {
	  // if there's still a timeout running, clear it now
	  if (!timedOut && externalCallbacks.timer) {
	    clearTimeout(externalCallbacks.timer);
	  }
	
	  if (externalCallbacks.all.called !== true) {
	    processCallbacks(externalCallbacks.all);
	    externalCallbacks.all.called = true;
	
	    if (timedOut) {
	      var timedOutBidders = exports.getTimedOutBidders();
	
	      if (timedOutBidders.length) {
	        events.emit(CONSTANTS.EVENTS.BID_TIMEOUT, timedOutBidders);
	      }
	    }
	  }
	
	  //execute one time callback
	  if (externalCallbacks.oneTime) {
	    events.emit(AUCTION_END);
	    try {
	      processCallbacks([externalCallbacks.oneTime]);
	    } catch (e) {
	      utils.logError('Error executing bidsBackHandler', null, e);
	    } finally {
	      externalCallbacks.oneTime = null;
	      externalCallbacks.timer = false;
	      pbjs.clearAuction();
	    }
	  }
	};
	
	exports.externalCallbackReset = function () {
	  externalCallbacks.all.called = false;
	};
	
	function triggerAdUnitCallbacks(adUnitCode) {
	  //todo : get bid responses and send in args
	  var singleAdUnitCode = [adUnitCode];
	  processCallbacks(externalCallbacks.byAdUnit, singleAdUnitCode);
	}
	
	function processCallbacks(callbackQueue, singleAdUnitCode) {
	  var _this2 = this;
	
	  if (utils.isArray(callbackQueue)) {
	    callbackQueue.forEach(function (callback) {
	      var adUnitCodes = singleAdUnitCode || pbjs._adUnitCodes;
	      var bids = [pbjs._bidsReceived.filter(_utils.adUnitsFilter.bind(_this2, adUnitCodes)).reduce(groupByPlacement, {})];
	
	      callback.apply(pbjs, bids);
	    });
	  }
	}
	
	/**
	 * groupByPlacement is a reduce function that converts an array of Bid objects
	 * to an object with placement codes as keys, with each key representing an object
	 * with an array of `Bid` objects for that placement
	 * @returns {*} as { [adUnitCode]: { bids: [Bid, Bid, Bid] } }
	 */
	function groupByPlacement(bidsByPlacement, bid) {
	  if (!bidsByPlacement[bid.adUnitCode]) bidsByPlacement[bid.adUnitCode] = { bids: [] };
	
	  bidsByPlacement[bid.adUnitCode].bids.push(bid);
	
	  return bidsByPlacement;
	}
	
	/**
	 * Add a one time callback, that is discarded after it is called
	 * @param {Function} callback
	 * @param timer Timer to clear if callback is triggered before timer time's out
	 */
	exports.addOneTimeCallback = function (callback, timer) {
	  externalCallbacks.oneTime = callback;
	  externalCallbacks.timer = timer;
	};
	
	exports.addCallback = function (id, callback, cbEvent) {
	  callback.id = id;
	  if (CONSTANTS.CB.TYPE.ALL_BIDS_BACK === cbEvent) {
	    externalCallbacks.all.push(callback);
	  } else if (CONSTANTS.CB.TYPE.AD_UNIT_BIDS_BACK === cbEvent) {
	    externalCallbacks.byAdUnit.push(callback);
	  }
	};
	
	//register event for bid adjustment
	events.on(CONSTANTS.EVENTS.BID_ADJUSTMENT, function (bid) {
	  adjustBids(bid);
	});
	
	function adjustBids(bid) {
	  var code = bid.bidderCode;
	  var bidPriceAdjusted = bid.cpm;
	  if (code && pbjs.bidderSettings && pbjs.bidderSettings[code]) {
	    if (_typeof(pbjs.bidderSettings[code].bidCpmAdjustment) === objectType_function) {
	      try {
	        bidPriceAdjusted = pbjs.bidderSettings[code].bidCpmAdjustment.call(null, bid.cpm, utils.extend({}, bid));
	      } catch (e) {
	        utils.logError('Error during bid adjustment', 'bidmanager.js', e);
	      }
	    }
	  }
	
	  if (bidPriceAdjusted >= 0) {
	    bid.cpm = bidPriceAdjusted;
	  }
	}
	
	exports.adjustBids = function () {
	  return adjustBids.apply(undefined, arguments);
	};
	
	function getStandardBidderSettings() {
	  var bidder_settings = pbjs.bidderSettings;
	  if (!bidder_settings[CONSTANTS.JSON_MAPPING.BD_SETTING_STANDARD]) {
	    bidder_settings[CONSTANTS.JSON_MAPPING.BD_SETTING_STANDARD] = {
	      adserverTargeting: [{
	        key: 'hb_bidder',
	        val: function val(bidResponse) {
	          return bidResponse.bidderCode;
	        }
	      }, {
	        key: 'hb_adid',
	        val: function val(bidResponse) {
	          return bidResponse.adId;
	        }
	      }, {
	        key: 'hb_pb',
	        val: function val(bidResponse) {
	          if (_granularity === CONSTANTS.GRANULARITY_OPTIONS.AUTO) {
	            return bidResponse.pbAg;
	          } else if (_granularity === CONSTANTS.GRANULARITY_OPTIONS.DENSE) {
	            return bidResponse.pbDg;
	          } else if (_granularity === CONSTANTS.GRANULARITY_OPTIONS.LOW) {
	            return bidResponse.pbLg;
	          } else if (_granularity === CONSTANTS.GRANULARITY_OPTIONS.MEDIUM) {
	            return bidResponse.pbMg;
	          } else if (_granularity === CONSTANTS.GRANULARITY_OPTIONS.HIGH) {
	            return bidResponse.pbHg;
	          } else if (_granularity === CONSTANTS.GRANULARITY_OPTIONS.CUSTOM) {
	            return bidResponse.pbCg;
	          }
	        }
	      }, {
	        key: 'hb_size',
	        val: function val(bidResponse) {
	          return bidResponse.size;
	        }
	      }, {
	        key: 'hb_deal',
	        val: function val(bidResponse) {
	          return bidResponse.dealId;
	        }
	      }]
	    };
	  }
	  return bidder_settings[CONSTANTS.JSON_MAPPING.BD_SETTING_STANDARD];
	}
	
	function getStandardBidderAdServerTargeting() {
	  return getStandardBidderSettings()[CONSTANTS.JSON_MAPPING.ADSERVER_TARGETING];
	}
	
	exports.getStandardBidderAdServerTargeting = getStandardBidderAdServerTargeting;

/***/ },
/* 12 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	var _defaultPrecision = 2;
	var _lgPriceConfig = {
	  'buckets': [{
	    'min': 0,
	    'max': 5,
	    'increment': 0.5
	  }]
	};
	var _mgPriceConfig = {
	  'buckets': [{
	    'min': 0,
	    'max': 20,
	    'increment': 0.1
	  }]
	};
	var _hgPriceConfig = {
	  'buckets': [{
	    'min': 0,
	    'max': 20,
	    'increment': 0.01
	  }]
	};
	var _densePriceConfig = {
	  'buckets': [{
	    'min': 0,
	    'max': 3,
	    'increment': 0.01
	  }, {
	    'min': 3,
	    'max': 8,
	    'increment': 0.05
	  }, {
	    'min': 8,
	    'max': 20,
	    'increment': 0.5
	  }]
	};
	var _autoPriceConfig = {
	  'buckets': [{
	    'min': 0,
	    'max': 5,
	    'increment': 0.05
	  }, {
	    'min': 5,
	    'max': 10,
	    'increment': 0.1
	  }, {
	    'min': 10,
	    'max': 20,
	    'increment': 0.5
	  }]
	};
	
	function getPriceBucketString(cpm, customConfig) {
	  var cpmFloat = 0;
	  cpmFloat = parseFloat(cpm);
	  if (isNaN(cpmFloat)) {
	    cpmFloat = '';
	  }
	
	  return {
	    low: cpmFloat === '' ? '' : getCpmStringValue(cpm, _lgPriceConfig),
	    med: cpmFloat === '' ? '' : getCpmStringValue(cpm, _mgPriceConfig),
	    high: cpmFloat === '' ? '' : getCpmStringValue(cpm, _hgPriceConfig),
	    auto: cpmFloat === '' ? '' : getCpmStringValue(cpm, _autoPriceConfig),
	    dense: cpmFloat === '' ? '' : getCpmStringValue(cpm, _densePriceConfig),
	    custom: cpmFloat === '' ? '' : getCpmStringValue(cpm, customConfig)
	  };
	}
	
	function getCpmStringValue(cpm, config) {
	  var cpmStr = '';
	  if (!isValidePriceConfig(config)) {
	    return cpmStr;
	  }
	  var cap = config.buckets.reduce(function (prev, curr) {
	    if (prev.max > curr.max) {
	      return prev;
	    }
	    return curr;
	  }, {
	    'max': 0
	  });
	  var bucket = config.buckets.find(function (bucket) {
	    if (cpm > cap.max) {
	      var precision = bucket.precision || _defaultPrecision;
	      cpmStr = bucket.max.toFixed(precision);
	    } else if (cpm <= bucket.max && cpm >= bucket.min) {
	      return bucket;
	    }
	  });
	  if (bucket) {
	    cpmStr = getCpmTarget(cpm, bucket.increment, bucket.precision);
	  }
	  return cpmStr;
	}
	
	function isValidePriceConfig(config) {
	  if (!config || !config.buckets || !Array.isArray(config.buckets)) {
	    return false;
	  }
	  var isValid = true;
	  config.buckets.forEach(function (bucket) {
	    if (typeof bucket.min === 'undefined' || !bucket.max || !bucket.increment) {
	      isValid = false;
	    }
	  });
	  return isValid;
	}
	
	function getCpmTarget(cpm, increment, precision) {
	  if (!precision) {
	    precision = _defaultPrecision;
	  }
	  var bucketSize = 1 / increment;
	  return (Math.floor(cpm * bucketSize) / bucketSize).toFixed(precision);
	}
	
	exports.getPriceBucketString = getPriceBucketString;
	exports.isValidePriceConfig = isValidePriceConfig;

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	exports.ajax = ajax;
	
	var _url = __webpack_require__(14);
	
	var utils = __webpack_require__(2);
	
	var XHR_DONE = 4;
	
	/**
	 * Simple IE9+ and cross-browser ajax request function
	 * Note: x-domain requests in IE9 do not support the use of cookies
	 *
	 * @param url string url
	 * @param callback object callback
	 * @param data mixed data
	 * @param options object
	 */
	
	function ajax(url, callback, data) {
	  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
	
	  try {
	    var x = void 0;
	    var useXDomainRequest = false;
	    var method = options.method || (data ? 'POST' : 'GET');
	
	    if (!window.XMLHttpRequest) {
	      useXDomainRequest = true;
	    } else {
	      x = new window.XMLHttpRequest();
	      if (x.responseType === undefined) {
	        useXDomainRequest = true;
	      }
	    }
	
	    if (useXDomainRequest) {
	      x = new window.XDomainRequest();
	      x.onload = function () {
	        callback(x.responseText, x);
	      };
	
	      // http://stackoverflow.com/questions/15786966/xdomainrequest-aborts-post-on-ie-9
	      x.onerror = function () {
	        utils.logMessage('xhr onerror');
	      };
	      x.ontimeout = function () {
	        utils.logMessage('xhr timeout');
	      };
	      x.onprogress = function () {
	        utils.logMessage('xhr onprogress');
	      };
	    } else {
	      x.onreadystatechange = function () {
	        if (x.readyState === XHR_DONE && callback) {
	          callback(x.responseText, x);
	        }
	      };
	    }
	
	    if (method === 'GET' && data) {
	      var urlInfo = (0, _url.parse)(url);
	      _extends(urlInfo.search, data);
	      url = (0, _url.format)(urlInfo);
	    }
	
	    x.open(method, url);
	
	    if (!useXDomainRequest) {
	      if (options.withCredentials) {
	        x.withCredentials = true;
	      }
	      if (options.preflight) {
	        x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	      }
	      x.setRequestHeader('Content-Type', options.contentType || 'text/plain');
	    }
	    x.send(method === 'POST' && data);
	  } catch (error) {
	    utils.logError('xhr construction', error);
	  }
	}

/***/ },
/* 14 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();
	
	exports.parseQS = parseQS;
	exports.formatQS = formatQS;
	exports.parse = parse;
	exports.format = format;
	function parseQS(query) {
	  return !query ? {} : query.replace(/^\?/, '').split('&').reduce(function (acc, criteria) {
	    var _criteria$split = criteria.split('='),
	        _criteria$split2 = _slicedToArray(_criteria$split, 2),
	        k = _criteria$split2[0],
	        v = _criteria$split2[1];
	
	    if (/\[\]$/.test(k)) {
	      k = k.replace('[]', '');
	      acc[k] = acc[k] || [];
	      acc[k].push(v);
	    } else {
	      acc[k] = v || '';
	    }
	    return acc;
	  }, {});
	}
	
	function formatQS(query) {
	  return Object.keys(query).map(function (k) {
	    return Array.isArray(query[k]) ? query[k].map(function (v) {
	      return k + '[]=' + v;
	    }).join('&') : k + '=' + query[k];
	  }).join('&');
	}
	
	function parse(url) {
	  var parsed = document.createElement('a');
	  parsed.href = decodeURIComponent(url);
	  return {
	    protocol: (parsed.protocol || '').replace(/:$/, ''),
	    hostname: parsed.hostname,
	    port: +parsed.port,
	    pathname: parsed.pathname,
	    search: parseQS(parsed.search || ''),
	    hash: (parsed.hash || '').replace(/^#/, ''),
	    host: parsed.host
	  };
	}
	
	function format(obj) {
	  return (obj.protocol || 'http') + '://' + (obj.host || obj.hostname + (obj.port ? ':' + obj.port : '')) + (obj.pathname || '') + (obj.search ? '?' + formatQS(obj.search || '') : '') + (obj.hash ? '#' + obj.hash : '');
	}

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _shim = __webpack_require__(16);
	
	var _shim2 = _interopRequireDefault(_shim);
	
	var _shim3 = __webpack_require__(40);
	
	var _shim4 = _interopRequireDefault(_shim3);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	/** @module polyfill
	Misc polyfills
	*/
	/*jshint -W121 */
	if (!Array.prototype.find) {
	  (0, _shim2['default'])();
	}
	
	if (!Array.prototype.includes) {
	  (0, _shim4['default'])();
	}
	
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger
	Number.isInteger = Number.isInteger || function (value) {
	  return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
	};

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var define = __webpack_require__(17);
	var getPolyfill = __webpack_require__(21);
	
	module.exports = function shimArrayPrototypeFind() {
		var polyfill = getPolyfill();
	
		define(Array.prototype, { find: polyfill }, {
			find: function () {
				return Array.prototype.find !== polyfill;
			}
		});
	
		return polyfill;
	};


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var keys = __webpack_require__(18);
	var foreach = __webpack_require__(20);
	var hasSymbols = typeof Symbol === 'function' && typeof Symbol() === 'symbol';
	
	var toStr = Object.prototype.toString;
	
	var isFunction = function (fn) {
		return typeof fn === 'function' && toStr.call(fn) === '[object Function]';
	};
	
	var arePropertyDescriptorsSupported = function () {
		var obj = {};
		try {
			Object.defineProperty(obj, 'x', { enumerable: false, value: obj });
	        /* eslint-disable no-unused-vars, no-restricted-syntax */
	        for (var _ in obj) { return false; }
	        /* eslint-enable no-unused-vars, no-restricted-syntax */
			return obj.x === obj;
		} catch (e) { /* this is IE 8. */
			return false;
		}
	};
	var supportsDescriptors = Object.defineProperty && arePropertyDescriptorsSupported();
	
	var defineProperty = function (object, name, value, predicate) {
		if (name in object && (!isFunction(predicate) || !predicate())) {
			return;
		}
		if (supportsDescriptors) {
			Object.defineProperty(object, name, {
				configurable: true,
				enumerable: false,
				value: value,
				writable: true
			});
		} else {
			object[name] = value;
		}
	};
	
	var defineProperties = function (object, map) {
		var predicates = arguments.length > 2 ? arguments[2] : {};
		var props = keys(map);
		if (hasSymbols) {
			props = props.concat(Object.getOwnPropertySymbols(map));
		}
		foreach(props, function (name) {
			defineProperty(object, name, map[name], predicates[name]);
		});
	};
	
	defineProperties.supportsDescriptors = !!supportsDescriptors;
	
	module.exports = defineProperties;


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	// modified from https://github.com/es-shims/es5-shim
	var has = Object.prototype.hasOwnProperty;
	var toStr = Object.prototype.toString;
	var slice = Array.prototype.slice;
	var isArgs = __webpack_require__(19);
	var isEnumerable = Object.prototype.propertyIsEnumerable;
	var hasDontEnumBug = !isEnumerable.call({ toString: null }, 'toString');
	var hasProtoEnumBug = isEnumerable.call(function () {}, 'prototype');
	var dontEnums = [
		'toString',
		'toLocaleString',
		'valueOf',
		'hasOwnProperty',
		'isPrototypeOf',
		'propertyIsEnumerable',
		'constructor'
	];
	var equalsConstructorPrototype = function (o) {
		var ctor = o.constructor;
		return ctor && ctor.prototype === o;
	};
	var excludedKeys = {
		$console: true,
		$external: true,
		$frame: true,
		$frameElement: true,
		$frames: true,
		$innerHeight: true,
		$innerWidth: true,
		$outerHeight: true,
		$outerWidth: true,
		$pageXOffset: true,
		$pageYOffset: true,
		$parent: true,
		$scrollLeft: true,
		$scrollTop: true,
		$scrollX: true,
		$scrollY: true,
		$self: true,
		$webkitIndexedDB: true,
		$webkitStorageInfo: true,
		$window: true
	};
	var hasAutomationEqualityBug = (function () {
		/* global window */
		if (typeof window === 'undefined') { return false; }
		for (var k in window) {
			try {
				if (!excludedKeys['$' + k] && has.call(window, k) && window[k] !== null && typeof window[k] === 'object') {
					try {
						equalsConstructorPrototype(window[k]);
					} catch (e) {
						return true;
					}
				}
			} catch (e) {
				return true;
			}
		}
		return false;
	}());
	var equalsConstructorPrototypeIfNotBuggy = function (o) {
		/* global window */
		if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
			return equalsConstructorPrototype(o);
		}
		try {
			return equalsConstructorPrototype(o);
		} catch (e) {
			return false;
		}
	};
	
	var keysShim = function keys(object) {
		var isObject = object !== null && typeof object === 'object';
		var isFunction = toStr.call(object) === '[object Function]';
		var isArguments = isArgs(object);
		var isString = isObject && toStr.call(object) === '[object String]';
		var theKeys = [];
	
		if (!isObject && !isFunction && !isArguments) {
			throw new TypeError('Object.keys called on a non-object');
		}
	
		var skipProto = hasProtoEnumBug && isFunction;
		if (isString && object.length > 0 && !has.call(object, 0)) {
			for (var i = 0; i < object.length; ++i) {
				theKeys.push(String(i));
			}
		}
	
		if (isArguments && object.length > 0) {
			for (var j = 0; j < object.length; ++j) {
				theKeys.push(String(j));
			}
		} else {
			for (var name in object) {
				if (!(skipProto && name === 'prototype') && has.call(object, name)) {
					theKeys.push(String(name));
				}
			}
		}
	
		if (hasDontEnumBug) {
			var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);
	
			for (var k = 0; k < dontEnums.length; ++k) {
				if (!(skipConstructor && dontEnums[k] === 'constructor') && has.call(object, dontEnums[k])) {
					theKeys.push(dontEnums[k]);
				}
			}
		}
		return theKeys;
	};
	
	keysShim.shim = function shimObjectKeys() {
		if (Object.keys) {
			var keysWorksWithArguments = (function () {
				// Safari 5.0 bug
				return (Object.keys(arguments) || '').length === 2;
			}(1, 2));
			if (!keysWorksWithArguments) {
				var originalKeys = Object.keys;
				Object.keys = function keys(object) {
					if (isArgs(object)) {
						return originalKeys(slice.call(object));
					} else {
						return originalKeys(object);
					}
				};
			}
		} else {
			Object.keys = keysShim;
		}
		return Object.keys || keysShim;
	};
	
	module.exports = keysShim;


/***/ },
/* 19 */
/***/ function(module, exports) {

	'use strict';
	
	var toStr = Object.prototype.toString;
	
	module.exports = function isArguments(value) {
		var str = toStr.call(value);
		var isArgs = str === '[object Arguments]';
		if (!isArgs) {
			isArgs = str !== '[object Array]' &&
				value !== null &&
				typeof value === 'object' &&
				typeof value.length === 'number' &&
				value.length >= 0 &&
				toStr.call(value.callee) === '[object Function]';
		}
		return isArgs;
	};


/***/ },
/* 20 */
/***/ function(module, exports) {

	
	var hasOwn = Object.prototype.hasOwnProperty;
	var toString = Object.prototype.toString;
	
	module.exports = function forEach (obj, fn, ctx) {
	    if (toString.call(fn) !== '[object Function]') {
	        throw new TypeError('iterator must be a function');
	    }
	    var l = obj.length;
	    if (l === +l) {
	        for (var i = 0; i < l; i++) {
	            fn.call(ctx, obj[i], i, obj);
	        }
	    } else {
	        for (var k in obj) {
	            if (hasOwn.call(obj, k)) {
	                fn.call(ctx, obj[k], k, obj);
	            }
	        }
	    }
	};
	


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	module.exports = function getPolyfill() {
		// Detect if an implementation exists
		// Detect early implementations which skipped holes in sparse arrays
	  // eslint-disable-next-line no-sparse-arrays
		var implemented = Array.prototype.find && [, 1].find(function () {
			return true;
		}) !== 1;
	
	  // eslint-disable-next-line global-require
		return implemented ? Array.prototype.find : __webpack_require__(22);
	};


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var ES = __webpack_require__(23);
	
	module.exports = function find(predicate) {
		var list = ES.ToObject(this);
		var length = ES.ToInteger(ES.ToLength(list.length));
		if (!ES.IsCallable(predicate)) {
			throw new TypeError('Array#find: predicate must be a function');
		}
		if (length === 0) {
			return undefined;
		}
		var thisArg = arguments[1];
		for (var i = 0, value; i < length; i++) {
			value = list[i];
			if (ES.Call(predicate, thisArg, [value, i, list])) {
				return value;
			}
		}
		return undefined;
	};


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var toStr = Object.prototype.toString;
	var hasSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol';
	var symbolToStr = hasSymbols ? Symbol.prototype.toString : toStr;
	
	var $isNaN = __webpack_require__(24);
	var $isFinite = __webpack_require__(25);
	var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1;
	
	var assign = __webpack_require__(26);
	var sign = __webpack_require__(27);
	var mod = __webpack_require__(28);
	var isPrimitive = __webpack_require__(29);
	var toPrimitive = __webpack_require__(30);
	var parseInteger = parseInt;
	var bind = __webpack_require__(35);
	var strSlice = bind.call(Function.call, String.prototype.slice);
	var isBinary = bind.call(Function.call, RegExp.prototype.test, /^0b[01]+$/i);
	var isOctal = bind.call(Function.call, RegExp.prototype.test, /^0o[0-7]+$/i);
	var nonWS = ['\u0085', '\u200b', '\ufffe'].join('');
	var nonWSregex = new RegExp('[' + nonWS + ']', 'g');
	var hasNonWS = bind.call(Function.call, RegExp.prototype.test, nonWSregex);
	var invalidHexLiteral = /^[-+]0x[0-9a-f]+$/i;
	var isInvalidHexLiteral = bind.call(Function.call, RegExp.prototype.test, invalidHexLiteral);
	
	// whitespace from: http://es5.github.io/#x15.5.4.20
	// implementation from https://github.com/es-shims/es5-shim/blob/v3.4.0/es5-shim.js#L1304-L1324
	var ws = [
		'\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003',
		'\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028',
		'\u2029\uFEFF'
	].join('');
	var trimRegex = new RegExp('(^[' + ws + ']+)|([' + ws + ']+$)', 'g');
	var replace = bind.call(Function.call, String.prototype.replace);
	var trim = function (value) {
		return replace(value, trimRegex, '');
	};
	
	var ES5 = __webpack_require__(37);
	
	var hasRegExpMatcher = __webpack_require__(39);
	
	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-abstract-operations
	var ES6 = assign(assign({}, ES5), {
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-call-f-v-args
		Call: function Call(F, V) {
			var args = arguments.length > 2 ? arguments[2] : [];
			if (!this.IsCallable(F)) {
				throw new TypeError(F + ' is not a function');
			}
			return F.apply(V, args);
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toprimitive
		ToPrimitive: toPrimitive,
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toboolean
		// ToBoolean: ES5.ToBoolean,
	
		// http://www.ecma-international.org/ecma-262/6.0/#sec-tonumber
		ToNumber: function ToNumber(argument) {
			var value = isPrimitive(argument) ? argument : toPrimitive(argument, 'number');
			if (typeof value === 'symbol') {
				throw new TypeError('Cannot convert a Symbol value to a number');
			}
			if (typeof value === 'string') {
				if (isBinary(value)) {
					return this.ToNumber(parseInteger(strSlice(value, 2), 2));
				} else if (isOctal(value)) {
					return this.ToNumber(parseInteger(strSlice(value, 2), 8));
				} else if (hasNonWS(value) || isInvalidHexLiteral(value)) {
					return NaN;
				} else {
					var trimmed = trim(value);
					if (trimmed !== value) {
						return this.ToNumber(trimmed);
					}
				}
			}
			return Number(value);
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tointeger
		// ToInteger: ES5.ToNumber,
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toint32
		// ToInt32: ES5.ToInt32,
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-touint32
		// ToUint32: ES5.ToUint32,
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toint16
		ToInt16: function ToInt16(argument) {
			var int16bit = this.ToUint16(argument);
			return int16bit >= 0x8000 ? int16bit - 0x10000 : int16bit;
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-touint16
		// ToUint16: ES5.ToUint16,
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toint8
		ToInt8: function ToInt8(argument) {
			var int8bit = this.ToUint8(argument);
			return int8bit >= 0x80 ? int8bit - 0x100 : int8bit;
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-touint8
		ToUint8: function ToUint8(argument) {
			var number = this.ToNumber(argument);
			if ($isNaN(number) || number === 0 || !$isFinite(number)) { return 0; }
			var posInt = sign(number) * Math.floor(Math.abs(number));
			return mod(posInt, 0x100);
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-touint8clamp
		ToUint8Clamp: function ToUint8Clamp(argument) {
			var number = this.ToNumber(argument);
			if ($isNaN(number) || number <= 0) { return 0; }
			if (number >= 0xFF) { return 0xFF; }
			var f = Math.floor(argument);
			if (f + 0.5 < number) { return f + 1; }
			if (number < f + 0.5) { return f; }
			if (f % 2 !== 0) { return f + 1; }
			return f;
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tostring
		ToString: function ToString(argument) {
			if (typeof argument === 'symbol') {
				throw new TypeError('Cannot convert a Symbol value to a string');
			}
			return String(argument);
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-toobject
		ToObject: function ToObject(value) {
			this.RequireObjectCoercible(value);
			return Object(value);
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-topropertykey
		ToPropertyKey: function ToPropertyKey(argument) {
			var key = this.ToPrimitive(argument, String);
			return typeof key === 'symbol' ? symbolToStr.call(key) : this.ToString(key);
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
		ToLength: function ToLength(argument) {
			var len = this.ToInteger(argument);
			if (len <= 0) { return 0; } // includes converting -0 to +0
			if (len > MAX_SAFE_INTEGER) { return MAX_SAFE_INTEGER; }
			return len;
		},
	
		// http://www.ecma-international.org/ecma-262/6.0/#sec-canonicalnumericindexstring
		CanonicalNumericIndexString: function CanonicalNumericIndexString(argument) {
			if (toStr.call(argument) !== '[object String]') {
				throw new TypeError('must be a string');
			}
			if (argument === '-0') { return -0; }
			var n = this.ToNumber(argument);
			if (this.SameValue(this.ToString(n), argument)) { return n; }
			return void 0;
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-requireobjectcoercible
		RequireObjectCoercible: ES5.CheckObjectCoercible,
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isarray
		IsArray: Array.isArray || function IsArray(argument) {
			return toStr.call(argument) === '[object Array]';
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-iscallable
		// IsCallable: ES5.IsCallable,
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isconstructor
		IsConstructor: function IsConstructor(argument) {
			return typeof argument === 'function' && !!argument.prototype; // unfortunately there's no way to truly check this without try/catch `new argument`
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isextensible-o
		IsExtensible: function IsExtensible(obj) {
			if (!Object.preventExtensions) { return true; }
			if (isPrimitive(obj)) {
				return false;
			}
			return Object.isExtensible(obj);
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isinteger
		IsInteger: function IsInteger(argument) {
			if (typeof argument !== 'number' || $isNaN(argument) || !$isFinite(argument)) {
				return false;
			}
			var abs = Math.abs(argument);
			return Math.floor(abs) === abs;
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-ispropertykey
		IsPropertyKey: function IsPropertyKey(argument) {
			return typeof argument === 'string' || typeof argument === 'symbol';
		},
	
		// http://www.ecma-international.org/ecma-262/6.0/#sec-isregexp
		IsRegExp: function IsRegExp(argument) {
			if (!argument || typeof argument !== 'object') {
				return false;
			}
			if (hasSymbols) {
				var isRegExp = argument[Symbol.match];
				if (typeof isRegExp !== 'undefined') {
					return ES5.ToBoolean(isRegExp);
				}
			}
			return hasRegExpMatcher(argument);
		},
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevalue
		// SameValue: ES5.SameValue,
	
		// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero
		SameValueZero: function SameValueZero(x, y) {
			return (x === y) || ($isNaN(x) && $isNaN(y));
		},
	
		/**
		 * 7.3.2 GetV (V, P)
		 * 1. Assert: IsPropertyKey(P) is true.
		 * 2. Let O be ToObject(V).
		 * 3. ReturnIfAbrupt(O).
		 * 4. Return O.[[Get]](P, V).
		 */
		GetV: function GetV(V, P) {
			// 7.3.2.1
			if (!this.IsPropertyKey(P)) {
				throw new TypeError('Assertion failed: IsPropertyKey(P) is not true');
			}
	
			// 7.3.2.2-3
			var O = this.ToObject(V);
	
			// 7.3.2.4
			return O[P];
		},
	
		/**
		 * 7.3.9 - http://www.ecma-international.org/ecma-262/6.0/#sec-getmethod
		 * 1. Assert: IsPropertyKey(P) is true.
		 * 2. Let func be GetV(O, P).
		 * 3. ReturnIfAbrupt(func).
		 * 4. If func is either undefined or null, return undefined.
		 * 5. If IsCallable(func) is false, throw a TypeError exception.
		 * 6. Return func.
		 */
		GetMethod: function GetMethod(O, P) {
			// 7.3.9.1
			if (!this.IsPropertyKey(P)) {
				throw new TypeError('Assertion failed: IsPropertyKey(P) is not true');
			}
	
			// 7.3.9.2
			var func = this.GetV(O, P);
	
			// 7.3.9.4
			if (func == null) {
				return undefined;
			}
	
			// 7.3.9.5
			if (!this.IsCallable(func)) {
				throw new TypeError(P + 'is not a function');
			}
	
			// 7.3.9.6
			return func;
		},
	
		/**
		 * 7.3.1 Get (O, P) - http://www.ecma-international.org/ecma-262/6.0/#sec-get-o-p
		 * 1. Assert: Type(O) is Object.
		 * 2. Assert: IsPropertyKey(P) is true.
		 * 3. Return O.[[Get]](P, O).
		 */
		Get: function Get(O, P) {
			// 7.3.1.1
			if (this.Type(O) !== 'Object') {
				throw new TypeError('Assertion failed: Type(O) is not Object');
			}
			// 7.3.1.2
			if (!this.IsPropertyKey(P)) {
				throw new TypeError('Assertion failed: IsPropertyKey(P) is not true');
			}
			// 7.3.1.3
			return O[P];
		},
	
		Type: function Type(x) {
			if (typeof x === 'symbol') {
				return 'Symbol';
			}
			return ES5.Type(x);
		},
	
		// http://www.ecma-international.org/ecma-262/6.0/#sec-speciesconstructor
		SpeciesConstructor: function SpeciesConstructor(O, defaultConstructor) {
			if (this.Type(O) !== 'Object') {
				throw new TypeError('Assertion failed: Type(O) is not Object');
			}
			var C = O.constructor;
			if (typeof C === 'undefined') {
				return defaultConstructor;
			}
			if (this.Type(C) !== 'Object') {
				throw new TypeError('O.constructor is not an Object');
			}
			var S = hasSymbols && Symbol.species ? C[Symbol.species] : undefined;
			if (S == null) {
				return defaultConstructor;
			}
			if (this.IsConstructor(S)) {
				return S;
			}
			throw new TypeError('no constructor found');
		}
	});
	
	delete ES6.CheckObjectCoercible; // renamed in ES6 to RequireObjectCoercible
	
	module.exports = ES6;


/***/ },
/* 24 */
/***/ function(module, exports) {

	module.exports = Number.isNaN || function isNaN(a) {
		return a !== a;
	};


/***/ },
/* 25 */
/***/ function(module, exports) {

	var $isNaN = Number.isNaN || function (a) { return a !== a; };
	
	module.exports = Number.isFinite || function (x) { return typeof x === 'number' && !$isNaN(x) && x !== Infinity && x !== -Infinity; };


/***/ },
/* 26 */
/***/ function(module, exports) {

	var has = Object.prototype.hasOwnProperty;
	module.exports = Object.assign || function assign(target, source) {
		for (var key in source) {
			if (has.call(source, key)) {
				target[key] = source[key];
			}
		}
		return target;
	};


/***/ },
/* 27 */
/***/ function(module, exports) {

	module.exports = function sign(number) {
		return number >= 0 ? 1 : -1;
	};


/***/ },
/* 28 */
/***/ function(module, exports) {

	module.exports = function mod(number, modulo) {
		var remain = number % modulo;
		return Math.floor(remain >= 0 ? remain : remain + modulo);
	};


/***/ },
/* 29 */
/***/ function(module, exports) {

	module.exports = function isPrimitive(value) {
		return value === null || (typeof value !== 'function' && typeof value !== 'object');
	};


/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var hasSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol';
	
	var isPrimitive = __webpack_require__(31);
	var isCallable = __webpack_require__(32);
	var isDate = __webpack_require__(33);
	var isSymbol = __webpack_require__(34);
	
	var ordinaryToPrimitive = function OrdinaryToPrimitive(O, hint) {
		if (typeof O === 'undefined' || O === null) {
			throw new TypeError('Cannot call method on ' + O);
		}
		if (typeof hint !== 'string' || (hint !== 'number' && hint !== 'string')) {
			throw new TypeError('hint must be "string" or "number"');
		}
		var methodNames = hint === 'string' ? ['toString', 'valueOf'] : ['valueOf', 'toString'];
		var method, result, i;
		for (i = 0; i < methodNames.length; ++i) {
			method = O[methodNames[i]];
			if (isCallable(method)) {
				result = method.call(O);
				if (isPrimitive(result)) {
					return result;
				}
			}
		}
		throw new TypeError('No default value');
	};
	
	var GetMethod = function GetMethod(O, P) {
		var func = O[P];
		if (func !== null && typeof func !== 'undefined') {
			if (!isCallable(func)) {
				throw new TypeError(func + ' returned for property ' + P + ' of object ' + O + ' is not a function');
			}
			return func;
		}
	};
	
	// http://www.ecma-international.org/ecma-262/6.0/#sec-toprimitive
	module.exports = function ToPrimitive(input, PreferredType) {
		if (isPrimitive(input)) {
			return input;
		}
		var hint = 'default';
		if (arguments.length > 1) {
			if (PreferredType === String) {
				hint = 'string';
			} else if (PreferredType === Number) {
				hint = 'number';
			}
		}
	
		var exoticToPrim;
		if (hasSymbols) {
			if (Symbol.toPrimitive) {
				exoticToPrim = GetMethod(input, Symbol.toPrimitive);
			} else if (isSymbol(input)) {
				exoticToPrim = Symbol.prototype.valueOf;
			}
		}
		if (typeof exoticToPrim !== 'undefined') {
			var result = exoticToPrim.call(input, hint);
			if (isPrimitive(result)) {
				return result;
			}
			throw new TypeError('unable to convert exotic object to primitive');
		}
		if (hint === 'default' && (isDate(input) || isSymbol(input))) {
			hint = 'string';
		}
		return ordinaryToPrimitive(input, hint === 'default' ? 'number' : hint);
	};


/***/ },
/* 31 */
/***/ function(module, exports) {

	module.exports = function isPrimitive(value) {
		return value === null || (typeof value !== 'function' && typeof value !== 'object');
	};


/***/ },
/* 32 */
/***/ function(module, exports) {

	'use strict';
	
	var fnToStr = Function.prototype.toString;
	
	var constructorRegex = /^\s*class /;
	var isES6ClassFn = function isES6ClassFn(value) {
		try {
			var fnStr = fnToStr.call(value);
			var singleStripped = fnStr.replace(/\/\/.*\n/g, '');
			var multiStripped = singleStripped.replace(/\/\*[.\s\S]*\*\//g, '');
			var spaceStripped = multiStripped.replace(/\n/mg, ' ').replace(/ {2}/g, ' ');
			return constructorRegex.test(spaceStripped);
		} catch (e) {
			return false; // not a function
		}
	};
	
	var tryFunctionObject = function tryFunctionObject(value) {
		try {
			if (isES6ClassFn(value)) { return false; }
			fnToStr.call(value);
			return true;
		} catch (e) {
			return false;
		}
	};
	var toStr = Object.prototype.toString;
	var fnClass = '[object Function]';
	var genClass = '[object GeneratorFunction]';
	var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
	
	module.exports = function isCallable(value) {
		if (!value) { return false; }
		if (typeof value !== 'function' && typeof value !== 'object') { return false; }
		if (hasToStringTag) { return tryFunctionObject(value); }
		if (isES6ClassFn(value)) { return false; }
		var strClass = toStr.call(value);
		return strClass === fnClass || strClass === genClass;
	};


/***/ },
/* 33 */
/***/ function(module, exports) {

	'use strict';
	
	var getDay = Date.prototype.getDay;
	var tryDateObject = function tryDateObject(value) {
		try {
			getDay.call(value);
			return true;
		} catch (e) {
			return false;
		}
	};
	
	var toStr = Object.prototype.toString;
	var dateClass = '[object Date]';
	var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
	
	module.exports = function isDateObject(value) {
		if (typeof value !== 'object' || value === null) { return false; }
		return hasToStringTag ? tryDateObject(value) : toStr.call(value) === dateClass;
	};


/***/ },
/* 34 */
/***/ function(module, exports) {

	'use strict';
	
	var toStr = Object.prototype.toString;
	var hasSymbols = typeof Symbol === 'function' && typeof Symbol() === 'symbol';
	
	if (hasSymbols) {
		var symToStr = Symbol.prototype.toString;
		var symStringRegex = /^Symbol\(.*\)$/;
		var isSymbolObject = function isSymbolObject(value) {
			if (typeof value.valueOf() !== 'symbol') { return false; }
			return symStringRegex.test(symToStr.call(value));
		};
		module.exports = function isSymbol(value) {
			if (typeof value === 'symbol') { return true; }
			if (toStr.call(value) !== '[object Symbol]') { return false; }
			try {
				return isSymbolObject(value);
			} catch (e) {
				return false;
			}
		};
	} else {
		module.exports = function isSymbol(value) {
			// this environment does not support Symbols.
			return false;
		};
	}


/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	var implementation = __webpack_require__(36);
	
	module.exports = Function.prototype.bind || implementation;


/***/ },
/* 36 */
/***/ function(module, exports) {

	var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
	var slice = Array.prototype.slice;
	var toStr = Object.prototype.toString;
	var funcType = '[object Function]';
	
	module.exports = function bind(that) {
	    var target = this;
	    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
	        throw new TypeError(ERROR_MESSAGE + target);
	    }
	    var args = slice.call(arguments, 1);
	
	    var bound;
	    var binder = function () {
	        if (this instanceof bound) {
	            var result = target.apply(
	                this,
	                args.concat(slice.call(arguments))
	            );
	            if (Object(result) === result) {
	                return result;
	            }
	            return this;
	        } else {
	            return target.apply(
	                that,
	                args.concat(slice.call(arguments))
	            );
	        }
	    };
	
	    var boundLength = Math.max(0, target.length - args.length);
	    var boundArgs = [];
	    for (var i = 0; i < boundLength; i++) {
	        boundArgs.push('$' + i);
	    }
	
	    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);
	
	    if (target.prototype) {
	        var Empty = function Empty() {};
	        Empty.prototype = target.prototype;
	        bound.prototype = new Empty();
	        Empty.prototype = null;
	    }
	
	    return bound;
	};


/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var $isNaN = __webpack_require__(24);
	var $isFinite = __webpack_require__(25);
	
	var sign = __webpack_require__(27);
	var mod = __webpack_require__(28);
	
	var IsCallable = __webpack_require__(32);
	var toPrimitive = __webpack_require__(38);
	
	// https://es5.github.io/#x9
	var ES5 = {
		ToPrimitive: toPrimitive,
	
		ToBoolean: function ToBoolean(value) {
			return Boolean(value);
		},
		ToNumber: function ToNumber(value) {
			return Number(value);
		},
		ToInteger: function ToInteger(value) {
			var number = this.ToNumber(value);
			if ($isNaN(number)) { return 0; }
			if (number === 0 || !$isFinite(number)) { return number; }
			return sign(number) * Math.floor(Math.abs(number));
		},
		ToInt32: function ToInt32(x) {
			return this.ToNumber(x) >> 0;
		},
		ToUint32: function ToUint32(x) {
			return this.ToNumber(x) >>> 0;
		},
		ToUint16: function ToUint16(value) {
			var number = this.ToNumber(value);
			if ($isNaN(number) || number === 0 || !$isFinite(number)) { return 0; }
			var posInt = sign(number) * Math.floor(Math.abs(number));
			return mod(posInt, 0x10000);
		},
		ToString: function ToString(value) {
			return String(value);
		},
		ToObject: function ToObject(value) {
			this.CheckObjectCoercible(value);
			return Object(value);
		},
		CheckObjectCoercible: function CheckObjectCoercible(value, optMessage) {
			/* jshint eqnull:true */
			if (value == null) {
				throw new TypeError(optMessage || 'Cannot call method on ' + value);
			}
			return value;
		},
		IsCallable: IsCallable,
		SameValue: function SameValue(x, y) {
			if (x === y) { // 0 === -0, but they are not identical.
				if (x === 0) { return 1 / x === 1 / y; }
				return true;
			}
			return $isNaN(x) && $isNaN(y);
		},
	
		// http://www.ecma-international.org/ecma-262/5.1/#sec-8
		Type: function Type(x) {
			if (x === null) {
				return 'Null';
			}
			if (typeof x === 'undefined') {
				return 'Undefined';
			}
			if (typeof x === 'function' || typeof x === 'object') {
				return 'Object';
			}
			if (typeof x === 'number') {
				return 'Number';
			}
			if (typeof x === 'boolean') {
				return 'Boolean';
			}
			if (typeof x === 'string') {
				return 'String';
			}
		}
	};
	
	module.exports = ES5;


/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var toStr = Object.prototype.toString;
	
	var isPrimitive = __webpack_require__(31);
	
	var isCallable = __webpack_require__(32);
	
	// https://es5.github.io/#x8.12
	var ES5internalSlots = {
		'[[DefaultValue]]': function (O, hint) {
			var actualHint = hint || (toStr.call(O) === '[object Date]' ? String : Number);
	
			if (actualHint === String || actualHint === Number) {
				var methods = actualHint === String ? ['toString', 'valueOf'] : ['valueOf', 'toString'];
				var value, i;
				for (i = 0; i < methods.length; ++i) {
					if (isCallable(O[methods[i]])) {
						value = O[methods[i]]();
						if (isPrimitive(value)) {
							return value;
						}
					}
				}
				throw new TypeError('No default value');
			}
			throw new TypeError('invalid [[DefaultValue]] hint supplied');
		}
	};
	
	// https://es5.github.io/#x9
	module.exports = function ToPrimitive(input, PreferredType) {
		if (isPrimitive(input)) {
			return input;
		}
		return ES5internalSlots['[[DefaultValue]]'](input, PreferredType);
	};


/***/ },
/* 39 */
/***/ function(module, exports) {

	'use strict';
	
	var regexExec = RegExp.prototype.exec;
	var tryRegexExec = function tryRegexExec(value) {
		try {
			regexExec.call(value);
			return true;
		} catch (e) {
			return false;
		}
	};
	var toStr = Object.prototype.toString;
	var regexClass = '[object RegExp]';
	var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
	
	module.exports = function isRegex(value) {
		if (typeof value !== 'object') { return false; }
		return hasToStringTag ? tryRegexExec(value) : toStr.call(value) === regexClass;
	};


/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var define = __webpack_require__(17);
	var getPolyfill = __webpack_require__(41);
	
	module.exports = function shimArrayPrototypeIncludes() {
		var polyfill = getPolyfill();
		if (Array.prototype.includes !== polyfill) {
			define(Array.prototype, { includes: polyfill });
		}
		return polyfill;
	};


/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var implementation = __webpack_require__(42);
	
	module.exports = function getPolyfill() {
		return Array.prototype.includes || implementation;
	};


/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	
	var ES = __webpack_require__(23);
	var $isNaN = Number.isNaN || function (a) { return a !== a; };
	var $isFinite = Number.isFinite || function (n) { return typeof n === 'number' && global.isFinite(n); };
	var indexOf = Array.prototype.indexOf;
	
	module.exports = function includes(searchElement) {
		var fromIndex = arguments.length > 1 ? ES.ToInteger(arguments[1]) : 0;
		if (indexOf && !$isNaN(searchElement) && $isFinite(fromIndex) && typeof searchElement !== 'undefined') {
			return indexOf.apply(this, arguments) > -1;
		}
	
		var O = ES.ToObject(this);
		var length = ES.ToLength(O.length);
		if (length === 0) {
			return false;
		}
		var k = fromIndex >= 0 ? fromIndex : Math.max(0, length + fromIndex);
		while (k < length) {
			if (ES.SameValueZero(searchElement, O[k])) {
				return true;
			}
			k += 1;
		}
		return false;
	};
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.listenMessagesFromCreative = listenMessagesFromCreative;
	
	var _events = __webpack_require__(8);
	
	var _events2 = _interopRequireDefault(_events);
	
	var _constants = __webpack_require__(3);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	/* Secure Creatives
	  Provides support for rendering creatives into cross domain iframes such as SafeFrame to prevent
	   access to a publisher page from creative payloads.
	 */
	
	var BID_WON = _constants.EVENTS.BID_WON;
	
	function listenMessagesFromCreative() {
	  addEventListener('message', receiveMessage, false);
	}
	
	function receiveMessage(ev) {
	  var key = ev.message ? 'message' : 'data';
	  var data = {};
	  try {
	    data = JSON.parse(ev[key]);
	  } catch (e) {
	    return;
	  }
	
	  if (data.adId) {
	    var adObject = pbjs._bidsReceived.find(function (bid) {
	      return bid.adId === data.adId;
	    });
	
	    if (data.message === 'Prebid Request') {
	      sendAdToCreative(adObject, data.adServerDomain, ev.source);
	      _events2['default'].emit(BID_WON, adObject);
	    }
	  }
	}
	
	function sendAdToCreative(adObject, remoteDomain, source) {
	  var adId = adObject.adId,
	      ad = adObject.ad,
	      adUrl = adObject.adUrl,
	      width = adObject.width,
	      height = adObject.height;
	
	
	  if (adId) {
	    resizeRemoteCreative(adObject);
	    source.postMessage(JSON.stringify({
	      message: 'Prebid Response',
	      ad: ad,
	      adUrl: adUrl,
	      adId: adId,
	      width: width,
	      height: height
	    }), remoteDomain);
	  }
	}
	
	function resizeRemoteCreative(_ref) {
	  var adUnitCode = _ref.adUnitCode,
	      width = _ref.width,
	      height = _ref.height;
	
	  var iframe = document.getElementById(window.googletag.pubads().getSlots().find(function (slot) {
	    return slot.getAdUnitPath() === adUnitCode || slot.getSlotElementId() === adUnitCode;
	  }).getSlotElementId()).querySelector('iframe');
	
	  iframe.width = '' + width;
	  iframe.height = '' + height;
	}

/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(2);
	var _requestCache = {};
	
	//add a script tag to the page, used to add /jpt call to page
	exports.loadScript = function (tagSrc, callback, cacheRequest) {
	  //var noop = () => {};
	  //
	  //callback = callback || noop;
	  if (!tagSrc) {
	    utils.logError('Error attempting to request empty URL', 'adloader.js:loadScript');
	    return;
	  }
	
	  if (cacheRequest) {
	    if (_requestCache[tagSrc]) {
	      if (callback && typeof callback === 'function') {
	        if (_requestCache[tagSrc].loaded) {
	          //invokeCallbacks immediately
	          callback();
	        } else {
	          //queue the callback
	          _requestCache[tagSrc].callbacks.push(callback);
	        }
	      }
	    } else {
	      _requestCache[tagSrc] = {
	        loaded: false,
	        callbacks: []
	      };
	      if (callback && typeof callback === 'function') {
	        _requestCache[tagSrc].callbacks.push(callback);
	      }
	
	      requestResource(tagSrc, function () {
	        _requestCache[tagSrc].loaded = true;
	        try {
	          for (var i = 0; i < _requestCache[tagSrc].callbacks.length; i++) {
	            _requestCache[tagSrc].callbacks[i]();
	          }
	        } catch (e) {
	          utils.logError('Error executing callback', 'adloader.js:loadScript', e);
	        }
	      });
	    }
	  }
	
	  //trigger one time request
	  else {
	      requestResource(tagSrc, callback);
	    }
	};
	
	function requestResource(tagSrc, callback) {
	  var jptScript = document.createElement('script');
	  jptScript.type = 'text/javascript';
	  jptScript.async = true;
	
	  // Execute a callback if necessary
	  if (callback && typeof callback === 'function') {
	    if (jptScript.readyState) {
	      jptScript.onreadystatechange = function () {
	        if (jptScript.readyState === 'loaded' || jptScript.readyState === 'complete') {
	          jptScript.onreadystatechange = null;
	          callback();
	        }
	      };
	    } else {
	      jptScript.onload = function () {
	        callback();
	      };
	    }
	  }
	
	  jptScript.src = tagSrc;
	
	  //add the new script tag to the page
	  var elToAppend = document.getElementsByTagName('head');
	  elToAppend = elToAppend.length ? elToAppend : document.getElementsByTagName('body');
	  if (elToAppend.length) {
	    elToAppend = elToAppend[0];
	    elToAppend.insertBefore(jptScript, elToAppend.firstChild);
	  }
	}
	
	//track a impbus tracking pixel
	//TODO: Decide if tracking via AJAX is sufficent, or do we need to
	//run impression trackers via page pixels?
	exports.trackPixel = function (pixelUrl) {
	  var delimiter = void 0;
	  var trackingPixel = void 0;
	
	  if (!pixelUrl || typeof pixelUrl !== 'string') {
	    utils.logMessage('Missing or invalid pixelUrl.');
	    return;
	  }
	
	  delimiter = pixelUrl.indexOf('?') > 0 ? '&' : '?';
	
	  //add a cachebuster so we don't end up dropping any impressions
	  trackingPixel = pixelUrl + delimiter + 'rnd=' + Math.floor(Math.random() * 1E7);
	  new Image().src = trackingPixel;
	  return trackingPixel;
	};

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _url = __webpack_require__(14);
	
	//Adserver parent class
	var AdServer = function AdServer(attr) {
	  this.name = attr.adserver;
	  this.code = attr.code;
	  this.getWinningBidByCode = function () {
	    var _this = this;
	
	    var bidObject = pbjs._bidsReceived.find(function (bid) {
	      return bid.adUnitCode === _this.code;
	    });
	    return bidObject;
	  };
	};
	
	//DFP ad server
	exports.dfpAdserver = function (options, urlComponents) {
	  var adserver = new AdServer(options);
	  adserver.urlComponents = urlComponents;
	
	  var dfpReqParams = {
	    'env': 'vp',
	    'gdfp_req': '1',
	    'impl': 's',
	    'unviewed_position_start': '1'
	  };
	
	  var dfpParamsWithVariableValue = ['output', 'iu', 'sz', 'url', 'correlator', 'description_url', 'hl'];
	
	  var getCustomParams = function getCustomParams(targeting) {
	    return encodeURIComponent((0, _url.formatQS)(targeting));
	  };
	
	  adserver.appendQueryParams = function () {
	    var bid = adserver.getWinningBidByCode();
	    this.urlComponents.search.description_url = encodeURIComponent(bid.descriptionUrl);
	    this.urlComponents.search.cust_params = getCustomParams(bid.adserverTargeting);
	    this.urlComponents.search.correlator = Date.now();
	  };
	
	  adserver.verifyAdserverTag = function () {
	    for (var key in dfpReqParams) {
	      if (!this.urlComponents.search.hasOwnProperty(key) || this.urlComponents.search[key] !== dfpReqParams[key]) {
	        return false;
	      }
	    }
	    for (var i in dfpParamsWithVariableValue) {
	      if (!this.urlComponents.search.hasOwnProperty(dfpParamsWithVariableValue[i])) {
	        return false;
	      }
	    }
	    return true;
	  };
	
	  return adserver;
	};

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _utils = __webpack_require__(2);
	
	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
	
	var bidmanager = __webpack_require__(11);
	var utils = __webpack_require__(2);
	var CONSTANTS = __webpack_require__(3);
	
	var targeting = exports;
	var pbTargetingKeys = [];
	
	targeting.resetPresetTargeting = function () {
	  if ((0, _utils.isGptPubadsDefined)()) {
	    window.googletag.pubads().getSlots().forEach(function (slot) {
	      pbTargetingKeys.forEach(function (key) {
	        // reset only registered adunits
	        pbjs.adUnits.find(function (unit) {
	          if (unit.code === slot.getAdUnitPath() || unit.code === slot.getSlotElementId()) {
	            slot.setTargeting(key, null);
	          }
	        });
	      });
	    });
	  }
	};
	
	targeting.getAllTargeting = function (adUnitCode) {
	  var adUnitCodes = adUnitCode && adUnitCode.length ? [adUnitCode] : pbjs._adUnitCodes;
	
	  // Get targeting for the winning bid. Add targeting for any bids that have
	  // `alwaysUseBid=true`. If sending all bids is enabled, add targeting for losing bids.
	  var targeting = getWinningBidTargeting(adUnitCodes).concat(getAlwaysUseBidTargeting(adUnitCodes)).concat(pbjs._sendAllBids ? getBidLandscapeTargeting(adUnitCodes) : []);
	
	  //store a reference of the targeting keys
	  targeting.map(function (adUnitCode) {
	    Object.keys(adUnitCode).map(function (key) {
	      adUnitCode[key].map(function (targetKey) {
	        if (pbTargetingKeys.indexOf(Object.keys(targetKey)[0]) === -1) {
	          pbTargetingKeys = Object.keys(targetKey).concat(pbTargetingKeys);
	        }
	      });
	    });
	  });
	  return targeting;
	};
	
	targeting.setTargeting = function (targetingConfig) {
	  window.googletag.pubads().getSlots().forEach(function (slot) {
	    targetingConfig.filter(function (targeting) {
	      return Object.keys(targeting)[0] === slot.getAdUnitPath() || Object.keys(targeting)[0] === slot.getSlotElementId();
	    }).forEach(function (targeting) {
	      return targeting[Object.keys(targeting)[0]].forEach(function (key) {
	        key[Object.keys(key)[0]].map(function (value) {
	          utils.logMessage('Attempting to set key value for slot: ' + slot.getSlotElementId() + ' key: ' + Object.keys(key)[0] + ' value: ' + value);
	          return value;
	        }).forEach(function (value) {
	          slot.setTargeting(Object.keys(key)[0], value);
	        });
	      });
	    });
	  });
	};
	
	targeting.getWinningBids = function (adUnitCode) {
	  // use the given adUnitCode as a filter if present or all adUnitCodes if not
	  var adUnitCodes = adUnitCode ? [adUnitCode] : pbjs._adUnitCodes;
	
	  return pbjs._bidsReceived.filter(function (bid) {
	    return adUnitCodes.includes(bid.adUnitCode);
	  }).filter(function (bid) {
	    return bid.cpm > 0;
	  }).map(function (bid) {
	    return bid.adUnitCode;
	  }).filter(_utils.uniques).map(function (adUnitCode) {
	    return pbjs._bidsReceived.filter(function (bid) {
	      return bid.adUnitCode === adUnitCode ? bid : null;
	    }).reduce(_utils.getHighestCpm, {
	      adUnitCode: adUnitCode,
	      cpm: 0,
	      adserverTargeting: {},
	      timeToRespond: 0
	    });
	  });
	};
	
	targeting.setTargetingForAst = function () {
	  var targeting = pbjs.getAdserverTargeting();
	  Object.keys(targeting).forEach(function (targetId) {
	    return Object.keys(targeting[targetId]).forEach(function (key) {
	      utils.logMessage('Attempting to set targeting for targetId: ' + targetId + ' key: ' + key + ' value: ' + targeting[targetId][key]);
	      //setKeywords supports string and array as value
	      if (utils.isStr(targeting[targetId][key]) || utils.isArray(targeting[targetId][key])) {
	        var keywordsObj = {};
	        var nKey = key === 'hb_adid' ? key.toUpperCase() : key;
	        keywordsObj[nKey] = targeting[targetId][key];
	        window.apntag.setKeywords(targetId, keywordsObj);
	      }
	    });
	  });
	};
	
	function getWinningBidTargeting() {
	  var winners = targeting.getWinningBids();
	  var standardKeys = getStandardKeys();
	
	  winners = winners.map(function (winner) {
	    return _defineProperty({}, winner.adUnitCode, Object.keys(winner.adserverTargeting).filter(function (key) {
	      return typeof winner.sendStandardTargeting === "undefined" || winner.sendStandardTargeting || standardKeys.indexOf(key) === -1;
	    }).map(function (key) {
	      return _defineProperty({}, key.substring(0, 20), [winner.adserverTargeting[key]]);
	    }));
	  });
	
	  return winners;
	}
	
	function getStandardKeys() {
	  return bidmanager.getStandardBidderAdServerTargeting() // in case using a custom standard key set
	  .map(function (targeting) {
	    return targeting.key;
	  }).concat(CONSTANTS.TARGETING_KEYS).filter(_utils.uniques); // standard keys defined in the library.
	}
	
	/**
	 * Get custom targeting keys for bids that have `alwaysUseBid=true`.
	 */
	function getAlwaysUseBidTargeting(adUnitCodes) {
	  var standardKeys = getStandardKeys();
	  return pbjs._bidsReceived.filter(_utils.adUnitsFilter.bind(this, adUnitCodes)).map(function (bid) {
	    if (bid.alwaysUseBid) {
	      return _defineProperty({}, bid.adUnitCode, Object.keys(bid.adserverTargeting).map(function (key) {
	        // Get only the non-standard keys of the losing bids, since we
	        // don't want to override the standard keys of the winning bid.
	        if (standardKeys.indexOf(key) > -1) {
	          return;
	        }
	
	        return _defineProperty({}, key.substring(0, 20), [bid.adserverTargeting[key]]);
	      }).filter(function (key) {
	        return key;
	      }));
	    }
	  }).filter(function (bid) {
	    return bid;
	  }); // removes empty elements in array;
	}
	
	function getBidLandscapeTargeting(adUnitCodes) {
	  var standardKeys = CONSTANTS.TARGETING_KEYS;
	
	  return pbjs._bidsReceived.filter(_utils.adUnitsFilter.bind(this, adUnitCodes)).map(function (bid) {
	    if (bid.adserverTargeting) {
	      return _defineProperty({}, bid.adUnitCode, getTargetingMap(bid, standardKeys.filter(function (key) {
	        return typeof bid.adserverTargeting[key] !== 'undefined';
	      }) // mainly for possibly
	      // unset hb_deal
	      ));
	    }
	  }).filter(function (bid) {
	    return bid;
	  }); // removes empty elements in array
	}
	
	function getTargetingMap(bid, keys) {
	  return keys.map(function (key) {
	    return _defineProperty({}, (key + '_' + bid.bidderCode).substring(0, 20), [bid.adserverTargeting[key]]);
	  });
	}
	
	targeting.isApntagDefined = function () {
	  if (window.apntag && utils.isFn(window.apntag.setKeywords)) {
	    return true;
	  }
	};

/***/ }
/******/ ]);
//# sourceMappingURL=prebid.js.map