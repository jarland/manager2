/*
# base/frontend/paper_lantern/mail/pops/views/listEmailAccounts.js Copyright(c) 2018 cPanel, Inc.
#                                                                            All rights Reserved.
# copyright@cpanel.net                                                          http://cpanel.net
# This code is subject to the cPanel license.                  Unauthorized copying is prohibited
*/

/* global define: false, PAGE: false */

/* ----------------------------------------------------------------------
NOTE: The search term is preserved in localStorage. The value is prefixed
with `${PAGE.securityToken}:` so that we can expire the value between
sessions. This might make useful logic to put into a reusable module later.
----------------------------------------------------------------------*/

define(
    [
        "lodash",
        "angular",
        "cjt/util/locale",
        "uiBootstrap",
        "cjt/directives/actionButtonDirective",
        "cjt/directives/loadingPanel",
        "cjt/directives/toggleSortDirective",
        "cjt/directives/searchDirective",
        "cjt/directives/pageSizeDirective",
        "cjt/filters/startFromFilter",
        "cjt/decorators/paginationDecorator",
        "cjt/services/cpanel/componentSettingSaverService",
        "cjt/services/alertService"
    ],
    function(_, angular, LOCALE) {
        "use strict";

        var HTML_INFINITY = "&infin;";

        var app;
        try {
            app = angular.module("cpanel.mail.Pops");
        } catch (e) {
            app = angular.module("cpanel.mail.Pops", []);
        }

        app.controller("listEmailAccountsCtrl",
            [
                "$rootScope",
                "$scope",
                "$timeout",
                "$location",
                "emailAccountsService",
                "growl",
                "$routeParams",
                "$window",
                "componentSettingSaverService",
                "ONE_MEBIBYTE",
                "alertService",
                function(
                    $rootScope,
                    $scope,
                    $timeout,
                    $location,
                    emailAccountsService,
                    growl,
                    $routeParams,
                    $window,
                    componentSettingSaverService,
                    ONE_MEBIBYTE,
                    alertService
                ) {

                    var COMPONENT_NAME = "EmailAccountsTable";
                    var STORAGE_KEY    = "EmailAccountsListFilter";

                    $scope.requiredPasswordStrength = PAGE.requiredPasswordStrength;
                    $scope.webmailEnabled = PAGE.webmailEnabled;
                    $scope.externalAuthConfig = PAGE.externalAuthModulesConfigured;
                    $scope.showCalAndContacts = PAGE.showCalendarAndContactItems;
                    $scope.emailDiskUsageEnabled = PAGE.emailDiskUsageEnabled;
                    $scope.defaultQuota = PAGE.userDefinedQuotaDefaultValue;
                    $scope.maxQuota = PAGE.maxEmailQuota;
                    $scope.expandedAccount = undefined;
                    $scope.loadingEmailAccounts = false;
                    $scope.filterTermPending = true;
                    $scope.tableStatus = undefined;
                    $scope.isRTL = PAGE.isRTL;
                    $scope.storageKey = STORAGE_KEY;
                    $scope.canSetUnlimited = PAGE.canSetUnlimited !== undefined ? PAGE.canSetUnlimited : true;

                    $scope.actionModule = undefined;

                    $scope.passwordChange = {
                        password: undefined,
                        confirm: undefined
                    };

                    $scope.changingPassword = false;

                    $scope.quotaChange = {
                        quotaType: undefined,
                        quota: undefined
                    };

                    $scope.changingQuota = false;

                    if (!$rootScope.meta) {
                        $rootScope.meta = {

                            // sort settings
                            sortReverse: false,
                            sortBy: "user",
                            sortDirection: "asc",
                            sortFields: ["user", "domain", "has_suspended", "_diskused", "_diskquota", "diskusedpercent_float"],

                            // search settings
                            filterValue: "",

                            // pager settings
                            showPager: false,
                            maxPages: 5,
                            totalItems: 0,
                            currentPage: 1,
                            pageSize: 20,
                            pageSizes: [20, 50, 100, 500],
                            start: 0,
                            limit: 10
                        };
                    }

                    $scope.connectDevicesIcon = $scope.showCalAndContacts ? "fa-mobile-alt" : "fa-external-link-alt";

                    /**
                     * Sets the sort, paginiation, and filter settings based on the provided object
                     * @method setMetaFromComponentSettings
                     * @param  {Object} settings An object containing the settings
                     *  {
                     *      sortBy:        A string indicating which field to sort by, must be one of the values in $scope.meta.sortFields
                     *      sortDirection: A string indicating the sort direction, must be one of "asc" or "desc"
                     *      pageSize:      A string or integer indicating the page size, must be one of the values in $scope.meta.pageSizes
                     *      filterValue:   A string indicating the value for the search/filter input
                     *  }
                     */
                    $scope.setMetaFromComponentSettings = function(settings) {

                        if ( settings.hasOwnProperty("sortBy") && settings.sortBy && _.find($rootScope.meta.sortFields, function(f) {
                            return f === settings.sortBy;
                        }) ) {
                            $rootScope.meta.sortBy = settings.sortBy;
                        }

                        if ( settings.hasOwnProperty("sortDirection") && settings.sortDirection && (settings.sortDirection === "asc" || settings.sortDirection === "desc" ) ) {
                            $rootScope.meta.sortDirection = settings.sortDirection;
                        }

                        if ( settings.hasOwnProperty("pageSize") && settings.pageSize && _.find($rootScope.meta.pageSizes, function(s) {
                            return s === parseInt(settings.pageSize);
                        }) ) {
                            $rootScope.meta.pageSize = parseInt(settings.pageSize);
                        }

                    };

                    /**
                     * Stores the current values of sortBy, sortDirection, pageSize, and filterValue in the component settings
                     * @method saveMetaToComponentSettings
                     */
                    $scope.saveMetaToComponentSettings = function() {
                        componentSettingSaverService.set(COMPONENT_NAME, {
                            sortBy: $rootScope.meta.sortBy,
                            sortDirection: $rootScope.meta.sortDirection,
                            pageSize: $rootScope.meta.pageSize
                        });
                    };

                    $scope.clearTableStatus = function() {
                        $scope.tableStatus = undefined;
                    };

                    $scope.clearStatus = function(emailAccount) {

                        if ( emailAccount && $scope.expandedAccount === emailAccount ) {
                            alertService.clear(undefined, "alertGroup" + $rootScope.meta.accounts.indexOf(emailAccount));
                        }

                        // Account was deleted, remove it from the list
                        if ( emailAccount && emailAccount.deleted ) {

                            var index = $rootScope.meta.accounts.indexOf(emailAccount);

                            // Don't remove anything if the item isn't found in the list
                            if ( index > -1 ) {
                                $rootScope.meta.accounts.splice(index, 1);
                            }

                            if ( emailAccount === $scope.expandedAccount ) {
                                $scope.expandedAccount = undefined;
                            }

                            // If we've removed all the items on the page, but there are more items in the result set, fetch them
                            if ( $rootScope.meta.accounts.length === 0 && $rootScope.meta.totalItems > $rootScope.meta.pageSize ) {

                                // If we deleted the last item on the last page, go back by 1 page
                                if ( $rootScope.meta.currentPage === $rootScope.meta.totalPages ) {
                                    $rootScope.meta.currentPage--;
                                }

                                $scope.fetch();
                            }

                        }

                    };

                    $scope.onModuleOpened = function(index) {

                        var moduleContainer = angular.element("#dt_module_row_" + index);
                        if ( !moduleContainer || moduleContainer.length !== 1 ) {
                            return;
                        }

                        moduleContainer = moduleContainer[0];
                        var position = moduleContainer.getBoundingClientRect().top;
                        var moduleHeight = moduleContainer.getBoundingClientRect().height;

                        var bottom = position + moduleHeight;

                        if ( bottom > $window.innerHeight ) {
                            var body = angular.element("body");
                            body.animate({
                                scrollTop: (body[0].scrollTop + (bottom - $window.innerHeight))
                            });
                        }

                    };

                    /**
                     * Generic click handler for the cancel links in action modules
                     * @method cancelAction
                     */
                    $scope.cancelAction = function() {
                        $scope.expandedAccount = undefined;
                        $scope.actionModule = undefined;
                    };

                    /**
                     * Click handler for the password link, opens the change password module for the account
                     * @method onClickPassword
                     * @param  {Object} emailAccount The email account to open the change password module for
                     */
                    $scope.onClickPassword = function(emailAccount) {

                        $scope.passwordChange = {};

                        if ( $scope.expandedAccount === emailAccount && $scope.actionModule === "password" ) {
                            $scope.cancelAction();
                        } else {
                            $scope.clearStatus($scope.expandedAccount);
                            $scope.actionModule = "password";
                            $scope.expandedAccount = emailAccount;

                            $timeout(function() {
                                $scope.onModuleOpened($rootScope.meta.accounts.indexOf(emailAccount));
                            }, 350);
                        }

                    };

                    /**
                     * Click handler for the change password button, submits the new password to emailAccountsService.changePassword
                     * @method onClickChangePassword
                     */
                    $scope.onClickChangePassword = function() {

                        $scope.changingPassword = true;
                        $scope.clearStatus($scope.expandedAccount);

                        return emailAccountsService.changePassword($scope.expandedAccount.user, $scope.expandedAccount.domain, $scope.passwordChange.password).then(
                            function() {

                                alertService.add({
                                    message: LOCALE.maketext("Password for “[_1]” has been changed.", $scope.expandedAccount.user + "@" + $scope.expandedAccount.domain),
                                    type: "success",
                                    closeable: true,
                                    autoClose: 10000,
                                    group: "alertGroup" + $rootScope.meta.accounts.indexOf($scope.expandedAccount)
                                });

                                $scope.changingPassword = false;
                                $scope.passwordChange = {};
                                $scope.actionModule = undefined;
                            },
                            function(error) {
                                alertService.add({
                                    type: "danger",
                                    message: error,
                                    closeable: true,
                                    group: "alertGroup" + $rootScope.meta.accounts.indexOf($scope.expandedAccount)
                                });
                                $scope.changingPassword = false;
                            }
                        );

                    };

                    /**
                     * Click handler for the quota link, opens the change quota module for the account
                     * @method onClickQuota
                     * @param  {Object} emailAccount The email account to open the change quota module for
                     */
                    $scope.onClickQuota = function(emailAccount) {
                        if ( $scope.expandedAccount === emailAccount && $scope.actionModule === "quota" ) {
                            $scope.cancelAction();
                        } else {

                            $scope.clearStatus($scope.expandedAccount);

                            $scope.actionModule = "quota";
                            $scope.expandedAccount = emailAccount;

                            if ( !emailAccount._diskquota || emailAccount._diskquota === 0 ) {
                                $scope.quotaChange.quotaType = "unlimited";
                                $scope.quotaChange.quota = $scope.defaultQuota;
                            } else {
                                $scope.quotaChange.quotaType = "userdefined";
                                $scope.quotaChange.quota = emailAccount.diskquota;
                            }

                            $timeout(function() {
                                $scope.onModuleOpened($rootScope.meta.accounts.indexOf(emailAccount));
                            }, 350);
                        }
                    };

                    /**
                     * Click handler for the save button on the change quota module, submits the new quota to emailAccountsService.changeQuota
                     * @method onClickChangeQuota
                     */
                    $scope.onClickChangeQuota = function() {

                        // Debounce by 250ms just in case they hit enter really fast after changing the value
                        $timeout(function() {

                            var emailAccount = $scope.expandedAccount;
                            var quotaValue;

                            if ( $scope.quotaChange.quotaType === "unlimited" ) {
                                quotaValue = $scope.canSetUnlimited ? 0 : $scope.maxQuota;
                            } else {
                                quotaValue = parseInt($scope.quotaChange.quota);
                            }

                            if ( quotaValue === undefined || isNaN(quotaValue) ) {
                                return;
                            }

                            $scope.changingQuota = true;
                            $scope.clearStatus($scope.expandedAccount);

                            return emailAccountsService.changeQuota(emailAccount.user, emailAccount.domain, quotaValue).then(
                                function() {

                                    $scope.changingQuota = false;

                                    var statusText;

                                    if ( quotaValue === 0 ) {
                                        statusText = LOCALE.maketext("Changed Quota for “[_1]” to unlimited.", emailAccount.user + "@" + emailAccount.domain);
                                    } else {
                                        statusText = LOCALE.maketext("“[_1]”‘s quota is now [format_bytes,_2].", emailAccount.user + "@" + emailAccount.domain, quotaValue * ONE_MEBIBYTE);
                                    }

                                    alertService.add({
                                        type: "success",
                                        message: statusText,
                                        closeable: true,
                                        autoClose: 10000,
                                        group: "alertGroup" + $rootScope.meta.accounts.indexOf($scope.expandedAccount)
                                    });

                                    if ( quotaValue === 0 ) {
                                        emailAccount._diskquota = 0;
                                        emailAccount.diskquota = "unlimited";
                                        emailAccount.humandiskquota = HTML_INFINITY;
                                        emailAccount.diskusedpercent_float = emailAccount.diskusedpercent = 0;
                                    } else {
                                        emailAccount._diskquota = quotaValue * ONE_MEBIBYTE;
                                        emailAccount.diskquota = quotaValue;
                                        emailAccount.humandiskquota = LOCALE.format_bytes(emailAccount._diskquota);
                                        emailAccount.diskusedpercent_float = emailAccount.diskusedpercent = ((emailAccount._diskused / emailAccount._diskquota) * 100).toFixed(2);
                                    }

                                    emailAccount.humandiskusedpercent = LOCALE.numf(emailAccount.diskusedpercent_float) + "%";

                                    $scope.actionModule = undefined;
                                },
                                function(error) {
                                    $scope.changingQuota = false;
                                    alertService.add({
                                        type: "danger",
                                        message: error,
                                        closeable: true,
                                        group: "alertGroup" + $rootScope.meta.accounts.indexOf($scope.expandedAccount)
                                    });
                                }
                            );

                        }, 250);
                    };

                    /**
                     * Click handler for the delete link, opens the delete module for the account
                     * @method onClickDelete
                     * @param  {Object} emailAccount The email account to open the delete module for
                     */
                    $scope.onClickDelete = function(emailAccount) {
                        if ( $scope.expandedAccount === emailAccount && $scope.actionModule === "delete" ) {
                            $scope.cancelAction();
                        } else {
                            $scope.clearStatus($scope.expandedAccount);
                            $scope.actionModule = "delete";
                            $scope.expandedAccount = emailAccount;

                            $timeout(function() {
                                $scope.onModuleOpened($rootScope.meta.accounts.indexOf(emailAccount));
                            }, 350);
                        }
                    };

                    /**
                     * Click handler for the delete button on the delete module, submits the account to emailAccountService.deleteEmailAccount
                     * @method onClickDeleteConfirm
                     */
                    $scope.onClickDeleteConfirm = function() {

                        $scope.deletingAccount = true;
                        $scope.clearStatus($scope.expandedAccount);
                        $scope.expandedAccount.deleting = true;

                        // If we're removing the last item in the list, clear the green on the search box
                        if ( $rootScope.meta.accounts.length === 1 && $rootScope.meta.filterValue ) {
                            $scope.filterTermPending = true;
                        }

                        return emailAccountsService.deleteEmailAccount($scope.expandedAccount.user, $scope.expandedAccount.domain).then(
                            function() {

                                var status = {
                                    message: LOCALE.maketext("Account “[_1]” deleted.", $scope.expandedAccount.user + "@" + $scope.expandedAccount.domain),
                                    type: "success",
                                    closeable: true,
                                    autoClose: 10000
                                };

                                $scope.filterTermPending = false;
                                $scope.expandedAccount.deleted = true;

                                // Special handling for when the last record is removed from a filtered list
                                // Allows the search to go red while the deleted status stays displayed for 10s
                                if ( $rootScope.meta.filterValue && $rootScope.meta.accounts.length === 1 && $rootScope.meta.totalItems <= $rootScope.meta.pageSize ) {

                                    status.group = "tableStatus";

                                    alertService.add(status);

                                    // 250ms timeout to allow the action module to slide closed before clearing the list
                                    $timeout(function() {
                                        $rootScope.meta.accounts = [];
                                    }, 250);

                                } else {
                                    status.group = "alertGroup" + $rootScope.meta.accounts.indexOf($scope.expandedAccount);
                                    alertService.add(status);
                                }

                                $scope.deletingAccount = false;
                                $scope.actionModule = undefined;
                            },
                            function(error) {
                                alertService.add({
                                    type: "danger",
                                    message: error,
                                    closeable: true,
                                    group: "alertGroup" + $rootScope.meta.accounts.indexOf($scope.expandedAccount)
                                });
                                $scope.deletingAccount = false;
                            }
                        );
                    };

                    /**
                     * Click handler for the Set Up Mail Client link, opens the setup module for the account
                     * @method onClickSetup
                     */
                    $scope.onClickSetup = function(emailAccount) {

                        if ( $scope.showCalAndContacts ) {
                            if ( $scope.expandedAccount === emailAccount && $scope.actionModule === "setup" ) {
                                $scope.cancelAction();
                            } else {
                                $scope.actionModule = "setup";
                                $scope.expandedAccount = emailAccount;

                                $timeout(function() {
                                    $scope.onModuleOpened($rootScope.meta.accounts.indexOf(emailAccount));
                                }, 350);
                            }
                        } else {
                            $window.open("../clientconf.html?acct=" + $window.encodeURIComponent(emailAccount.email), "_blank");
                        }

                    },

                    /**
                     * Click handler for the Manage Suspension link, opens the suspend module for the account
                     * @method onClickSuspendOptions
                     */
                    $scope.onClickSuspendOptions = function(emailAccount) {
                        if ( $scope.expandedAccount === emailAccount && $scope.actionModule === "suspend" ) {
                            $scope.cancelAction();
                        } else {

                            if ( $scope.expandedAccount ) {
                                $scope.expandedAccount.status = undefined;
                            }

                            $scope.actionModule = "suspend";
                            $scope.expandedAccount = emailAccount;

                            var outgoing = emailAccount.suspended_outgoing === true ? "suspend" : emailAccount.hold_outgoing === true ? "hold" : "allow";

                            $scope.suspendOptions = {
                                login: emailAccount.suspended_login,
                                incoming: emailAccount.suspended_incoming,
                                outgoing: outgoing,
                                currentOutgoing: outgoing, // Extra field for the current outgoing so we know whether or not they have held messages
                                deleteHeldMessages: 0
                            };

                            if ( outgoing === "hold" ) {

                                $scope.checkingHolds = true;

                                emailAccountsService.getHeldMessageCount(emailAccount.email).then(
                                    function(messageCount) {
                                        $scope.checkingHolds = false;
                                        $scope.suspendOptions.currentlyHeld = messageCount;
                                    },
                                    function(error) {
                                        $scope.checkingHolds = false;
                                        alertService.add({
                                            type: "danger",
                                            message: error,
                                            closeable: true,
                                            group: "alertGroup" + $rootScope.meta.accounts.indexOf($scope.expandedAccount),
                                            replace: false
                                        });
                                    }
                                );
                            }

                            $timeout(function() {
                                $scope.onModuleOpened($rootScope.meta.accounts.indexOf(emailAccount));
                            }, 350);
                        }
                    };

                    $scope.onClickSaveSuspensions = function() {

                        $scope.clearStatus($scope.expandedAccount);
                        $scope.suspending = true;

                        var deleteHeld = $scope.suspendOptions.deleteHeldMessages;
                        var currentOutgoing = $scope.suspendOptions.currentOutgoing;

                        delete $scope.suspendOptions.deleteHeldMessages;
                        delete $scope.suspendOptions.currentOutgoing;
                        delete $scope.suspendOptions.currentlyHeld;

                        var alertGroupId = $rootScope.meta.accounts.indexOf($scope.expandedAccount);

                        var changeSuspensionsSuccess = function(results) {

                            results.forEach(function(result) {

                                if ( result.message !== undefined ) {

                                    // See _createAPICall and changeSuspensions in emailAccountsService for why this uses _assign
                                    alertService.add(_.assign({
                                        closeable: true,
                                        group: "alertGroup" + alertGroupId,
                                        replace: false
                                    }, result));
                                }

                                if ( result.type === "success" ) {
                                    switch (result.method) {
                                        case "suspend_login":
                                            $scope.expandedAccount.suspended_login = true;
                                            break;
                                        case "unsuspend_login":
                                            $scope.expandedAccount.suspended_login = false;
                                            break;
                                        case "suspend_incoming":
                                            $scope.expandedAccount.suspended_incoming = true;
                                            break;
                                        case "unsuspend_incoming":
                                            $scope.expandedAccount.suspended_incoming = false;
                                            break;
                                        case "suspend_outgoing":
                                            $scope.expandedAccount.suspended_outgoing = true;
                                            break;
                                        case "unsuspend_outgoing":
                                            $scope.expandedAccount.suspended_outgoing = false;
                                            break;
                                        case "hold_outgoing":
                                            $scope.expandedAccount.hold_outgoing = true;
                                            break;
                                        case "release_outgoing":
                                            $scope.expandedAccount.hold_outgoing = false;
                                            break;
                                    }
                                }

                            });

                            $scope.suspending = false;

                            $scope.expandedAccount.has_suspended = $scope.expandedAccount.suspended_login || $scope.expandedAccount.suspended_incoming || $scope.expandedAccount.suspended_outgoing || $scope.expandedAccount.hold_outgoing;

                            $scope.actionModule = undefined;
                        };

                        var changeSuspensionsError = function(errors) {

                            errors.forEach(function(error) {
                                alertService.add({
                                    type: "danger",
                                    message: error,
                                    closeable: true,
                                    group: "alertGroup" + alertGroupId,
                                    replace: false
                                });
                            });

                            $scope.suspending = false;
                        };

                        // If deleting held messages, do that first and only change the suspensions if there's no error from deleting
                        if ( deleteHeld ) {

                            var releaseAfterDelete = (currentOutgoing === "hold" && $scope.suspendOptions.outgoing === "allow") ? 1 : 0;

                            return emailAccountsService.deleteHeldMessages($scope.expandedAccount.email, releaseAfterDelete).then(
                                function(deletedCount) {

                                    alertService.add({
                                        message: LOCALE.maketext("[numf,_1] messages have been queued for deletion from the outgoing mail queue.", deletedCount),
                                        type: "success",
                                        closeable: true,
                                        autoClose: 10000,
                                        group: "alertGroup" + alertGroupId,
                                        replace: false
                                    });

                                    if ( releaseAfterDelete === 1 ) {
                                        $scope.suspendOptions.outgoing = "hold";
                                    }

                                    return emailAccountsService.changeSuspensions($scope.expandedAccount, $scope.suspendOptions).then(changeSuspensionsSuccess, changeSuspensionsError);
                                },
                                function(error) {

                                    $scope.suspending = false;

                                    alertService.add({
                                        type: "danger",
                                        message: error,
                                        closeable: true,
                                        group: "alertGroup" + alertGroupId,
                                        replace: false
                                    });
                                }
                            );
                        } else {
                            return emailAccountsService.changeSuspensions($scope.expandedAccount, $scope.suspendOptions).then(changeSuspensionsSuccess, changeSuspensionsError);
                        }

                    };

                    /**
                     * Callback for clicking on one of the table headers to sort by column
                     */
                    $scope.sortList = function() {

                        if ( $scope.currentFetchTimeout ) {
                            $timeout.cancel($scope.currentFetchTimeout);
                        }

                        $scope.currentFetchTimeout = $timeout(function() {
                            $scope.saveMetaToComponentSettings();
                            $rootScope.meta.currentPage = 1;
                            $scope.fetch();
                        }, 250);
                    };

                    /**
                     * Callback for clicking on one of the pagination nav links to move between pages
                     */
                    $scope.selectPage = function() {

                        if ( $scope.currentFetchTimeout ) {
                            $timeout.cancel($scope.currentFetchTimeout);
                        }

                        $scope.currentFetchTimeout = $timeout(function() {
                            $scope.fetch();
                        }, 250);
                    };

                    /**
                     * Callback for selecting a page size from the pagination <select>
                     */
                    $scope.selectPageSize = function() {

                        if ( $scope.currentFetchTimeout ) {
                            $timeout.cancel($scope.currentFetchTimeout);
                        }

                        $scope.currentFetchTimeout = $timeout(function() {
                            $scope.saveMetaToComponentSettings();
                            $rootScope.meta.currentPage = 1;
                            $scope.fetch();
                        }, 250);
                    };

                    /**
                     * Callback for entering filter input into the search bar
                     */
                    $scope.searchList = function() {

                        $scope.filterTermPending = true;

                        if ( $scope.currentFetchTimeout ) {
                            $timeout.cancel($scope.currentFetchTimeout);
                        }

                        localStorage.setItem(
                            $scope.storageKey,
                            PAGE.securityToken + ":" + $rootScope.meta.filterValue
                        );

                        $scope.currentFetchTimeout = $timeout(function() {
                            $rootScope.meta.currentPage = 1;
                            $scope.fetch();
                        }, 250);
                    };

                    /**
                     * Callback that clears the expandedAccount field after all open modules have been collapsed
                     */
                    $scope.collapseFinished = function() {
                        if ( $scope.actionModule === undefined ) {
                            $scope.expandedAccount = undefined;
                        }
                    };

                    /**
                     * Calls emailAccountsService.getEmailAccounts to load the email accounts for the current page
                     */
                    $scope.fetch = function() {

                        $scope.loadingEmailAccounts = true;
                        $rootScope.meta.mobileItemCountText = undefined;

                        var sortMethod = "lexicographic";

                        if ( $rootScope.meta.sortBy === "_diskused" || $rootScope.meta.sortBy === "diskusedpercent" || $rootScope.meta.sortBy === "has_suspended" ) {
                            sortMethod = "numeric";
                        } else if ( $rootScope.meta.sortBy === "_diskquota" ) {
                            sortMethod = "numeric_zero_as_max";
                        }

                        var apiParams = {
                            "api.sort": 1,
                            "api.sort_column": $rootScope.meta.sortBy,
                            "api.sort_method": sortMethod,
                            "api.sort_reverse": $rootScope.meta.sortDirection === "asc" ? 0 : 1,
                            "api.paginate": 1,
                            "api.paginate_start": ($rootScope.meta.currentPage - 1) * $rootScope.meta.pageSize,
                            "api.paginate_size": $rootScope.meta.pageSize,
                            "api.paginate_page": $rootScope.meta.currentPage
                        };

                        if ( $rootScope.meta.filterValue && $rootScope.meta.filterValue !== "" ) {
                            apiParams["api.filter"] = 1;
                            apiParams["api.filter_term_0"] = $rootScope.meta.filterValue;
                            apiParams["api.filter_column_0"] = "login";
                        }

                        $rootScope.meta.accounts = [];

                        // Setting min-height to the current height to prevent the page jumping
                        // around when the list is fetching
                        var container = angular.element("#popsAccountList");

                        if ( container && container[0] ) {
                            container.css({ minHeight: $window.getComputedStyle(container[0]).height });
                        }

                        var apiPromise = emailAccountsService.getEmailAccounts(apiParams);
                        $scope.fetchPromise = apiPromise;

                        apiPromise.then(
                            function(response) {

                                // We only want to actually process the response if it's the last request we sent
                                if ( $scope.fetchPromise !== apiPromise ) {
                                    return;
                                }

                                var data = response.data;
                                var metadata = response.meta;

                                // Don't redirect to /addEmailAccount if there's a filterValue defined
                                if ( metadata.paginate.total_records === 0 && $rootScope.initialLoad && !$rootScope.meta.filterValue ) {
                                    $rootScope.initialLoad = false;
                                    $location.path("/addEmailAccount");
                                } else {

                                    $rootScope.initialLoad = false;
                                    $rootScope.meta.totalItems = metadata.paginate.total_records;
                                    $rootScope.meta.totalPages = metadata.paginate.total_pages;

                                    if ($rootScope.meta.totalItems > _.min($rootScope.meta.pageSizes)) {
                                        $rootScope.meta.showPager = true;
                                        var start = ($rootScope.meta.currentPage - 1) * $rootScope.meta.pageSize;
                                        $rootScope.meta.start = start + 1;
                                        $rootScope.meta.limit = start + data.length;

                                    } else {

                                        // hide pager and pagination
                                        $rootScope.meta.showPager = false;

                                        if (data.length === 0) {
                                            $rootScope.meta.start = 0;
                                        } else {

                                        // table statistics
                                            $rootScope.meta.start = 1;
                                        }

                                        $rootScope.meta.limit = data.length;
                                    }

                                    $rootScope.meta.mobileItemCountText = LOCALE.maketext("Displaying [_1] to [_2] out of [_3] records",
                                        $rootScope.meta.start, $rootScope.meta.limit, $rootScope.meta.totalItems
                                    );

                                    angular.element("#popsAccountList").css({ minHeight: "" });
                                    $rootScope.meta.accounts = data;
                                    $scope.loadingEmailAccounts = false;
                                    $scope.filterTermPending = false;
                                }

                            },
                            function(error) {
                                growl.error(error);
                                $scope.loadingEmailAccounts = false;
                                $scope.filterTermPending = false;
                            }
                        );

                    };

                    $scope.getSearchClass = function() {
                        if ( !$rootScope.initialLoad && !$scope.filterTermPending && !$scope.loadingEmailAccounts && $scope.meta.filterValue ) {
                            return $rootScope.meta.accounts && $rootScope.meta.accounts.length > 0 ? "success" : "danger";
                        } else {
                            return "";
                        }
                    };

                    var unregisterAddListener = $rootScope.$on("emailAccountAdded", $scope.fetch);

                    if ( $rootScope.initialLoad && PAGE.nvdata && PAGE.nvdata.hasOwnProperty(COMPONENT_NAME) ) {
                        $scope.setMetaFromComponentSettings(PAGE.nvdata[COMPONENT_NAME]);
                    }

                    var storageValue = localStorage.getItem($scope.storageKey);
                    if ( storageValue && (0 === storageValue.indexOf(PAGE.securityToken + ":")) ) {
                        $rootScope.meta.filterValue = storageValue.substr( 1 + PAGE.securityToken.length );
                    }

                    if ( $routeParams.account && $routeParams.account !== $rootScope.meta.filterValue ) {
                        $rootScope.meta.filterValue = $routeParams.account;
                        $rootScope.meta.accounts = undefined;
                    }

                    $scope.$on("$destroy", function() {
                        componentSettingSaverService.unregister(COMPONENT_NAME);
                        unregisterAddListener();
                    });

                    if ( $rootScope.initialLoad ) {
                        componentSettingSaverService.register(COMPONENT_NAME);
                        $timeout($scope.fetch);
                    } else {
                        var register = componentSettingSaverService.register(COMPONENT_NAME);
                        if ( register ) {
                            register.then(
                                function(result) {
                                    if ( result ) {

                                        if ( $routeParams.account && $routeParams.account !== result.filterValue ) {
                                            result.filterValue = $routeParams.account;
                                            $rootScope.meta.currentPage = 1;
                                            $rootScope.meta.accounts = undefined;
                                            $scope.saveMetaToComponentSettings();
                                        }

                                        $scope.setMetaFromComponentSettings(result);
                                    }

                                    if ( !$rootScope.meta.accounts ) {
                                        $scope.fetch();
                                    }

                                },
                                function() {
                                    if ( !$rootScope.meta.accounts ) {
                                        $scope.fetch();
                                    }
                                }
                            );
                        }
                    }
                }
            ]
        );

    }
);
