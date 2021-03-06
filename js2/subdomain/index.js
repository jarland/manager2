/* globals PAGE, cpanel_jsonapi2, waitpanel, show_loading, alert */
/* exported toggleFtpCreationForm, fillInValues, initValidation, initFtpDomainListener, start_change_docroot, trapEnterPress */
/* eslint-disable camelcase */

var VALIDATORS = {};

/**
 * Used to populate a few of the fields on the form based on the input of the domain field.
 *
 * @method fillInValues
 */
var fillInValues = function() {
    var domain = YAHOO.util.Dom.get("domain").value;
    var domain_array = domain.split(".");

    YAHOO.util.Dom.get("subdomain").value = domain_array[0];

    if (domain_array[0].length < 26) {

        // don't autopopulate the field if the length would break the validation
        YAHOO.util.Dom.get("ftpuser").value = domain_array[0];
    }

    YAHOO.util.Dom.get("dir").value = domain;

    VALIDATORS.subdomainValidator.verify();
    VALIDATORS.ftpuserValidator.verify();
    VALIDATORS.dirValidator.verify();
};

/**
 * Function to clear CJT validation messages.
 * We only want to clear the ones that can be hidden.
 *
 * @method clearValidation
 */
var clearValidation = function() {
    VALIDATORS.ftpuserValidator.clear_messages();
    VALIDATORS.strength_validator.clear_messages();
    VALIDATORS.matching_validator.clear_messages();
};

/**
 * Handles the display of the ftp creation part of the form. Also responsible
 * for re-applying the validation if the ftp part is hidden from view.
 *
 * @method toggleFtpCreationForm
 */
var toggleFtpCreationForm = function() {
    var isFtpChecked = YAHOO.util.Dom.get("create_ftp_account").checked,
        ftpForm = YAHOO.util.Dom.get("ftpCreationForm");

    if (isFtpChecked) {
        ftpForm.style.display = "block";
    } else {
        ftpForm.style.display = "none";
    }

    clearValidation();
};

/**
 * Initializes the validation for the passwords on the form.
 * This password validation code was taken straight from the cjt/password.js setup().
 * This was because that function did not support adding a conditional to the validators when
 * they are created. This is a workaround for that issue.
 *
 * @method passwordSetup
 */
var passwordSetup = function(password1_el, password2_el, strength_bar_el, password_strength, create_strong_el, why_strong_link_el, why_strong_text_el) {
    var min_length = 5;

    // password validators and activate strength bar
    VALIDATORS.password_bar = new CPANEL.password.strength_bar(strength_bar_el);

    // function to verify password strength
    var verify_password_strength = function() {
        if (VALIDATORS.password_bar.current_strength >= password_strength) {
            return true;
        }
        return false;
    };

    // update the strength bar when we type in the password field
    VALIDATORS.password_bar.attach(password1_el, function() {
        VALIDATORS.strength_validator.verify();
    });

    // create a validator for password strength
    VALIDATORS.strength_validator = new CPANEL.validate.validator(LOCALE.maketext("Password Strength"));

    if (password_strength !== -1) {
        VALIDATORS.strength_validator.add(password1_el, "min_length(%input%, 1)", LOCALE.maketext("Password cannot be empty."), function() {
            return YAHOO.util.Dom.get("create_ftp_account").checked;
        });
    }

    if (min_length > 0) {
        VALIDATORS.strength_validator.add(password1_el, "min_length(%input%," + min_length + ")", LOCALE.maketext("Passwords must be at least [quant,_1,character,characters] long.", min_length), function() {
            return YAHOO.util.Dom.get("create_ftp_account").checked;
        });
    }

    VALIDATORS.strength_validator.add(password1_el, "no_chars(%input%, \" \")", LOCALE.maketext("Password cannot have spaces."), function() {
        return YAHOO.util.Dom.get("create_ftp_account").checked;
    });

    if (password_strength > 0) {
        VALIDATORS.strength_validator.add(password1_el, verify_password_strength, LOCALE.maketext("Password strength must be at least [numf,_1].", password_strength), function() {
            return YAHOO.util.Dom.get("create_ftp_account").checked;
        });
    }
    VALIDATORS.strength_validator.attach();

    // create a validator for the two passwords matching
    VALIDATORS.matching_validator = new CPANEL.validate.validator(LOCALE.maketext("Passwords Match"));
    VALIDATORS.matching_validator.add(password2_el, "equals('" + password1_el + "', '" + password2_el + "')", LOCALE.maketext("Passwords do not match."), function() {
        return YAHOO.util.Dom.get("create_ftp_account").checked;
    });
    VALIDATORS.matching_validator.attach();

    // create strong password link
    if (YAHOO.util.Dom.inDocument(create_strong_el) === true) {

        // function that executes when a user clicks the "use" button on the strong password dialog
        var fill_in_strong_password = function(strong_pass) {

            // fill in the two fields
            YAHOO.util.Dom.get(password1_el).value = strong_pass;
            YAHOO.util.Dom.get(password2_el).value = strong_pass;

            // verify the matching validator
            VALIDATORS.matching_validator.verify();

            // update the strength bar
            VALIDATORS.password_bar.check_strength(password1_el, function() {

                // verify the password strength
                VALIDATORS.strength_validator.verify();
            });
        };

        // add an event handler for the "create strong password" link
        YAHOO.util.Event.on(create_strong_el, "click", function() {
            CPANEL.password.generate_password(fill_in_strong_password);
        });
    }

    // add an event handler for the "why?" link
    if (YAHOO.util.Dom.inDocument(why_strong_link_el) === true && YAHOO.util.Dom.inDocument(why_strong_text_el) === true) {
        CPANEL.panels.create_help(why_strong_link_el, why_strong_text_el);
    }

};

