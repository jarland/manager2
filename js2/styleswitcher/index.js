/*
# js2/styleswitcher/index.js                      Copyright(c) 2015 cPanel, Inc.
#                                                           All rights Reserved.
# copyright@cpanel.net                                         http://cpanel.net
# This code is subject to the cPanel license. Unauthorized copying is prohibited
*/

/* jshint -W098 */
/* jshint -W079 */
var Handlebars = window.Handlebars;

var infoLoadingTemplate = Handlebars.compile(YAHOO.util.Dom.get("infoLoadingTemplate").text.trim());
var failureTemplate = Handlebars.compile(YAHOO.util.Dom.get("failureTemplate").text.trim());
var noticeContainer = YAHOO.util.Dom.get("noticeContainer");

var apply_style_callback = {
    success: function(o) {
        var result = YAHOO.lang.JSON.parse(o.responseText);
        if (result.status) {
            window.location.reload(true);
        } else {
            var errorText = failureTemplate({
                "failureID": "applyStylesError",
                "errorImgID": "applyStylesErrorImg",
                "messageID": "applyStylesErrorMessage",
                "message_text": LOCALE.maketext("[output,strong,Error]: The system failed to apply the style you selected.")
            });

            noticeContainer.innerHTML = errorText;
        }
    },

    failure: function() {
        var errorText = failureTemplate({
            "failureID": "applyStylesError",
            "errorImgID": "applyStylesErrorImg",
            "messageID": "applyStylesErrorMessage",
            "message_text": LOCALE.maketext("[output,strong,Error]: The system failed to apply the style you selected.")
        });

        noticeContainer.innerHTML = errorText;
    }
};

var update_style = function(styleName, styleType) {
    var url = CPANEL.urls.uapi("Styles", "update", {
        "type": styleType,
        "name": styleName
    });
    YAHOO.util.Connect.asyncRequest("GET", url, apply_style_callback, "");

    var loadingText = infoLoadingTemplate({
        "noticeID": "applyStylesNotice",
        "infoImgID": "applyStylesLoadingImg",
        "messageID": "applyStylesLoadingMessage",
        "message_text": LOCALE.maketext("Applying styles and reloading the page.")
    });

    noticeContainer.innerHTML = loadingText;
};

var set_default_callback = {
    success: function(o) {
        var result = YAHOO.lang.JSON.parse(o.responseText);
        if (result.status) {
            window.location.reload(true);
        } else {
            var errorText = failureTemplate({
                "failureID": "applyStylesError",
                "errorImgID": "applyStylesErrorImg",
                "messageID": "applyStylesErrorMessage",
                "message_text": LOCALE.maketext("[output,strong,Error]: The system failed to set the default style.")
            });

            noticeContainer.innerHTML = errorText;
        }
    },

    failure: function() {
        var errorText = failureTemplate({
            "failureID": "applyStylesError",
            "errorImgID": "applyStylesErrorImg",
            "messageID": "applyStylesErrorMessage",
            "message_text": LOCALE.maketext("[output,strong,Error]: The system failed to set the default style.")
        });

        noticeContainer.innerHTML = errorText;
    }
};

var set_as_default = function(styleName, styleType) {

    var url = CPANEL.urls.uapi("Styles", "set_default", {
        "type": styleType,
        "name": styleName
    });
    YAHOO.util.Connect.asyncRequest("GET", url, set_default_callback, "");

    var loadingText = infoLoadingTemplate({
        "noticeID": "defaultStyleNotice",
        "infoImgID": "defaultStyleLoadingImg",
        "messageID": "defaultStyleLoadingMessage",
        "message_text": LOCALE.maketext("Setting default style and reloading the page …")
    });

    noticeContainer.innerHTML = loadingText;

};
