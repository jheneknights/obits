/*
 * GET users listing.
 */

exports.list = function(req, res) {
    res.send("respond with a resource");
};

exports.feeds = function(req, res) {
    var newsfeed = {
        "feed": {
            "id": req.params.id,
            "user": "Eugene Mutai",
            "posts": [{
                id: 1,
                deceased: true,
                profPic: "images/appbar.user.tie.png",
                username: "Timothy Mwibarua",
                update: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. ",
                deceasedName: "Timothy Mwibarua"
            }, {
                id: 2,
                deceased: false,
                profPic: "images/appbar.user.tie.png",
                username: "David Mbogo",
                update: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. ",
                deceasedName: "Timothy Mwibarua"
            }, {
                id: 3,
                deceased: false,
                profPic: "images/appbar.user.tie.png",
                username: "David Mbogo",
                update: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. ",
                deceasedName: "Timothy Mwibarua"
            }, {
                id: 4,
                deceased: true,
                profPic: "images/appbar.user.tie.png",
                username: "Timothy Mwibarua",
                update: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. ",
                deceasedName: "Timothy Mwibarua"
            }, {
                id: 5,
                deceased: false,
                profPic: "images/appbar.user.tie.png",
                username: "David Mbogo",
                update: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. ",
                deceasedName: "Timothy Mwibarua"
            }, {
                id: 6,
                deceased: true,
                profPic: "images/appbar.user.tie.png",
                username: "Timothy Mwibarua",
                update: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. ",
                deceasedName: "Timothy Mwibarua"
            }, {
                id: 7,
                deceased: false,
                profPic: "images/appbar.user.tie.png",
                username: "David Mbogo",
                update: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. ",
                deceasedName: "Timothy Mwibarua"
            }]
        }
    };
    //Send back the JSON response   
    res.json(newsfeed);
}