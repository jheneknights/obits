//CONFIG MONGO coonection - AppFog
if (process.env.VCAP_SERVICES) {
    var env = JSON.parse(process.env.VCAP_SERVICES);
    var mongo = env['mongodb-1.8'][0]['credentials'];
} else {
    var mongo = {
        "hostname": "localhost",
        "port": 27017,
        "username": "",
        "password": "",
        "name": "",
        "db": "obits"
    }
}
var generate_mongo_url = function(obj) {
    obj.hostname = (obj.hostname || 'localhost');
    obj.port = (obj.port || 27017);
    obj.db = (obj.db || 'test');
    if (obj.username && obj.password) {
        return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
    } else {
        return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
}
var mongourl = generate_mongo_url(mongo);
console.log(mongourl);

//Load up required modules
var moment = require('moment'), //momentjs
    db = require('mongoskin').db(mongourl, {
        safe: true
    }), //connection to mongodb
    promise = require('promised-io/promise'), //for asynchronous function managements
    jQuery = require('jquery'), //jQuery
    uc = require('underscore'), //UnderscoreJS
    $ = jQuery,
    _ = uc,
    Deferred = promise.Deferred; //will handle asychronous file flows

//the collections/tables to be in use
var users = db.collection('users'),
    pages = db.collection('pages'),
    posts = db.collection('posts'),
    following = db.collection('following');

var schemas = {
    "user": { //an example of a row in the collection/table
        firstname: "Eugene",
        lastname: "Mutai",
        fullNames: "Eugene Mutai",
        phoneNo: "254723001575",
        profpic: false,
        lastlogin: moment().unix(),
        regdate: moment().unix(), //in unix Epoch time
        ispage: false
    },
    "post": {
        post: "string",
        createdby: "userid", //or "schemas.page",
        username: "username",
        profpic: "./images/appbar.user.tie.png",
        postedto: false, //if page post
        pageid: false, //if not page
        createdat: moment().unix(),
        ispage: "schemas.user.ispage" //boolean - false == page
    },
    "page": {
        firstname: "",
        lastname: "",
        fullNames: "",
        dateofdeath: "date",
        causeofdeath: null,
        dateofbirth: "date",
        arrangements: null,
        profilepic: false,
        createdby: "userid",
        createdat: moment().unix(),
        ispage: true
    },
    "following": {
        user: "userid",
        following: ["schemas.page", "schemas.page", "schemas.page", '...hvo hvo!!'],
        bool: true
    }
}

/* PARAMS
var params_GET = {
    status: 200,
    message: "user request PARAMS",
    request: req.query
}
*/

//Get the PARAMS and check if user exist
exports.users = function(req, res) {
    //forward the request to the app functions
    app.checkUser(req.query, res);
}

exports.feeds = function(req, res) {
    app.checkUser(req.query, res)
}

exports.createpage = function(req, res) {
    app.createPage(req.query, res);
}

exports.viewpage = function(req, res) {
    //will check page and also laod back page results too if page exists
    app.getPageFeed(req.query.pageid).then(function(results) {
        res.json(results);
    });
}

exports.getuserpages = function(req, res) {
    //get all the pages that belong to the user or is following
}

exports.createpost = function(req, res) {
    app.createPost(req.query, res);
}

exports.following = function(req, res) {
    //get all the pages the user follows and return results
    app.getUserPages(req.query.userid).then(function(results) {
        res.json(results);
    });
}
exports.followpage = function(req, res) {
    //get the page details 1st
    app.viewPage(req.query.pageid).then(function(results) {
        //then add or remove page to user's list
        if (req.query.bool == "true") {
            app.addFollower(results.page, req.query.userid, res);
        } else {
            app.removeFollower(results.page, req.query.userid, res);
        }
    })
}

exports.searchpage = function(req, res) {
    // search and send back the results
    app.searchPage(req.query.param).then(function(results) {
        res.json(results);
    });
}

exports.emptydb = function(r, res) {
    app.emptyCollection();
    res.json({status: "OK", message: "emptied the database"});
}

var app = {
    checkUser: function(p, r) {
        var userSearch = { //user search param
            phoneNo: p.phoneNumber.replace(/^\+/, '').trim(), //remove plus
            firstname: p.fullNames.split(' ')[0].toLowerCase().trim() //eugene
        };
        //find the user 1st, check existense
        users.findOne(userSearch, function(e, res) {
            //console.log(res)
            if (e) throw e; //incase of any errors, stop!
            if (res) { //user exist, do something...
                var user = res;
                console.info("We found something. next: generating a response...");

                /* chained these
                - get pages that user has created
                - get pages that the user is following
                - get user feeds
                */

                var response = user
                //get user pages, followers and lastly newsfeed
                app.getUserPages(user._id).then(function(data) {
                    response.pages = data;
                    //get followers
                    app.getFollowers(user._id).then(function(data) {
                        response.following = data;
                        console.log("pages", response.pages)
                        //get user's newfeed
                        if (!_.isEmpty(response.pages)) {
                            var pageids = _.pluck(response.pages, '_id');
                            var params = _.compact(_.flatten(_.zip(pageids, [user._id])));
                        } else {
                            var params = [user._id]
                        }
                        console.log("params", params);
                        //add to response
                        response.pageids = pageids ? pageids : [];
                        //now fetch the user's newsfeed
                        app.getNewsFeed(params, user._id).then(function(data) {
                            response.posts = data;
                            //send back the JSON results
                            r.json(response);
                        });
                    })
                })
            } else { //if does not exist       
                //if nothing was found create that entry for now
                console.log("user does not exist, will proceed in creating new account...")
                app.createUser(p, app.server);
            }
        });
    },
    //create new user
    createUser: function(p, r) {
        var user = schemas.user;
        var names = p.fullNames.toLowerCase().trim().split(' '); // ['eugene', 'mutai']

        user.fullNames = p.fullNames.toLowerCase();
        user.phoneNo = p.phoneNumber.replace(/^\+/, '').trim(); //remove plus
        user.firstname = names[0];
        user.lastname = names[1];

        //Add the user to the DB
        users.insert(user, function(e, res) {
            if (e) throw e;
            if (res) {
                console.info("new user created successfully.");
                //thats done loop back to proceedure
                app.checkUser(p, r); //now recheck user
            }
        })
    },
    createPost: function(p, r) {
        var post = schemas.post

        post.post = p.post;
        post.createdby = p.userid == undefined ? p.pageid : p.userid; //if no userid --> use pageid {page post}
        post.username = p.username;
        post.postedto = p.ispage == "false" ? p.postedto : false;
        post.pageid = p.pageid; //a page id must me existent, all posts are page related
        post.ispage = p.ispage //boolean

        //add post
        posts.insert(post, function(e, res) {
            if (e) throw e;
            if (res) {
                var message = "Post has been added at " + moment().format()
                console.info();
                r.json({
                    status: true,
                    message: message
                })
            }
        });
    },
    createPage: function(p, r) {
        var page = schemas.page;
        var names = p.fullNames.toLowerCase().trim().split(' ');

        page.fullNames = p.fullNames.toLowerCase();
        page.firstname = names[0];
        page.lastname = names[1];

        page.dateofbirth = moment(p.dateofbirth, ['DD MM YY', 'DD MM YYYY']).unix();
        page.dateofdeath = moment(p.dateofdeath, ['DD MM YY', 'DD MM YYYY']).unix();
        page.causeofdeath = p.causeofdeath;
        page.arrangements = p.arrangements;
        page.createdby = p.createdby.trim()
        console.log(page);

        //add page
        pages.insert(page, function(e, res) {
            if (e) throw e;
            if (res) {
                var message = "Page has been added at " + moment().format()
                console.info(message);
                r.json({
                    status: true,
                    message: message
                });
                // add user to the page as a follower, get pageid 1st
                app.addFollower(page, p.userid)
            }
        });
    },
    viewPage: function(pageid) {
        var deferred = new Deferred();
        pages.findOne({
            _id: db.ObjectID.createFromHexString(pageid)
        }, function(e, res) {
            if (e) throw e;
            if (res) {
                deferred.resolve(res)
            } else {
                // no page was found
                deferred.resolve({
                    status: false,
                    message: "oops! no such page exists/created in obits"
                })
            }
        })
        return deferred.promise;
    },
    //next -- callback or respond to server
    getUserPages: function(userid) {
        var deferred = new Deferred();
        var re = new RegExp(userid, 'gi');
        pages.find({
            createdby: {
                '$regex': re
            }
        }).toArray(function(e, res) {
            if (e) throw e;
            if (res) { //if user exists in collection
                deferred.resolve(res);
            } else {
                deferred.resolve([]); //nothing found --> []
            }
        })
        return deferred.promise;
    },
    getFollowers: function(userid) {
        var deferred = new Deferred();
        //get pages that the user is following
        var re = new RegExp(userid, 'gi');
        following.findOne({
            user: {
                '$regex': re
            }
        }, function(e, res) {
            if (e) throw e; //incase of any errors, stop!
            if (res) { //user exist, do something...
                var results = res;
                console.info("We found something...");
                /* - get user page array - */
                var pages = res.following
                deferred.resolve(pages); //an array of pages returned
            } else { //respond back               
                //if nothing was found
                deferred.resolve([]) //empty array
            }
        })
        return deferred.promise;
    },
    addFollower: function(page, userid, respond) {
        var f = schemas.following
        //see if the user is following anyone
        app.getFollowers(userid).then(function(results) {
            var message = "User is now following page at " + moment().format()
            if (!_.isEmpty(results)) { //if he is following any page
                var userSearch = {userid: userid}
                //find user and update following base
                following.update(userSearch, {'$push': {following: page}}, function(e) {
                    //page pushed to array of following
                    if (e) throw e;
                    else {
                        if (respond) respond.json({
                            status: 200,
                            message: message
                        });
                    }
                })
            } else { //if not
                f.user = userid;
                f.following = [page]; //1st following array
                following.insert(f, function(e, res) {
                    if (e) throw e;
                    if (res) {
                        console.info(message);
                        if (respond) r.json({
                            status: 200,
                            message: message
                        });
                    }
                })
            }
        });
    },
    removeFollower: function(page, userid, respond) {
        //see if the user is following anyone
        app.getFollowers(userid).then(function(results) {
            var message = "User has stopped following at " + moment().format()
            if (!uc.isEmpty(results)) { //if he is following any page
                var userSearch = {userid: userid}
                //find user and update following base
                following.update(userSearch, {'$pull': {following: page}}, function(e) {
                    //page pushed to array of following
                    if (e) throw e;
                    else {
                        if (respond) respond.json({
                            status: 200,
                            message: message
                        });
                    }
                })
            } else { //if not
                r.json({
                    status: 200,
                    message: "You are not following any page at the moment"
                });
            }
        });
    },
    //if direct from app join both user and pages prior as string - "userid, pageid, pageid"
    getNewsFeed: function(ids, userid) {
        var deferred = new Deferred();
        var search = $.map(ids, function(m, i) {
            return m.toString();
        });
        //do the search now
        console.log("getting newfeed from this array - ", search);
        posts.find({
            '$query': {
                '$or': [{
                    createdby: userid
                }, {
                    pageid: {
                        '$in': search
                    }
                }]
            },
            '$orderby': {
                createdat: -1
            }
        }, {
            limit: 30
        }).toArray(function(e, res) {
            if (e) throw e;
            if (res) {
                deferred.resolve(res)
            } else {
                deferred.resolve([])
            }
        }) //.limit(30); //max 30 posts
        return deferred.promise;
    },
    getPageFeed: function(pageid) {
        var deferred = new Deferred();
        //check page exist 1st
        app.viewPage(pageid).then(function(r) {
            if (!r.status) { //if page was found
                // simple mongodb OR statement  -- {'$or': [{createdby: pageid}, ]}
                var re = new RegExp(pageid, 'gi');
                posts.find({
                    '$query': {
                        '$or': [{
                            createdby: {
                                '$regex': re
                            }
                        }, {
                            pageid: {
                                '$regex': pageid
                            }
                        }]
                    },
                    '$orderby': {
                        createdat: -1
                    }
                }, {
                    limit: 30
                }).toArray(function(e, res) {
                    if (e) throw e;
                    if (res) { //if you got back any page feeds
                        deferred.resolve({
                            page: r,
                            posts: res
                        })
                    } else {
                        deferred.resolve([])
                    }
                })
            } else {
                //no page was found, just return this reason 1st
                deferred.resolve(r);
            }
        })
        return deferred.promise;
    },
    searchPage: function(param) {
        var deferred =  new Deferred();
        // param = '^(' + param.toLowerCase() + ')\\s?[\\w.-]+?$'
        var re = new RegExp(param, 'gi'); console.log(re)
        //now search the DB
        //FAILED (returns ids only) - {'$or': [{firstname: {'$regex': re}}, {lastname: {'$regex': re}}]}, {'$limit': 30}
        pages.find({fullNames: {'$regex': re}}).toArray(function(e, res) {
            if(e) throw e;
            if(res && !_.isEmpty(res)) {
                var ids = $.map(res, function(m, i) { return m._id; });
                deferred.resolve({status: true, results: res, ids: ids});
            }else{
                deferred.resolve({status: false, message: "Ohw! no page has been found related to the name '" + param + "'"});
            }
        })
        return deferred.promise;
    },
    emptyCollection: function() {
        pages.remove({}, function(e) {});
        users.remove({}, function(e) {});
        posts.remove({}, function(e) {});
        following.remove({}, function(e) {});
    }
}