/**
 * Initializes the validation for the ftp creation part of the form.
 *
 * @method validateFtp
 */
var validateFtp = function() {

    // ftp username
    VALIDATORS.ftpuserValidator = new CPANEL.validate.validator(LOCALE.maketext("FTP Username"));
    VALIDATORS.ftpuserValidator.add(
        "ftpuser",
        "min_length(%input%, 1)",
        LOCALE.maketext("You must enter an [output,acronym,FTP,File Transfer Protocol] username."),
        function() {
            return YAHOO.util.Dom.get("create_ftp_account").checked;
        },
        { unique_id: "username_min_length" }
    );
    VALIDATORS.ftpuserValidator.add(
        "ftpuser",
        "max_length(%input%, 64)",
        LOCALE.maketext("The [output,acronym,FTP,File Transfer Protocol] username cannot exceed [numf,_1] characters.", 64),
        function() {
            return YAHOO.util.Dom.get("create_ftp_account").checked;
        },
        { unique_id: "username_max_length" }
    );
    var domain_el = YAHOO.util.Dom.get("root_domain");
    VALIDATORS.ftpuserValidator.add(
        "ftpuser",
        function(local_el) {
            var username = local_el.value + "@" + domain_el.value;
            return CPANEL.validate.max_length(username, 254);
        },
        LOCALE.maketext("The full [output,acronym,FTP,File Transfer Protocol] username with its associated domain cannot exceed [numf,_1] characters.", 254),
        function() {
            return YAHOO.util.Dom.get("create_ftp_account").checked;
        },
        { unique_id: "username_full_length" }
    );
    VALIDATORS.ftpuserValidator.add(
        "ftpuser",
        "ftp_username",
        LOCALE.maketext("You can only enter letters [asis,(a-z)], numbers [asis,(0-9)], periods, hyphens [asis,(-)], and underscores [asis,(_)]."),
        function() {
            return YAHOO.util.Dom.get("create_ftp_account").checked;
        },
        { unique_id: "username_valid" }
    );
    VALIDATORS.ftpuserValidator.add(
        "ftpuser",
        "no_unsafe_periods",
        LOCALE.maketext("The [output,acronym,FTP,File Transfer Protocol] username cannot start with a period, end with a period, or include two consecutive periods."),
        function() {
            return YAHOO.util.Dom.get("create_ftp_account").checked;
        },
        { unique_id: "username_safe_periods" });


    VALIDATORS.ftpuserValidator.attach();

    // passwords
    passwordSetup("password1", "password2", "password_strength", PAGE.REQUIRED_PASSWORD_STRENGTH, "create_strong_password", "why_strong_passwords_link", "why_strong_passwords_text");
};

/**
 * Initializes the validation for the addon domain portion of the form.
 *
 * @method validateAddonDomain
 */
var validateAddonDomain = function() {

    // domain name validator
    VALIDATORS.domainValidator = new CPANEL.validate.validator(LOCALE.maketext("New Domain"));
    VALIDATORS.domainValidator.add("domain", "host", LOCALE.maketext("That is not a valid domain."));
    VALIDATORS.domainValidator.attach();

    // subdomain username
    VALIDATORS.subdomainValidator = new CPANEL.validate.validator(LOCALE.maketext("Subdomain"));
    VALIDATORS.subdomainValidator.add("subdomain", "subdomain", LOCALE.maketext("That is not a valid Subdomain."));
    VALIDATORS.subdomainValidator.attach();

    // document root
    VALIDATORS.dirValidator = new CPANEL.validate.validator(LOCALE.maketext("Document Root"));   // eslint-disable-line new-cap
    VALIDATORS.dirValidator.add("dir", "dir_path", LOCALE.maketext("Directory paths cannot be empty or contain the following characters: [output,chr,92] ? % * : | [output,quot] [output,gt] [output,lt]"));
    if (!PAGE.public_html_subs_only) {
        VALIDATORS.dirValidator.add("dir", "reserved_directory", LOCALE.maketext("That directory is reserved for use by the system.") );
    }
    VALIDATORS.dirValidator.attach();
};

