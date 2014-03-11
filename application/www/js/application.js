/**
 *
 *@Author - Eugene Mutai
 *@Twitter - JheneKnights
 *@Email - eugenemutai@gmail.com
 *
 * Date: 11/10/13
 * Time: 2:06 PM
 * Description: All your applications business logic should fall in here
 *
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.opensource.org/licenses/gpl-2.0.php
 *
 * Copyright (C) 2013
 * @Version -
 */

//on document ready, as soon as it begins to load
$(function() {
    Lungo.init({name: "Obits", history: false});
})

//Set cookie defaults
$.cookie.defaults = {path: '/', expires: 432000 * 12, domain: location.href};

//Define angular app
var appEngine = angular.module('appEngine', [])

//Added a capitalisation filter
appEngine.filter('capitalize', function() {
    //FUNCTION TO CAPITALIZE THE !ST LETTERS IN A STRING
    String.prototype.capitalize = function() {
        return this.replace(/(^|\s)([a-z])/g, function(m, p1, p2) {
            return p1 + p2.toUpperCase();
        });
    };
    return function(input) {
        //if input string, do capitalize
        return typeof input == "string" ? input.capitalize() : input;
    }
});

appEngine.filter('timeago', function() {
    return function(input, format) {
        //if formating is needed to return a humanized date
        return format ? moment.unix(input).format('LL') : moment.unix(input).fromNow();
    }
})

