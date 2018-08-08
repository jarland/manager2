//~~GENERATED~~
//-------------------------------------------------------------
// Source:    /usr/local/cpanel/base/frontend/paper_lantern/user_manager/index.cmb.js
// Generated: /usr/local/cpanel/base/frontend/paper_lantern/user_manager/index.cmb-sl.js
// Module:    /paper_lantern/user_manager/index.cmb-sl
// Locale:    sl
// This file is generated by the cpanel localization system
// using the bin/_build_translated_js_hash_files.pl script.
//-------------------------------------------------------------
// !!! Do not hand edit this file !!!
//-------------------------------------------------------------
(function() {
    // The raw lexicon.
    var newLex = {"Do you wish to remove the “[_1]” user from your system?":"Do you wish to remove the “[_1]” user from your system?","Email":"Email","Error:":"Error:","FTP":"FTP","Hypothetical Subaccount":"Hypothetical Subaccount","Invite Expired":"Invite Expired","Invite Pending":"Invite Pending","Mail Quota Reached:":"Mail Quota Reached:","Mail Quota Warning:":"Mail Quota Warning:","Quotas cannot exceed [format_bytes,_1].":"Quotas cannot exceed [format_bytes,_1].","Service Account":"Service Account","Subaccount":"Subaccount","The combined length of the username, [asis,@] character, and domain cannot exceed [numf,_1] characters.":"The combined length of the username, [asis,@] character, and domain cannot exceed [numf,_1] characters.","The service account is invalid.":"The service account is invalid.","The system cannot upgrade this service account to a [asis,subaccount]. To access all the features within this interface, you must delete any accounts that share the same username or link this service account to a [asis,subaccount].":"The system cannot upgrade this service account to a [asis,subaccount]. To access all the features within this interface, you must delete any accounts that share the same username or link this service account to a [asis,subaccount].","The system could not delete the “[_1]” account. You cannot delete the “[_2]” account type.":"The system could not delete the “[_1]” account. You cannot delete the “[_2]” account type.","The system could not determine the service type for the “[_1]” service account.":"The system could not determine the service type for the “[_1]” service account.","The system could not load the [asis,subaccount] with the following error: [_1]":"The system could not load the [asis,subaccount] with the following error: [_1]","The system could not load the service account with the following error: [_1]":"The system could not load the service account with the following error: [_1]","The system detected an unknown service for the “[_1]” service account.":"The system detected an unknown service for the “[_1]” service account.","The system did not recognize the update mode: [_1]":"The system did not recognize the update mode: [_1]","The system failed to create the “[_1]” user with the following error: [_2]":"The system failed to create the “[_1]” user with the following error: [_2]","The system failed to determine whether the username is available: [_1]":"The system failed to determine whether the username is available: [_1]","The system failed to modify the service account for “[_1]”: [_2]":"The system failed to modify the service account for “[_1]”: [_2]","The system failed to unlink the “[_1]” service with the following error: [_2]":"The system failed to unlink the “[_1]” service with the following error: [_2]","The system failed to update the “[_1]” user with the following error: [_2]":"The system failed to update the “[_1]” user with the following error: [_2]","The system failed to upgrade the “[_1]” service account to a [asis,subaccount] with the following error: [_2]":"The system failed to upgrade the “[_1]” service account to a [asis,subaccount] with the following error: [_2]","The system successfully linked all of the service accounts for the “[_1]” user to the [asis,subaccount]. The service account passwords did not change.":"The system successfully linked all of the service accounts for the “[_1]” user to the [asis,subaccount]. The service account passwords did not change.","The system successfully linked all of the service accounts for the “[_1]” user to the [asis,subaccount]. The service account passwords did not change. You must provide a new password if you wish to enable any additional [asis,subaccount] services.":"The system successfully linked all of the service accounts for the “[_1]” user to the [asis,subaccount]. The service account passwords did not change. You must provide a new password if you wish to enable any additional [asis,subaccount] services.","The system successfully linked the service account to the “[_1]” user’s [asis,subaccount]. The service account passwords did not change. You must provide a new password if you wish to enable any additional [asis,subaccount] services.":"The system successfully linked the service account to the “[_1]” user’s [asis,subaccount]. The service account passwords did not change. You must provide a new password if you wish to enable any additional [asis,subaccount] services.","The system successfully linked the service account to the “[_1]” user’s [asis,subaccount]. The service account passwords have not changed.":"The system successfully linked the service account to the “[_1]” user’s [asis,subaccount]. The service account passwords have not changed.","The system successfully linked the service account to the “[_1]” user’s [asis,subaccount]. The service account passwords have not changed. You must provide a new password if you enable any additional [asis,subaccount] services.":"The system successfully linked the service account to the “[_1]” user’s [asis,subaccount]. The service account passwords have not changed. You must provide a new password if you enable any additional [asis,subaccount] services.","The system successfully modified the service account: [_1]":"The system successfully modified the service account: [_1]","The system successfully unlinked the “[_1]” service.":"The system successfully unlinked the “[_1]” service.","The system successfully updated the following user: [_1]":"The system successfully updated the following user: [_1]","The username is not available.":"The username is not available.","This user did not respond to the invitation before it expired. Please delete and re-create the user to send another invitation or set the user’s password yourself.":"This user did not respond to the invitation before it expired. Please delete and re-create the user to send another invitation or set the user’s password yourself.","This user has not used the invitation to set a password.":"This user has not used the invitation to set a password.","Warning:":"Warning:","Web Disk":"Web Disk","You cannot edit the account.":"You cannot edit the account.","You cannot enable additional services for this [asis,subaccount] until you set its password. When you set the password, all of your services will utilize the same password.":"You cannot enable additional services for this [asis,subaccount] until you set its password. When you set the password, all of your services will utilize the same password.","You did not select a [asis,subaccount].":"You did not select a [asis,subaccount].","You did not select a valid service account.":"You did not select a valid service account.","You successfully created the following user: [_1]":"You successfully created the following user: [_1]","Your [asis,cPanel] account exceeds its disk quota. You cannot add or edit users.":"Your [asis,cPanel] account exceeds its disk quota. You cannot add or edit users.","[asis,FTP] Quota Reached:":"[asis,FTP] Quota Reached:","[asis,FTP] Quota Warning:":"[asis,FTP] Quota Warning:","cPanel Account":"cPanel Account"};

    if (!this.LEXICON) {
        this.LEXICON = {};
    }

    for(var item in newLex) {
        if(newLex.hasOwnProperty(item)) {
            var value = newLex[item];
            if (typeof(value) === "string" && value !== "") {
                // Only add it if there is a value.
                this.LEXICON[item] = value;
            }
        }
    }
})();
//~~END-GENERATED~~
