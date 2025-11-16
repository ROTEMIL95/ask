var TzlaHostedFields = new function() {
    var userfCallbId,userTerminal_name,bitReqID,bitLayout,isMobile;
    this.create = function(userConfig) {
        return new hufo(userConfig)
    };

    this.nowDT = function() {
        return Number(new Date);
    }

    var hufo = function(userConfig) {

        function sendMsg(targetWindow, msg, secureOrigin)
        {
            secureOrigin || (secureOrigin = "*");
            targetWindow.postMessage(JSON.stringify(msg), secureOrigin);
        }

        function listenMsg(fcallback)
        {
            window.addEventListener("message", function (msgEventObj)
            {
                var dataParsed;
                try
                {
                    dataParsed = JSON.parse(msgEventObj.data);
                    fcallback(dataParsed, msgEventObj);
                }
                catch (err)
                {
                    if (err instanceof SyntaxError) {
                        console.log("Ignore: Message from space received: " + err.message);
                    } else {
                        throw err;
                    }
                }
            }, false);
        }

        function triggerChargeReceived(rcvdMsg) {
            evntCallBacks["charge." + rcvdMsg.requestId] && evntCallBacks["charge." + rcvdMsg.requestId].forEach(function(fCallBack) {
                fCallBack(rcvdMsg.err, rcvdMsg.response);
            })
        }

        function triggerCardTypeChange(rcvdMsg) {
            var trigMsg = {
                type: "cardTypeChange",
                cardType: rcvdMsg.cardType,
                timestamp: nowDT()
            };
            objMyself.trigger(trigMsg);
        }

        function triggerGoogleIsEnable() {
            var trigMsg = {
                type: "googleIsEnable",
                timestamp: nowDT()
            };
            objMyself.trigger(trigMsg);
        }

        function triggervalidityChange(rcvdMsg) {
            var trigMsg = {
                type: "validityChange",
                field: rcvdMsg.fieldName,
                isValid: rcvdMsg.valid,
                timestamp: nowDT()
            };
            objMyself.trigger(trigMsg);
        }

        //CREATE A DIV TO DYSPLAY BIT
        function triggerShowBit(rcvdMsg) {
            if(document.getElementById('hf-bit-iframe') == null){
                let div = document.createElement('div');
                let iframe = document.createElement('iframe');
                let span = document.createElement('span');

                //CHECK IF IN MOBILE
                if (navigator.userAgent.match(/Android/i)
                    || navigator.userAgent.match(/webOS/i)
                    || navigator.userAgent.match(/iPhone/i)
                    || navigator.userAgent.match(/iPad/i)
                    || navigator.userAgent.match(/iPod/i)
                    || navigator.userAgent.match(/BlackBerry/i)
                    || navigator.userAgent.match(/Windows Phone/i)) {
                    isMobile = true;
                } else {
                    isMobile = false;
                }

                //Set styles
                if (bitLayout == 'qr-sms'){
                    div.style.cssText = 'position:fixed;transform:translate(-50%, -50%);z-index:1000000;background-color:transparent;top:53%;left:50%;width:410px;height:850px;border:none';
                    iframe.style.cssText = 'margin-top: -80px;width:400px;height:850px;border:none;-webkit-transform:scale(0.75);-moz-transform:scale(0.75);-o-transform:scale(0.75);-ms-transform:scale(0.75);border:1px solid black';
                } else {
                    div.style.cssText = 'position:fixed;transform:translate(-50%, -50%);z-index:1000000;background-color:white;top:50%;left:50%;width:310px;height:300px; border:1px solid black;text-align:center;';
                    iframe.style.cssText = 'margin-top: -30px; margin-left: -45px;width:400px;height:300px;border:none;-webkit-transform:scale(0.75);-moz-transform:scale(0.75);-o-transform:scale(0.75);-ms-transform:scale(0.75);';
                    if (!isMobile){
                        span.textContent = 'Scan QR for payment';
                    }
                }

                // span.style.cssText = 'color:black;font-size:18px;font-weight:bold;cursor:pointer;';
                // span.textContent = 'Please scan the QR Code';
                //Set attributes
                div.setAttribute("class", "hf-bit-cont");
                div.setAttribute("id", "hf-bit-cont");
                iframe.setAttribute("id", "hf-bit-iframe");
                iframe.setAttribute("src",rcvdMsg.response.bitUrl);

                //Append elements
                if (bitLayout != 'qr-sms'){
                    div.appendChild(span);
                }
                div.appendChild(iframe);
                document.body.appendChild(div);
            }
        }

        function triggerBitResponse(rcvdMsg){
            var paramsData = {
                track_id : JSON.parse(rcvdMsg.response),
                terminal : userTerminal_name
            };
            var extraChData = {
                type: "chargeResponse",
                params: paramsData,
                sandbox: sandBox,
                requestId: bitReqID
            };
            sendMsg(tzlaCtrlIframe.contentWindow, extraChData);

            //REMOVE THE CAHLLENGE DIV ELEMENT
            document.getElementById('hf-bit-cont').remove();
        }

        //CREATE A DIV TO DYSPLAY CHALLENGE
        function triggerChallenge(rcvdMsg) {
            if(document.getElementById('hf-challenge-frame') == null){
                let div = document.createElement('div');
                let iframe = document.createElement('iframe');
                let span = document.createElement('span');

                //Set styles
                div.style.cssText = 'position:fixed;transform:translate(-50%, -50%);z-index:1000000;background-color:transparent;top:50%;left:50%;width:410px;height:650px;border:none';
                iframe.style.cssText = 'width:400px;height:650px;border:none';
                span.style.cssText = 'color:#aaaaaa;float:right;font-size:28px;font-weight:bold;cursor:pointer;';

                //Set attributes
                div.setAttribute("class", "hf-challenge-cont");
                div.setAttribute("id", "hf-challenge-cont");
                iframe.setAttribute("id", "hf-challenge-frame");
                iframe.setAttribute("src",rcvdMsg.response.challengeUrl);

                //Append elements
                div.appendChild(span);
                div.appendChild(iframe);
                document.body.appendChild(div);
            }
        }

        function triggerChallengeSuccess(rcvdMsg){
            var paramsData = {
                track_id : rcvdMsg.response,
                terminal : userTerminal_name
            };
            var extraChData = {
                type: "continue3ds",
                params: paramsData,
                sandbox: sandBox,
                requestId: userfCallbId
            };
            sendMsg(tzlaCtrlIframe.contentWindow, extraChData);

            //REMOVE THE CAHLLENGE DIV ELEMENT
            document.getElementById('hf-challenge-cont').remove();
        }

        function triggerGeneric(rcvdMsg) {
            var trigMsg = {
                type: rcvdMsg.type,
                field: rcvdMsg.fieldName,
                timestamp: nowDT()
            };
            objMyself.trigger(trigMsg);
        }

        function nowDT() {
            return Number(new Date);
        }

        function containerValidityCSSClass(rcvdMsg) {
            var elem = document.querySelector(userConfig.fields[rcvdMsg.fieldName].selector);

            if(rcvdMsg.valid)
                addCSSClassToElem(elem, "hosted-fields-valid"), remCSSClassToElem(elem, "hosted-fields-invalid");
            else
                remCSSClassToElem(elem, "hosted-fields-valid"), addCSSClassToElem(elem, "hosted-fields-invalid");
        }

        function addCSSClassToElem(elem, clsName) {
            if (elem) {
                if (elem.className)
                    elem.className.includes && !elem.className.includes(clsName) && (elem.className += " " + clsName);
                else
                    elem.className = clsName;
            }
        }

        function remCSSClassToElem(elem, clsName) {
            if (elem && elem.className )
                elem.className = elem.className.replace(clsName, "").replace(/^\s|\s$/g, "").replace(/\s\s+/g, " ");
        }

        function generateAllHFIframes(userCfgFields, userCfgStyles) {
            Object.keys(userCfgFields).forEach(function(cfgFldId) {
                allHFLoaded[cfgFldId] = false;
                insertHFIFrameAndPumpUp(userCfgFields[cfgFldId].selector, cfgFldId, userCfgFields[cfgFldId], function(ifElem, cfgFldObj) {
                    var stylemsg = {
                        type: "applyStyles",
                        data: userCfgStyles
                    };
                    sendMsg(ifElem.contentWindow, stylemsg);
                    makeHFFocusOnLabelClick(ifElem, cfgFldObj);
                    checkAllHFLoaded(cfgFldId);
                });
            });
        }

        function makeHFFocusOnLabelClick(ifElem, cfgFldObj) {
            var labelElem;
            if (cfgFldObj.labelSelector)
                labelElem = document.querySelectorAll(cfgFldObj.labelSelector);
            else {
                var i = cfgFldObj.selector.replace("#", "");
                labelElem = document.querySelectorAll('label[for="' + i + '"]');
            }

            labelElem.forEach && labelElem.forEach(function(lblElem) {
                lblElem.addEventListener("click", function() {
                    ifElem && ifElem.contentWindow.focus();
                })
            })
        }

        function insertControlIFrameAndPumpUp(onloadCallBack) {
            var ctrlIframe = document.createElement("iframe");
            ctrlIframe.class = "tranzi-control-iframe";
            ctrlIframe.src = tzlaHFBaseURL + "/controlfields.html?instance_identifier=" + instanceID;
            ctrlIframe.style.cssText = "display: none;";
            ctrlIframe.setAttribute('allow', 'payment');

            document.body.appendChild(ctrlIframe);

            ctrlIframe.addEventListener("load", function() {
                onloadCallBack(ctrlIframe);
            });
        }

        function isDMYHostedField(fname, cfgFldObj) {
            var ret = false;
            if (cfgFldObj.version && cfgFldObj.version === '2')
                ret = true;

            return ret;
        }

        function insertHFIFrameAndPumpUp(cfgFldSel, cfgFldId, cfgFldObj, onloadCallBack) {
            var containerElem = document.querySelector(cfgFldSel),
                ifElemCreation = createHFIframe(cfgFldId, cfgFldObj);
            containerElem.appendChild(ifElemCreation);
            if (isDMYHostedField(cfgFldId, cfgFldObj))
                addCSSClassToElem(containerElem, "container-for-dmy-hostedfield");
            else
                addCSSClassToElem(containerElem, "container-for-hostedfield");

            ifElemCreation.addEventListener("load", function() {
                var ifElem = document.getElementById(prefixId + cfgFldId);
                onloadCallBack(ifElem, cfgFldObj);
            });
        }

        function createHFIframe(cfgFldId, cfgFldObj) {
            var ifElem = document.createElement("iframe");

            ifElem.id = prefixId + cfgFldId;
            ifElem.src = createHFSrc4Iframe(cfgFldId, cfgFldObj);
            ifElem.frameBorder = "0";
            ifElem.scrolling = "no";
            ifElem.allowTransparency = "true";
            ifElem.tabIndex = cfgFldObj.tabindex;
            ifElem.style.cssText = iframeCSS;
            return ifElem;
        }

        function createHFSrc4Iframe(fname, cfgFldObj) {
            var src = "";
            if (isDMYHostedField(fname, cfgFldObj))
                src = tzlaHFBaseURL + "/dmyfield.php?field_name=" + fname + "&instance_identifier=" + instanceID;
            else {
                src = tzlaHFBaseURL + "/genfield.php?field_name=" + fname + "&instance_identifier=" + instanceID;
                if (cfgFldObj.placeholder)
                    src += "&placeholder=" + cfgFldObj.placeholder;
                if (cfgFldObj.label)
                    src += "&label=" + cfgFldObj.label;
            }


            if (autCompl)
                src += "&autocomplete=" + autCompl;

            return src;
        }

        function checkAllHFLoaded(cfgFldId) {
            allHFLoaded[cfgFldId] = true;
            var flg = true;

            Object.keys(allHFLoaded).forEach(function(cfgFId) {
                allHFLoaded[cfgFId] || (flg = false);
            });

            if (flg)
                triggerReady();
        }

        function triggerReady() {
            var trigMsg = {
                type: "ready",
                timestamp: nowDT()
            };
            objMyself.trigger(trigMsg);
        }

        function fmtPlaceHolder(phStr) {
            return phStr.replace(/[^\w\/\s@\$]/g, "");
        }

        function checkUserConfig(ucfg) {
            chkIfObj(ucfg, "Hosted fields config must be a hash");
            chkObjProp(ucfg, "fields", "Config fields is required");
            chkIfObj(ucfg.fields, "Config fields must be a hash");
            chkObjElementsNO(Object.keys(ucfg.fields), 1, "Config fields must have at least 1 key, " + hfIDs);
            hfIDs.forEach(function(id) {
                if (hfOptionalIDs[id] && !ucfg.fields[id]) {

                } else {
                    chkObjProp(ucfg.fields, id, "Config fields must have key :: " + id);
                    chkObjProp(ucfg.fields[id], "selector", "Config fields." + id + ".selector must be present");
                    chkType(ucfg.fields[id].selector, "string", "Config fields." + id + ".selector must be a string");
                    var allElements4OneHF = document.querySelectorAll(ucfg.fields[id].selector);
                    chkObjElementsNO(allElements4OneHF, 1, "Selector for field '" + id + "' matches " + allElements4OneHF.length + " elements, must match 1 element");

                    ucfg.fields[id].labelSelector && chkType(ucfg.fields[id].labelSelector, "string", "options.fields." + id + ".labelSelector must be a string");
                }
            });
        }

        function chkObjElementsNO(obj, num, err) {
            if (obj.length < num)
                throw err;
        }

        function chkObjProp(obj, prop, err) {
            if (!obj[prop])
                throw err;
        }

        function chkType(obj, type, err) {
            if (typeof obj !== type)
                throw err;
        }

        function chkIfObj(obj, err) {
            if (!obj || obj.constructor !== Object)
                throw err;
        }

        function generateInstanceID() {
            return genFromStr(Math.floor(268435456 * (1 + Math.random()))) + genFromStr(genFromDT() + 65536);
        }

        function genFromStr(num) {
            return num.toString(16).substring(1);
        }

        function genFromDT() {
            return (new Date).getTime() % 483;
        }
        var tzlaCtrlIframe, objMyself = this,
            prefixId = "tranzi.",
            tzlaHFBaseURL = "https://hf.tranzila.com/assets/js/hfields_depend",
            iframeCSS = "border: none; width: 100%; height: 100%; float: left; overflow: hidden;",
            sandBox = false,
            hfIDs = ["credit_card_number", "cvv", "expiry", "card_holder_id_number"],
            hfOptionalIDs = [],
            autCompl = false,
            instanceID = generateInstanceID(),
            evntCallBacks = {},
            reqID = 0,
            allHFLoaded = {},
            userCallback;

        hfOptionalIDs["cvv"] = true;
        hfOptionalIDs["expiry"] = true;
        hfOptionalIDs["card_holder_id_number"] = true;

        objMyself.charge = function(ccData, fCallBack) {
            chkIfObj(ccData, "Parameters to send must be a hash");
            chkType(fCallBack, "function", "Charge callback must be a function");
            userTerminal_name= ccData.terminal_name
            var extraChData = {
                type: "charge",
                params: ccData,
                sandbox: sandBox,
                requestId: ++reqID
            };
            evntCallBacks["charge." + extraChData.requestId] = [fCallBack];
            userfCallbId=  extraChData.requestId;
            sendMsg(tzlaCtrlIframe.contentWindow, extraChData);
        };

        objMyself.chargeBit = function(ccData, fCallBack) {
            chkIfObj(ccData, "Parameters to send must be a hash");
            chkType(fCallBack, "function", "Charge callback must be a function");
            userTerminal_name = ccData.terminal_name;
            bitReqID = ++reqID;
            if (Object.hasOwn(ccData,'transaction_layout')){
                bitLayout = ccData.transaction_layout;
            } else {
                bitLayout = 'qr';
            }
            var extraChData = {
                type: "chargeBit",
                params: ccData,
                sandbox: sandBox,
                requestId: bitReqID
            };
            evntCallBacks["charge." + extraChData.requestId] = [fCallBack];
            userfCallbId=  extraChData.requestId;
            sendMsg(tzlaCtrlIframe.contentWindow, extraChData);
        };

        objMyself.chargeGpay = function(ccData, fCallBack) {
            chkIfObj(ccData, "Parameters to send must be a hash");
            chkType(fCallBack, "function", "Charge callback must be a function");
            userTerminal_name = ccData.terminal_name;
            gpayReqID = ++reqID;
            var extraChData = {
                type: "chargeGpay",
                params: ccData,
                sandbox: sandBox,
                requestId: gpayReqID
            };
            evntCallBacks["charge." + extraChData.requestId] = [fCallBack];
            userfCallbId=  extraChData.requestId;
            sendMsg(tzlaCtrlIframe.contentWindow, extraChData);
        };

        objMyself.onEvent = function(event, fCallBack) {
            evntCallBacks[event] || (evntCallBacks[event] = []);
            evntCallBacks[event].push(fCallBack);
        };

        objMyself.trigger = function(trigMsg, trigMsgExtra) {
            var errorElement ;

            errorElement = document.getElementById("errors_for_" + trigMsg.field);

            if(errorElement != null && errorElement.innerHTML != '' && trigMsg.type == 'focus'){
                errorElement.innerHTML = '';
            }
            evntCallBacks[trigMsg.type] && evntCallBacks[trigMsg.type].forEach(function(evntCallBack) {
                evntCallBack(trigMsg, trigMsgExtra);
            })
        };

        var startmyself = function () {
            checkUserConfig(userConfig);
            userConfig.sandbox && (sandBox = userConfig.sandbox);
            userConfig.autocomplete && (autCompl = userConfig.autocomplete);
            insertControlIFrameAndPumpUp(function(ctrlIframe) {
                tzlaCtrlIframe = ctrlIframe;
                generateAllHFIframes(userConfig.fields, userConfig.styles);
            });

            listenMsg(function(rcvdMsg) {
                switch (rcvdMsg.type) {
                    case "chargeResponse":
                        triggerChargeReceived(rcvdMsg);
                        break;
                    case "validityChange":
                        containerValidityCSSClass(rcvdMsg);
                        triggervalidityChange(rcvdMsg);
                        break;
                    case "cardTypeChange":
                        triggerCardTypeChange(rcvdMsg);
                        break;
                    case "showBit":
                        triggerShowBit(rcvdMsg)
                        break;
                    case "bitResponse":
                        rcvdMsg.requestId = bitReqID;
                        document.getElementById('hf-bit-cont').remove();
                        triggerChargeReceived(rcvdMsg)
                        break;
                    case "showChallenge":
                        triggerChallenge(rcvdMsg)
                        break;
                    case "challengeSuccess":
                        triggerChallengeSuccess(rcvdMsg);
                        break;
                    case "isGpayEnable":
                        triggerGoogleIsEnable();
                        break;
                    default:
                        triggerGeneric(rcvdMsg)
                }
            })
        }();

    }
};