//define the user 1st
var app = {
    user: {},
    scope: undefined,
    URL: {
        local: "http://localhost:3000",
        remote: "http://jkobits.aws.af.cm"
    },
    // Application Constructor
    initialize: function() {
        app.init();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    init: function() {
        document.addEventListener('deviceready', app.deviceready, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'prepareFunctions'
    // function, we must explicity call 'app.prepareFunctions(...);'
    deviceready: function() {
        app.prepareFunctions('deviceready');
        app.doFunctions();
    },
    prepareFunctions: function(param) {
        // prepare these functions to do something (event binding, initialise etc...)
        Lungo.dom('#homepage').on('load', function(event) {

        });
    },
    doFunctions: function() {
        //do something
        app.checkUser(); //check if user is alreaady logged in
    },
    checkUser: function(redirectTo) { //check to see if the USER is logged in the phone
        var user = app.storeThisSmartly('obitsUser');
        if (user) {
            console.log(user); //print out the user info that you have
            $.get(app.URL.remote + '/users', user).done(function(data) {
                app.scope.$apply(function() {
                    app.user = data;
                    if (redirectTo) Lungo.Router.article('homepage', redirectTo);
                })
                console.log(data);
            }).fail(function() {
                console.log("something went wrong getting user data");
            });
        } else { //if not redirect him to sign up/in
            Lungo.Router.section('signup-login');
        }
    },
    /** 
     * LOCAL STORAGE MANAGEMENT FUNCTION 
     * @param options - local(bool), content(object), backup(bool)
     * @param key
     * STORE CONTENT locally or in cookie or BOTH
     *
     * HOW TO USE: 
         app.storeThisSmartly('key') //Returns the content if existing, or false if it doesnt
         app.storeThisSmartly('key', {
            content: the content, can be a raw object, string or raw array //it is stringified by the function
            local: true/false //yes or no if you want to store only in localStorage
         })
     */
    storeThisSmartly: function(key, options) {
        if (options) { //store this data
            if (options.local) {
                localStorage.setItem(key, JSON.stringify(options.content));
            } else { //also in cookie too
                if ($.cookie) $.cookie(key, options.content);
                localStorage.setItem(key, JSON.stringify(options.content));
            }
        } else if (options == false) { //if options == false
            localStorage.removeItem(key);
            if ($.cookie) $.cookie(key, false); //remove everything
        }

        //if only one argument is given retrieve that data from localstorage
        return arguments.length == 1 ? JSON.parse(localStorage.getItem(key)) : false;
    }
}

//Now pass the apps business logics to angular
appEngine.controller('AppController', ['$scope', '$http', '$timeout',
    function AppController($scope, $http, $timeout) {
        //initialise app
        $scope.app = app;
        $scope.app.scope = $scope;
        $scope.page = {};
        $scope.page.posts = [];
        $scope.search = [];
        $scope.search.nothingfound = false;

        //check servers for the page
        $scope.queryServers = function(pageid, bool) {
            // nothing was found, ping the server for data
            jQuery.get($scope.app.URL.remote + '/viewpage', {
                pageid: pageid
            }).done(function(res) {
                //check if user follows page
                if ($scope.app.user.following.length !== 0) {
                    var p_ids = $.map($scope.app.user.following, function(m, i) {
                        // console.log($scope.app.user.following)
                        if(m) return m._id;
                    });
                }else{
                    var p_ids = [];
                }
                console.log(p_ids, pageid)
                var fw = $.inArray(pageid, p_ids) > -1 ? true : false;
                $scope.$apply(function() {
                    $scope.page = res.page;
                    $scope.page.id = res.page._id;
                    $scope.page.fwstatus = fw;
                    $scope.page.posts = res.posts;
                    if (!bool) Lungo.Router.section('view-page');
                })
                console.log(res.posts.map(function(m, i) {
                    return m.post;
                }));
            }).fail(function() {
                console.log("something went wrong getting page data");
            });
        }

        //event click on page request, check local cache before servers
        $scope.goToPage = function(page, key) {
            console.log(page, key);
            //if following array not empty
            if ($scope.app.user[key]['length'] !== 0) {
                var r = jQuery.grep($scope.app.user[key], function(m, i) {
                    if(m) return m._id === page._id;
                });
                //if anything was acquired.
                $scope.page.ispage = r.length > 0 ? true : false;
            } else {
                //does not own the page that will be loaded
                $scope.page.ispage = false;
            }
            $scope.queryServers(page._id); //query server for the page
        }

        //Create page function
        $scope.createPage = function(fd) {
            // console.log(fd)
            var request = {
                fullNames: fd.fullNames.$viewValue,
                dateofbirth: fd.dateofbirth.$viewValue,
                dateofdeath: fd.dateofdeath.$viewValue,
                causeofdeath: fd.causeofdeath.$viewValue ? fd.causeofdeath.$viewValue : "",
                arrangements: fd.arrangements.$viewValue ? fd.arrangements.$viewport : "",
                createdby: $scope.app.user._id
            }
            console.log("sending this to create page", request)
            jQuery.get($scope.app.URL.remote + '/createpage', request).done(function(res) {
                console.log("page was created successfully.", res);
                if (res.status) $scope.app.checkUser('page-list');
            }).fail(function(reason) {
                console.log("Failed to create page", reason)
            })
        }

        //create post
        $scope.createPost = function(fd) {
            console.log(fd);
            //check if page is owned by this user
            var r = $.inArray($scope.app.user.pageids, $('input#page-id').val()) > -1 ? true : false;
            var request = {
                post: fd.comment.$viewValue,
                username: $scope.page.ispage ? $scope.page.fullNames : $scope.app.user.fullNames,
                postedto: $scope.page.ispage == false ? $scope.page.fullNames : false,
                pageid: $scope.page.id,
                ispage: $scope.page.ispage
            }
            //If the one posting to the page does not own page, add his userid
            if (!request.ispage) request.userid = $scope.app.user._id;
            //Finish up
            console.log("sending this to create page", request)
            jQuery.get($scope.app.URL.remote + '/createpost', request).done(function(res) {
                console.log("added post to page successfully", res);
                if (res.status) { //Refresh page posts
                    $scope.queryServers(request.pageid);
                    $scope.checkUser(); //and also newsfeed
                }
            }).fail(function(reason) {
                console.log("Failed to create page", reason)
            })
        }

        //If user is following or unfollowing page
        $scope.followPrompt = function(pageid, fwstatus) {
            //if user is following page, make him unfollow
            var bool = fwstatus == true ? false : true
            //Is user following or unfollowing
            // var root = bool ? '/followpage': '/unfollowpage';
            jQuery.get($scope.app.URL.remote + '/followpage', {
                pageid: pageid,
                userid: $scope.app.user._id,
                bool: bool
            }).done(function(res) {
                console.log("following status", res, bool);
                if (res.status) {
                    //if user was unfollowing the page do redirect him
                    //to following article after refresh of user
                    var redirect = false;
                    bool ? false : 'following';
                    $scope.app.checkUser(redirect);
                    $scope.$apply(function() {
                        $scope.page.fwstatus = bool; //if he was following, update the button color
                    });
                }
            }).fail(function(reason) {
                console.log("Failed to create page", reason)
            })
        }

        $scope.searchPage = function(param) {
            console.log(param)
            if (param.length > 2) {
                $scope.$apply(function() {
                    $scope.search.nothingfound = false;
                }); //hide the nothing found part if shown
                jQuery.get($scope.app.URL.remote + '/searchpage', {
                    param: param
                }, function(res) {
                    if (res.status) {
                        $scope.$apply(function() {
                            $scope.search = res.results;
                        })
                    } else {
                        $scope.$apply(function() {
                            $scope.search = [];
                            $scope.search.nothingfound = true;
                        })
                    }
                })
            } else {
                $scope.$apply(function() {
                    $scope.search = [];
                    $scope.search.nothingfound = false;
                })
            }
        }

        $scope.signIn = function(fd) {
            var request = {
                fullNames: fd.fullNames.$viewValue,
                phoneNumber: fd.phoneNumber.$viewValue
            }
            //store in the localstorage
            $scope.app.storeThisSmartly('obitsUser', {
                content: request
            })
            //Now verify that the user exists
            $scope.app.checkUser('newsfeed'); //true - redirect to homepage
            console.log("sending this to sign in user", request)
        }

        $scope.logOut = function() {
            $scope.app.storeThisSmartly('obitsUser', false)
            Lungo.Router.section('signup-login');
        }

        //Refresh feed/user data every 45 seconds
        setInterval($scope.app.checkUser, 90000);

        //bind the app on document load
        angular.element(window).on('load', function() {
            // $scope.app.initialize();
            $scope.app.deviceready()
        })
    }
])