/**
 * Handles applying validation to the form
 *
 * @method initValidation
 */
var initValidation = function() {
    validateAddonDomain();
    validateFtp();

    CPANEL.validate.attach_to_form("submit_domain", VALIDATORS);
};

/**
 * Updates the FTP Username domain helper with the current addon domain.
 */
var initFtpDomainListener = function() {
    var domainSpan = document.getElementById("ftpuser-domain");

    var updateDomainSpan = function(event) {
        domainSpan.innerHTML = event.target.value.html_encode();
    };

    // Update the domainSpan with any initial value
    var domainInput = document.getElementById("domain");
    updateDomainSpan({ target: domainInput });

    // Attach listeners for subsequent changes
    YAHOO.util.Event.addListener("domain", "change", updateDomainSpan);
    YAHOO.util.Event.addListener("domain", "input",  updateDomainSpan);
};

var docroot_dialog;

var start_change_docroot = function(domain, subdomain, rootdomain, docroot) {
    if (!docroot_dialog) {
        var handleCancel = function() {
            this.cancel();
        };
        var handleSubmit = function() {

            if (cjt_validator.is_valid()) {  // eslint-disable-line no-use-before-define
                var fulldomain = document.getElementById("change_docroot_domaintxt").innerHTML;
                var callback = function(data) {
                    if (parseInt(data[0].result, 10)) {
                        docroot_dialog.hide();
                        var newdir = data[0].reldir;
                        var alink = document.getElementById(fulldomain + "_lnk");
                        var uri = alink.href.split("?");
                        uri[1] = "dir=" + encodeURIComponent(newdir);
                        alink.href = uri.join("?");
                        CPANEL.util.set_text_content(alink, "/" + newdir);
                        waitpanel.hide();
                        alert("Document Root Updated: " + newdir);
                    } else {
                        waitpanel.hide();
                        docroot_dialog.show();
                        alert(data[0].reason);
                    }
                };
                show_loading(fulldomain, "Updating Document Root");
                docroot_dialog.hide();
                cpanel_jsonapi2(callback,
                    "SubDomain",
                    "changedocroot",
                    "rootdomain",
                    document.getElementById("change_docroot_rootdomain").value,
                    "subdomain",
                    document.getElementById("change_docroot_subdomain").value,
                    "dir",
                    document.getElementById("change_docroot_dir").value);
            }
        };
        docroot_dialog = new YAHOO.widget.Dialog("docroot_panel", {
            width: "350px",
            fixedcenter: true,
            visible: false,
            postmethod: "manual",
            constraintoviewport: true,
            draggable: false,
            modal: true,
            strings: {
                "close": LOCALE.maketext("Close")
            },
            buttons: [{
                text: LOCALE.maketext("Change"),
                handler: handleSubmit,
                isDefault: true
            }, {
                text: LOCALE.maketext("Cancel"),
                handler: handleCancel
            }]
        });
        docroot_dialog.submitEvent.subscribe(handleSubmit);

        docroot_dialog.validate = function() {
            return CPANEL.validate.dir_path(this.form.docroot.value);
        };

        document.getElementById("docroot_panel").style.display = "";
        docroot_dialog.render();

        var cjt_validator = new CPANEL.validate.validator(LOCALE.maketext("Directory Path")); // eslint-disable-line new-cap

        cjt_validator.add(docroot_dialog.form.docroot,
            "dir_path",
            LOCALE.maketext("Directory paths cannot be empty or contain the following characters: [output,chr,92] ? % * : | [output,quot] [output,gt] [output,lt]"),
            null,
            { "no_width_height": 1 });

        if (!PAGE.public_html_subs_only) {
            cjt_validator.add(docroot_dialog.form.docroot,
                "reserved_directory",
                LOCALE.maketext("That directory is reserved for use by the system."),
                null,
                { "no_width_height": 1 });
        }

        cjt_validator.attach();
        docroot_dialog.showEvent.subscribe(cjt_validator.verify, cjt_validator, true);


        // hide error messages when we hide the dialog
        docroot_dialog.hideEvent.subscribe(function() {
            cjt_validator.clear_messages();
        }, cjt_validator, true);
    }
    CPANEL.util.set_text_content(document.getElementById("change_docroot_domaintxt"), domain);
    document.getElementById("change_docroot_subdomain").value = subdomain;
    document.getElementById("change_docroot_rootdomain").value = rootdomain;

    var alink = document.getElementById(domain + "_lnk");
    var uri = alink.href.split("?");
    var dirkeyval = decodeURIComponent(uri[1]).split("=");
    docroot = dirkeyval[1];
    docroot = docroot.replace(/^\//, "");
    var docrootEl = document.getElementById("change_docroot_dir");

    docrootEl.value = docroot;
    docroot_dialog.show();
};


function trapEnterPress(e) {
    var key = (window.event ? window.event.keyCode : e.which);
    return (key !== 13);
}
